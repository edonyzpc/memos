package v1

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/cel-go/cel"
	"github.com/lithammer/shortuuid/v4"
	"github.com/pkg/errors"
	"github.com/yourselfhosted/gomark/parser"
	"github.com/yourselfhosted/gomark/parser/tokenizer"
	expr "google.golang.org/genproto/googleapis/api/expr/v1alpha1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/usememos/memos/internal/util"
	"github.com/usememos/memos/plugin/webhook"
	v1pb "github.com/usememos/memos/proto/gen/api/v1"
	storepb "github.com/usememos/memos/proto/gen/store"
	"github.com/usememos/memos/store"
)

const (
	DefaultPageSize  = 10
	MaxContentLength = 8 * 1024
	ChunkSize        = 64 * 1024 // 64 KiB
)

func (s *APIV1Service) CreateMemo(ctx context.Context, request *v1pb.CreateMemoRequest) (*v1pb.Memo, error) {
	user, err := getCurrentUser(ctx, s.Store)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user")
	}
	if user == nil {
		return nil, status.Errorf(codes.PermissionDenied, "permission denied")
	}
	if len(request.Content) > MaxContentLength {
		return nil, status.Errorf(codes.InvalidArgument, "content too long")
	}

	create := &store.Memo{
		UID:        shortuuid.New(),
		CreatorID:  user.ID,
		Content:    request.Content,
		Visibility: convertVisibilityToStore(request.Visibility),
	}
	workspaceMemoRelatedSetting, err := s.Store.GetWorkspaceMemoRelatedSetting(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get workspace memo related setting")
	}
	if workspaceMemoRelatedSetting.DisallowPublicVisible && create.Visibility == store.Public {
		return nil, status.Errorf(codes.PermissionDenied, "disable public memos system setting is enabled")
	}

	memo, err := s.Store.CreateMemo(ctx, create)
	if err != nil {
		return nil, err
	}

	memoMessage, err := s.convertMemoFromStore(ctx, memo)
	if err != nil {
		return nil, errors.Wrap(err, "failed to convert memo")
	}
	// Try to dispatch webhook when memo is created.
	if err := s.DispatchMemoCreatedWebhook(ctx, memoMessage); err != nil {
		slog.Warn("Failed to dispatch memo created webhook", err)
	}
	// Send notification to telegram if memo is not private.
	//if memoMessage.Visibility != v1pb.Visibility_PRIVATE {
	//	// fetch all telegram UserID
	//	userSettings, err := s.Store.ListUserSettings(ctx, &store.FindUserSetting{Key: storepb.UserSettingKey_USER_SETTING_TELEGRAM_USER_ID})
	//	if err != nil {
	//		log.Warn("Failed to ListUserSettings")
	//	}
	//	for _, userSetting := range userSettings {
	//		tgUserID, err := strconv.ParseInt(userSetting.GetTelegramUserId(), 10, 64)
	//		if err != nil {
	//			log.Error("failed to parse Telegram UserID", zap.Error(err))
	//			continue
	//		}
	//
	//		// send notification to telegram
	//		telegramBot := telegram.NewBotWithHandler(custom.NewTelegramHandler(s.Store))
	//		content := memoMessage.Creator + " Says:\n\n" + memoMessage.Content
	//		_, err = telegramBot.SendMessage(ctx, tgUserID, content)
	//		if err != nil {
	//			log.Error("Failed to send Telegram notification", zap.Error(err))
	//			continue
	//		}
	//
	//		// send HTML notification to telegram group
	//		// According to https://core.telegram.org/bots/api#html-style,
	//		// Telegram HTML has a lot wired condition. And I cannot do some formatting things for now
	//		// API Test: https://api.telegram.org/bot{BOT-TOKEN}/sendMessage?chat_id={CHAT-ID}&parse_mode=HTML&text=%3Ca%20href=%22twitter.edony.ink%22%3E@memos%20says:%20%3C/a%3E%3Cpre%3E%20%3C/pre%3E%3Cpre%3Etest%20newline%3C/pre%3E
	//		memoURL := "https://twitter.edony.ink/m/" + fmt.Sprint(memoMessage.Name)
	//		contentGroup := `<a href="` + memoURL + `">@memos</a> says: <code class="language-markdown">` + "\n" + memoMessage.Content + `</code>`
	//		_, err = telegramBot.SendHTMLMessage(ctx, -1001233204358, contentGroup)
	//		if err != nil {
	//			log.Error("Failed to send Telegram notification", zap.Error(err))
	//			continue
	//		}
	//	}
	//}

	return memoMessage, nil
}

func (s *APIV1Service) ListMemos(ctx context.Context, request *v1pb.ListMemosRequest) (*v1pb.ListMemosResponse, error) {
	memoFind := &store.FindMemo{
		// Exclude comments by default.
		ExcludeComments: true,
	}
	if err := s.buildMemoFindWithFilter(ctx, memoFind, request.Filter); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "failed to build find memos with filter")
	}

	var limit, offset int
	if request.PageToken != "" {
		var pageToken v1pb.PageToken
		if err := unmarshalPageToken(request.PageToken, &pageToken); err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid page token: %v", err)
		}
		limit = int(pageToken.Limit)
		offset = int(pageToken.Offset)
	} else {
		limit = int(request.PageSize)
	}
	if limit <= 0 {
		limit = DefaultPageSize
	}
	limitPlusOne := limit + 1
	memoFind.Limit = &limitPlusOne
	memoFind.Offset = &offset
	memos, err := s.Store.ListMemos(ctx, memoFind)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list memos: %v", err)
	}

	memoMessages := []*v1pb.Memo{}
	nextPageToken := ""
	if len(memos) == limitPlusOne {
		memos = memos[:limit]
		nextPageToken, err = getPageToken(limit, offset+limit)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to get next page token, error: %v", err)
		}
	}
	for _, memo := range memos {
		memoMessage, err := s.convertMemoFromStore(ctx, memo)
		if err != nil {
			return nil, errors.Wrap(err, "failed to convert memo")
		}
		memoMessages = append(memoMessages, memoMessage)
	}

	response := &v1pb.ListMemosResponse{
		Memos:         memoMessages,
		NextPageToken: nextPageToken,
	}
	return response, nil
}

func (s *APIV1Service) SearchMemos(ctx context.Context, request *v1pb.SearchMemosRequest) (*v1pb.SearchMemosResponse, error) {
	defaultSearchLimit := 10
	memoFind := &store.FindMemo{
		// Exclude comments by default.
		ExcludeComments: true,
		Limit:           &defaultSearchLimit,
	}
	err := s.buildMemoFindWithFilter(ctx, memoFind, request.Filter)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "failed to build find memos with filter")
	}

	memos, err := s.Store.ListMemos(ctx, memoFind)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to search memos")
	}

	memoMessages := []*v1pb.Memo{}
	for _, memo := range memos {
		memoMessage, err := s.convertMemoFromStore(ctx, memo)
		if err != nil {
			return nil, errors.Wrap(err, "failed to convert memo")
		}
		memoMessages = append(memoMessages, memoMessage)
	}

	response := &v1pb.SearchMemosResponse{
		Memos: memoMessages,
	}
	return response, nil
}

func (s *APIV1Service) GetMemo(ctx context.Context, request *v1pb.GetMemoRequest) (*v1pb.Memo, error) {
	id, err := ExtractMemoIDFromName(request.Name)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid memo name: %v", err)
	}
	memo, err := s.Store.GetMemo(ctx, &store.FindMemo{
		ID: &id,
	})
	if err != nil {
		return nil, err
	}
	if memo == nil {
		return nil, status.Errorf(codes.NotFound, "memo not found")
	}
	if memo.Visibility != store.Public {
		user, err := getCurrentUser(ctx, s.Store)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to get user")
		}
		if user == nil {
			return nil, status.Errorf(codes.PermissionDenied, "permission denied")
		}
		if memo.Visibility == store.Private && memo.CreatorID != user.ID {
			return nil, status.Errorf(codes.PermissionDenied, "permission denied")
		}
	}

	memoMessage, err := s.convertMemoFromStore(ctx, memo)
	if err != nil {
		return nil, errors.Wrap(err, "failed to convert memo")
	}
	return memoMessage, nil
}

func (s *APIV1Service) UpdateMemo(ctx context.Context, request *v1pb.UpdateMemoRequest) (*v1pb.Memo, error) {
	id, err := ExtractMemoIDFromName(request.Memo.Name)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid memo name: %v", err)
	}
	if request.UpdateMask == nil || len(request.UpdateMask.Paths) == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "update mask is required")
	}

	memo, err := s.Store.GetMemo(ctx, &store.FindMemo{ID: &id})
	if err != nil {
		return nil, err
	}
	if memo == nil {
		return nil, status.Errorf(codes.NotFound, "memo not found")
	}

	user, _ := getCurrentUser(ctx, s.Store)
	if memo.CreatorID != user.ID {
		return nil, status.Errorf(codes.PermissionDenied, "permission denied")
	}

	currentTs := time.Now().Unix()
	update := &store.UpdateMemo{
		ID:        id,
		UpdatedTs: &currentTs,
	}
	for _, path := range request.UpdateMask.Paths {
		if path == "content" {
			update.Content = &request.Memo.Content
		} else if path == "uid" {
			update.UID = &request.Memo.Name
			if !util.UIDMatcher.MatchString(*update.UID) {
				return nil, status.Errorf(codes.InvalidArgument, "invalid resource name")
			}
		} else if path == "visibility" {
			workspaceMemoRelatedSetting, err := s.Store.GetWorkspaceMemoRelatedSetting(ctx)
			if err != nil {
				return nil, status.Errorf(codes.Internal, "failed to get workspace memo related setting")
			}
			visibility := convertVisibilityToStore(request.Memo.Visibility)
			if workspaceMemoRelatedSetting.DisallowPublicVisible && visibility == store.Public {
				return nil, status.Errorf(codes.PermissionDenied, "disable public memos system setting is enabled")
			}
			update.Visibility = &visibility
		} else if path == "row_status" {
			rowStatus := convertRowStatusToStore(request.Memo.RowStatus)
			update.RowStatus = &rowStatus
		} else if path == "created_ts" {
			createdTs := request.Memo.CreateTime.AsTime().Unix()
			update.CreatedTs = &createdTs
		} else if path == "pinned" {
			if _, err := s.Store.UpsertMemoOrganizer(ctx, &store.MemoOrganizer{
				MemoID: id,
				UserID: user.ID,
				Pinned: request.Memo.Pinned,
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert memo organizer")
			}
		}
	}
	if update.Content != nil && len(*update.Content) > MaxContentLength {
		return nil, status.Errorf(codes.InvalidArgument, "content too long")
	}

	if err = s.Store.UpdateMemo(ctx, update); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update memo")
	}

	memo, err = s.Store.GetMemo(ctx, &store.FindMemo{
		ID: &id,
	})
	if err != nil {
		return nil, errors.Wrap(err, "failed to get memo")
	}
	memoMessage, err := s.convertMemoFromStore(ctx, memo)
	if err != nil {
		return nil, errors.Wrap(err, "failed to convert memo")
	}
	// Try to dispatch webhook when memo is updated.
	if err := s.DispatchMemoUpdatedWebhook(ctx, memoMessage); err != nil {
		slog.Warn("Failed to dispatch memo updated webhook", err)
	}

	return memoMessage, nil
}

func (s *APIV1Service) DeleteMemo(ctx context.Context, request *v1pb.DeleteMemoRequest) (*emptypb.Empty, error) {
	id, err := ExtractMemoIDFromName(request.Name)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid memo name: %v", err)
	}
	memo, err := s.Store.GetMemo(ctx, &store.FindMemo{
		ID: &id,
	})
	if err != nil {
		return nil, err
	}
	if memo == nil {
		return nil, status.Errorf(codes.NotFound, "memo not found")
	}

	user, _ := getCurrentUser(ctx, s.Store)
	if memo.CreatorID != user.ID {
		return nil, status.Errorf(codes.PermissionDenied, "permission denied")
	}

	if memoMessage, err := s.convertMemoFromStore(ctx, memo); err == nil {
		// Try to dispatch webhook when memo is deleted.
		if err := s.DispatchMemoDeletedWebhook(ctx, memoMessage); err != nil {
			slog.Warn("Failed to dispatch memo deleted webhook", err)
		}
	}

	if err = s.Store.DeleteMemo(ctx, &store.DeleteMemo{ID: id}); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete memo")
	}

	return &emptypb.Empty{}, nil
}

func (s *APIV1Service) CreateMemoComment(ctx context.Context, request *v1pb.CreateMemoCommentRequest) (*v1pb.Memo, error) {
	id, err := ExtractMemoIDFromName(request.Name)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid memo name: %v", err)
	}
	relatedMemo, err := s.Store.GetMemo(ctx, &store.FindMemo{ID: &id})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get memo")
	}

	// Create the comment memo first.
	memo, err := s.CreateMemo(ctx, request.Comment)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create memo")
	}

	// Build the relation between the comment memo and the original memo.
	memoID, err := ExtractMemoIDFromName(memo.Name)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid memo name: %v", err)
	}
	_, err = s.Store.UpsertMemoRelation(ctx, &store.MemoRelation{
		MemoID:        memoID,
		RelatedMemoID: relatedMemo.ID,
		Type:          store.MemoRelationComment,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create memo relation")
	}
	creatorID, err := ExtractUserIDFromName(memo.Creator)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid memo creator")
	}
	if memo.Visibility != v1pb.Visibility_PRIVATE && creatorID != relatedMemo.CreatorID {
		activity, err := s.Store.CreateActivity(ctx, &store.Activity{
			CreatorID: creatorID,
			Type:      store.ActivityTypeMemoComment,
			Level:     store.ActivityLevelInfo,
			Payload: &storepb.ActivityPayload{
				MemoComment: &storepb.ActivityMemoCommentPayload{
					MemoId:        memoID,
					RelatedMemoId: relatedMemo.ID,
				},
			},
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to create activity")
		}
		if _, err := s.Store.CreateInbox(ctx, &store.Inbox{
			SenderID:   creatorID,
			ReceiverID: relatedMemo.CreatorID,
			Status:     store.UNREAD,
			Message: &storepb.InboxMessage{
				Type:       storepb.InboxMessage_TYPE_MEMO_COMMENT,
				ActivityId: &activity.ID,
			},
		}); err != nil {
			return nil, status.Errorf(codes.Internal, "failed to create inbox")
		}
	}

	return memo, nil
}

func (s *APIV1Service) ListMemoComments(ctx context.Context, request *v1pb.ListMemoCommentsRequest) (*v1pb.ListMemoCommentsResponse, error) {
	id, err := ExtractMemoIDFromName(request.Name)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid memo name: %v", err)
	}
	memoRelationComment := store.MemoRelationComment
	memoRelations, err := s.Store.ListMemoRelations(ctx, &store.FindMemoRelation{
		RelatedMemoID: &id,
		Type:          &memoRelationComment,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list memo relations")
	}

	var memos []*v1pb.Memo
	for _, memoRelation := range memoRelations {
		memo, err := s.Store.GetMemo(ctx, &store.FindMemo{
			ID: &memoRelation.MemoID,
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to get memo")
		}
		if memo != nil {
			memoMessage, err := s.convertMemoFromStore(ctx, memo)
			if err != nil {
				return nil, errors.Wrap(err, "failed to convert memo")
			}
			memos = append(memos, memoMessage)
		}
	}

	response := &v1pb.ListMemoCommentsResponse{
		Memos: memos,
	}
	return response, nil
}

func (s *APIV1Service) GetUserMemosStats(ctx context.Context, request *v1pb.GetUserMemosStatsRequest) (*v1pb.GetUserMemosStatsResponse, error) {
	userID, err := ExtractUserIDFromName(request.Name)
	if err != nil {
		return nil, errors.Wrap(err, "invalid user name")
	}
	user, err := s.Store.GetUser(ctx, &store.FindUser{
		ID: &userID,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user")
	}
	if user == nil {
		return nil, status.Errorf(codes.NotFound, "user not found")
	}

	normalRowStatus := store.Normal
	memoFind := &store.FindMemo{
		CreatorID:       &user.ID,
		RowStatus:       &normalRowStatus,
		ExcludeComments: true,
		ExcludeContent:  true,
	}
	if err := s.buildMemoFindWithFilter(ctx, memoFind, request.Filter); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "failed to build find memos with filter")
	}

	memos, err := s.Store.ListMemos(ctx, memoFind)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list memos: %v", err)
	}

	location, err := time.LoadLocation(request.Timezone)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "invalid timezone location")
	}

	workspaceMemoRelatedSetting, err := s.Store.GetWorkspaceMemoRelatedSetting(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get workspace memo related setting")
	}
	stats := make(map[string]int32)
	for _, memo := range memos {
		displayTs := memo.CreatedTs
		if workspaceMemoRelatedSetting.DisplayWithUpdateTime {
			displayTs = memo.UpdatedTs
		}
		stats[time.Unix(displayTs, 0).In(location).Format("2006-01-02")]++
	}

	response := &v1pb.GetUserMemosStatsResponse{
		Stats: stats,
	}
	return response, nil
}

func (s *APIV1Service) ExportMemos(ctx context.Context, request *v1pb.ExportMemosRequest) (*v1pb.ExportMemosResponse, error) {
	normalRowStatus := store.Normal
	memoFind := &store.FindMemo{
		RowStatus: &normalRowStatus,
		// Exclude comments by default.
		ExcludeComments: true,
	}
	if err := s.buildMemoFindWithFilter(ctx, memoFind, request.Filter); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to build find memos with filter: %v", err)
	}

	memos, err := s.Store.ListMemos(ctx, memoFind)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list memos: %v", err)
	}

	buf := new(bytes.Buffer)
	writer := zip.NewWriter(buf)
	for _, memo := range memos {
		memoMessage, err := s.convertMemoFromStore(ctx, memo)
		if err != nil {
			return nil, errors.Wrap(err, "failed to convert memo")
		}
		file, err := writer.Create(time.Unix(memo.CreatedTs, 0).Format(time.RFC3339) + ".md")
		if err != nil {
			return nil, status.Errorf(codes.Internal, "Failed to create memo file")
		}
		_, err = file.Write([]byte(memoMessage.Content))
		if err != nil {
			return nil, status.Errorf(codes.Internal, "Failed to write to memo file")
		}
	}
	if err := writer.Close(); err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to close zip file writer")
	}

	return &v1pb.ExportMemosResponse{
		Content: buf.Bytes(),
	}, nil
}

func (s *APIV1Service) convertMemoFromStore(ctx context.Context, memo *store.Memo) (*v1pb.Memo, error) {
	displayTs := memo.CreatedTs
	workspaceMemoRelatedSetting, err := s.Store.GetWorkspaceMemoRelatedSetting(ctx)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get workspace memo related setting")
	}
	if workspaceMemoRelatedSetting.DisplayWithUpdateTime {
		displayTs = memo.UpdatedTs
	}

	creator, err := s.Store.GetUser(ctx, &store.FindUser{ID: &memo.CreatorID})
	if err != nil {
		return nil, errors.Wrap(err, "failed to get creator")
	}

	name := fmt.Sprintf("%s%d", MemoNamePrefix, memo.ID)
	listMemoRelationsResponse, err := s.ListMemoRelations(ctx, &v1pb.ListMemoRelationsRequest{Name: name})
	if err != nil {
		return nil, errors.Wrap(err, "failed to list memo relations")
	}

	listMemoResourcesResponse, err := s.ListMemoResources(ctx, &v1pb.ListMemoResourcesRequest{Name: name})
	if err != nil {
		return nil, errors.Wrap(err, "failed to list memo resources")
	}

	listMemoReactionsResponse, err := s.ListMemoReactions(ctx, &v1pb.ListMemoReactionsRequest{Name: name})
	if err != nil {
		return nil, errors.Wrap(err, "failed to list memo reactions")
	}

	nodes, err := parser.Parse(tokenizer.Tokenize(memo.Content))
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse content")
	}

	return &v1pb.Memo{
		Name:        name,
		Uid:         memo.UID,
		RowStatus:   convertRowStatusFromStore(memo.RowStatus),
		Creator:     fmt.Sprintf("%s%d", UserNamePrefix, creator.ID),
		CreateTime:  timestamppb.New(time.Unix(memo.CreatedTs, 0)),
		UpdateTime:  timestamppb.New(time.Unix(memo.UpdatedTs, 0)),
		DisplayTime: timestamppb.New(time.Unix(displayTs, 0)),
		Content:     memo.Content,
		Nodes:       convertFromASTNodes(nodes),
		Visibility:  convertVisibilityFromStore(memo.Visibility),
		Pinned:      memo.Pinned,
		ParentId:    memo.ParentID,
		Relations:   listMemoRelationsResponse.Relations,
		Resources:   listMemoResourcesResponse.Resources,
		Reactions:   listMemoReactionsResponse.Reactions,
	}, nil
}

func convertVisibilityFromStore(visibility store.Visibility) v1pb.Visibility {
	switch visibility {
	case store.Private:
		return v1pb.Visibility_PRIVATE
	case store.Protected:
		return v1pb.Visibility_PROTECTED
	case store.Public:
		return v1pb.Visibility_PUBLIC
	default:
		return v1pb.Visibility_VISIBILITY_UNSPECIFIED
	}
}

func convertVisibilityToStore(visibility v1pb.Visibility) store.Visibility {
	switch visibility {
	case v1pb.Visibility_PRIVATE:
		return store.Private
	case v1pb.Visibility_PROTECTED:
		return store.Protected
	case v1pb.Visibility_PUBLIC:
		return store.Public
	default:
		return store.Private
	}
}

func (s *APIV1Service) buildMemoFindWithFilter(ctx context.Context, find *store.FindMemo, filter string) error {
	user, _ := getCurrentUser(ctx, s.Store)
	if find == nil {
		find = &store.FindMemo{}
	}
	if filter != "" {
		filter, err := parseSearchMemosFilter(filter)
		if err != nil {
			return status.Errorf(codes.InvalidArgument, "invalid filter: %v", err)
		}
		if len(filter.ContentSearch) > 0 {
			find.ContentSearch = filter.ContentSearch
		}
		if len(filter.Visibilities) > 0 {
			find.VisibilityList = filter.Visibilities
		}
		if filter.OrderByPinned {
			find.OrderByPinned = filter.OrderByPinned
		}
		if filter.DisplayTimeAfter != nil {
			workspaceMemoRelatedSetting, err := s.Store.GetWorkspaceMemoRelatedSetting(ctx)
			if err != nil {
				return status.Errorf(codes.Internal, "failed to get workspace memo related setting")
			}
			if workspaceMemoRelatedSetting.DisplayWithUpdateTime {
				find.UpdatedTsAfter = filter.DisplayTimeAfter
			} else {
				find.CreatedTsAfter = filter.DisplayTimeAfter
			}
		}
		if filter.DisplayTimeBefore != nil {
			workspaceMemoRelatedSetting, err := s.Store.GetWorkspaceMemoRelatedSetting(ctx)
			if err != nil {
				return status.Errorf(codes.Internal, "failed to get workspace memo related setting")
			}
			if workspaceMemoRelatedSetting.DisplayWithUpdateTime {
				find.UpdatedTsBefore = filter.DisplayTimeBefore
			} else {
				find.CreatedTsBefore = filter.DisplayTimeBefore
			}
		}
		if filter.Creator != nil {
			userID, err := ExtractUserIDFromName(*filter.Creator)
			if err != nil {
				return errors.Wrap(err, "invalid user name")
			}
			user, err := s.Store.GetUser(ctx, &store.FindUser{
				ID: &userID,
			})
			if err != nil {
				return status.Errorf(codes.Internal, "failed to get user")
			}
			if user == nil {
				return status.Errorf(codes.NotFound, "user not found")
			}
			find.CreatorID = &user.ID
		}
		if filter.UID != nil {
			find.UID = filter.UID
		}
		if filter.RowStatus != nil {
			find.RowStatus = filter.RowStatus
		}
		if filter.Random {
			find.Random = filter.Random
		}
		if filter.Limit != nil {
			find.Limit = filter.Limit
		}
		if filter.IncludeComments {
			find.ExcludeComments = false
		}
	}

	// If the user is not authenticated, only public memos are visible.
	if user == nil {
		if filter == "" {
			// If no filter is provided, return an error.
			return status.Errorf(codes.InvalidArgument, "filter is required")
		}

		find.VisibilityList = []store.Visibility{store.Public}
	} else if find.CreatorID != nil && *find.CreatorID != user.ID {
		find.VisibilityList = []store.Visibility{store.Public, store.Protected}
	}

	workspaceMemoRelatedSetting, err := s.Store.GetWorkspaceMemoRelatedSetting(ctx)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to get workspace memo related setting")
	}
	if workspaceMemoRelatedSetting.DisplayWithUpdateTime {
		find.OrderByUpdatedTs = true
	}
	return nil
}

// SearchMemosFilterCELAttributes are the CEL attributes.
var SearchMemosFilterCELAttributes = []cel.EnvOption{
	cel.Variable("content_search", cel.ListType(cel.StringType)),
	cel.Variable("visibilities", cel.ListType(cel.StringType)),
	cel.Variable("order_by_pinned", cel.BoolType),
	cel.Variable("display_time_before", cel.IntType),
	cel.Variable("display_time_after", cel.IntType),
	cel.Variable("creator", cel.StringType),
	cel.Variable("uid", cel.StringType),
	cel.Variable("row_status", cel.StringType),
	cel.Variable("random", cel.BoolType),
	cel.Variable("limit", cel.IntType),
	cel.Variable("include_comments", cel.BoolType),
}

type SearchMemosFilter struct {
	ContentSearch     []string
	Visibilities      []store.Visibility
	OrderByPinned     bool
	DisplayTimeBefore *int64
	DisplayTimeAfter  *int64
	Creator           *string
	UID               *string
	RowStatus         *store.RowStatus
	Random            bool
	Limit             *int
	IncludeComments   bool
}

func parseSearchMemosFilter(expression string) (*SearchMemosFilter, error) {
	e, err := cel.NewEnv(SearchMemosFilterCELAttributes...)
	if err != nil {
		return nil, err
	}
	ast, issues := e.Compile(expression)
	if issues != nil {
		return nil, errors.Errorf("found issue %v", issues)
	}
	filter := &SearchMemosFilter{}
	expr, err := cel.AstToParsedExpr(ast)
	if err != nil {
		return nil, err
	}
	callExpr := expr.GetExpr().GetCallExpr()
	findSearchMemosField(callExpr, filter)
	return filter, nil
}

func findSearchMemosField(callExpr *expr.Expr_Call, filter *SearchMemosFilter) {
	if len(callExpr.Args) == 2 {
		idExpr := callExpr.Args[0].GetIdentExpr()
		if idExpr != nil {
			if idExpr.Name == "content_search" {
				contentSearch := []string{}
				for _, expr := range callExpr.Args[1].GetListExpr().GetElements() {
					value := expr.GetConstExpr().GetStringValue()
					contentSearch = append(contentSearch, value)
				}
				filter.ContentSearch = contentSearch
			} else if idExpr.Name == "visibilities" {
				visibilities := []store.Visibility{}
				for _, expr := range callExpr.Args[1].GetListExpr().GetElements() {
					value := expr.GetConstExpr().GetStringValue()
					visibilities = append(visibilities, store.Visibility(value))
				}
				filter.Visibilities = visibilities
			} else if idExpr.Name == "order_by_pinned" {
				value := callExpr.Args[1].GetConstExpr().GetBoolValue()
				filter.OrderByPinned = value
			} else if idExpr.Name == "display_time_before" {
				displayTimeBefore := callExpr.Args[1].GetConstExpr().GetInt64Value()
				filter.DisplayTimeBefore = &displayTimeBefore
			} else if idExpr.Name == "display_time_after" {
				displayTimeAfter := callExpr.Args[1].GetConstExpr().GetInt64Value()
				filter.DisplayTimeAfter = &displayTimeAfter
			} else if idExpr.Name == "creator" {
				creator := callExpr.Args[1].GetConstExpr().GetStringValue()
				filter.Creator = &creator
			} else if idExpr.Name == "uid" {
				uid := callExpr.Args[1].GetConstExpr().GetStringValue()
				filter.UID = &uid
			} else if idExpr.Name == "row_status" {
				rowStatus := store.RowStatus(callExpr.Args[1].GetConstExpr().GetStringValue())
				filter.RowStatus = &rowStatus
			} else if idExpr.Name == "random" {
				value := callExpr.Args[1].GetConstExpr().GetBoolValue()
				filter.Random = value
			} else if idExpr.Name == "limit" {
				limit := int(callExpr.Args[1].GetConstExpr().GetInt64Value())
				filter.Limit = &limit
			} else if idExpr.Name == "include_comments" {
				value := callExpr.Args[1].GetConstExpr().GetBoolValue()
				filter.IncludeComments = value
			}
			return
		}
	}
	for _, arg := range callExpr.Args {
		callExpr := arg.GetCallExpr()
		if callExpr != nil {
			findSearchMemosField(callExpr, filter)
		}
	}
}

// DispatchMemoCreatedWebhook dispatches webhook when memo is created.
func (s *APIV1Service) DispatchMemoCreatedWebhook(ctx context.Context, memo *v1pb.Memo) error {
	return s.dispatchMemoRelatedWebhook(ctx, memo, "memos.memo.created")
}

// DispatchMemoUpdatedWebhook dispatches webhook when memo is updated.
func (s *APIV1Service) DispatchMemoUpdatedWebhook(ctx context.Context, memo *v1pb.Memo) error {
	return s.dispatchMemoRelatedWebhook(ctx, memo, "memos.memo.updated")
}

// DispatchMemoDeletedWebhook dispatches webhook when memo is deleted.
func (s *APIV1Service) DispatchMemoDeletedWebhook(ctx context.Context, memo *v1pb.Memo) error {
	return s.dispatchMemoRelatedWebhook(ctx, memo, "memos.memo.deleted")
}

func (s *APIV1Service) dispatchMemoRelatedWebhook(ctx context.Context, memo *v1pb.Memo, activityType string) error {
	creatorID, err := ExtractUserIDFromName(memo.Creator)
	if err != nil {
		return status.Errorf(codes.InvalidArgument, "invalid memo creator")
	}
	webhooks, err := s.Store.ListWebhooks(ctx, &store.FindWebhook{
		CreatorID: &creatorID,
	})
	if err != nil {
		return err
	}
	for _, hook := range webhooks {
		payload, err := convertMemoToWebhookPayload(memo)
		if err != nil {
			return errors.Wrap(err, "failed to convert memo to webhook payload")
		}
		payload.ActivityType = activityType
		payload.URL = hook.URL
		if err := webhook.Post(*payload); err != nil {
			return errors.Wrap(err, "failed to post webhook")
		}
	}
	return nil
}

func convertMemoToWebhookPayload(memo *v1pb.Memo) (*webhook.WebhookPayload, error) {
	creatorID, err := ExtractUserIDFromName(memo.Creator)
	if err != nil {
		return nil, errors.Wrap(err, "invalid memo creator")
	}
	id, err := ExtractMemoIDFromName(memo.Name)
	if err != nil {
		return nil, errors.Wrap(err, "invalid memo name")
	}
	return &webhook.WebhookPayload{
		CreatorID: creatorID,
		CreatedTs: time.Now().Unix(),
		Memo: &webhook.Memo{
			ID:         id,
			CreatorID:  creatorID,
			CreatedTs:  memo.CreateTime.Seconds,
			UpdatedTs:  memo.UpdateTime.Seconds,
			Content:    memo.Content,
			Visibility: memo.Visibility.String(),
			Pinned:     memo.Pinned,
			ResourceList: func() []*webhook.Resource {
				resources := []*webhook.Resource{}
				for _, resource := range memo.Resources {
					resources = append(resources, &webhook.Resource{
						UID:          resource.Uid,
						Filename:     resource.Filename,
						ExternalLink: resource.ExternalLink,
						Type:         resource.Type,
						Size:         resource.Size,
					})
				}
				return resources
			}(),
		},
	}, nil
}
