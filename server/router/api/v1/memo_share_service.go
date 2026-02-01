package v1

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"google.golang.org/genproto/googleapis/api/httpbody"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	v1pb "github.com/usememos/memos/proto/gen/api/v1"
	"github.com/usememos/memos/store"
)

func (s *APIV1Service) GetShareMemo(ctx context.Context, request *v1pb.GetShareMemoRequest) (*v1pb.GetShareMemoResponse, error) {
	if request.Id == "" || request.Token == "" {
		return nil, status.Errorf(codes.InvalidArgument, "id and token are required")
	}

	claims, err := ParseShareToken(request.Token, []byte(s.Secret))
	if err != nil {
		return nil, status.Errorf(codes.Unauthenticated, "invalid share token")
	}

	memoUID := normalizeMemoUID(request.Id)
	tokenMemoUID := normalizeMemoUID(claims.Memo)
	if memoUID == "" || tokenMemoUID == "" || memoUID != tokenMemoUID {
		return nil, status.Errorf(codes.PermissionDenied, "share token does not match memo")
	}

	memo, err := s.Store.GetMemo(ctx, &store.FindMemo{UID: &memoUID})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get memo")
	}
	if memo == nil {
		return nil, status.Errorf(codes.NotFound, "memo not found")
	}

	creatorID := memo.CreatorID
	creator, err := s.Store.GetUser(ctx, &store.FindUser{ID: &creatorID})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get memo creator")
	}
	if creator == nil {
		return nil, status.Errorf(codes.NotFound, "memo creator not found")
	}

	attachments, err := s.Store.ListAttachments(ctx, &store.FindAttachment{MemoID: &memo.ID})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list attachments")
	}

	memoMessage, err := s.convertMemoFromStore(ctx, memo, nil, attachments)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to convert memo")
	}

	expiresAt := time.Now().Add(ShareTokenTTL)
	for _, attachment := range memoMessage.Attachments {
		attachment.ExternalLink = buildSignedAttachmentURL(attachment.Name, attachment.Filename, expiresAt, false, s.Secret)
	}

	return &v1pb.GetShareMemoResponse{
		Memo:    memoMessage,
		Creator: convertUserFromStore(creator),
	}, nil
}

func (s *APIV1Service) CreateMemoShareImage(ctx context.Context, request *v1pb.CreateMemoShareImageRequest) (*httpbody.HttpBody, error) {
	if request.Name == "" {
		return nil, status.Errorf(codes.InvalidArgument, "name is required")
	}

	currentUser, err := s.GetCurrentUser(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user")
	}
	if currentUser == nil {
		return nil, status.Errorf(codes.Unauthenticated, "user not authenticated")
	}

	memoUID, err := ExtractMemoUIDFromName(request.Name)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid memo name: %v", err)
	}
	memo, err := s.Store.GetMemo(ctx, &store.FindMemo{UID: &memoUID})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get memo")
	}
	if memo == nil {
		return nil, status.Errorf(codes.NotFound, "memo not found")
	}
	if memo.Visibility == store.Private && memo.CreatorID != currentUser.ID {
		return nil, status.Errorf(codes.PermissionDenied, "permission denied")
	}

	if s.Profile.RenderServiceURL == "" {
		return nil, status.Errorf(codes.FailedPrecondition, "render service URL is not configured")
	}

	token, err := GenerateShareToken(memo.UID, time.Now().Add(ShareTokenTTL), []byte(s.Secret))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to generate share token")
	}

	theme := request.Theme
	if theme == "" {
		theme = "light"
	}
	locale := request.Locale
	if locale == "" {
		locale = "zh-Hans"
	}
	mode := request.Mode
	if mode == "" {
		mode = "auto"
	}

	payload := map[string]any{
		"memoId": memo.UID,
		"token":  token,
		"theme":  theme,
		"locale": locale,
		"mode":   mode,
	}
	if request.Width > 0 {
		payload["width"] = request.Width
	}
	if request.Height > 0 {
		payload["height"] = request.Height
	}
	if request.DeviceScaleFactor > 0 {
		payload["deviceScaleFactor"] = request.DeviceScaleFactor
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to marshal render payload")
	}

	renderURL := strings.TrimRight(s.Profile.RenderServiceURL, "/") + "/render/share-memo"
	httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, renderURL, bytes.NewReader(body))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create render request")
	}
	httpRequest.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 25 * time.Second}
	response, err := client.Do(httpRequest)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to call render service")
	}
	defer response.Body.Close()

	if response.StatusCode < 200 || response.StatusCode >= 300 {
		msg, _ := io.ReadAll(response.Body)
		if len(msg) == 0 {
			return nil, status.Errorf(codes.Internal, "render service returned status %d", response.StatusCode)
		}
		return nil, status.Errorf(codes.Internal, "render service error: %s", string(msg))
	}

	imageBytes, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to read render response")
	}

	contentType := response.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "image/png"
	}

	return &httpbody.HttpBody{
		ContentType: contentType,
		Data:        imageBytes,
	}, nil
}

func normalizeMemoUID(value string) string {
	return strings.TrimPrefix(value, "memos/")
}
