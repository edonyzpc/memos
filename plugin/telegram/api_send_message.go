package telegram

import (
	"context"
	"net/url"
	"strconv"
)

// SendReplyMessage make a sendMessage api request.
func (b *Bot) SendReplyMessage(ctx context.Context, chatID, replyID int64, text string) (*Message, error) {
	formData := url.Values{
		"chat_id": {strconv.FormatInt(chatID, 10)},
		"text":    {text},
	}

	if replyID > 0 {
		formData.Set("reply_to_message_id", strconv.FormatInt(replyID, 10))
	}

	var result Message
	err := b.postForm(ctx, "/sendMessage", formData, &result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

// SendMessage make a sendMessage api request.
func (b *Bot) SendMessage(ctx context.Context, chatID int64, text string) (*Message, error) {
	return b.SendReplyMessage(ctx, chatID, 0, text)
}

// about telegram send message parse mode
// Docs: https://stackoverflow.com/questions/38119481/send-bold-italic-text-on-telegram-bot-with-html
//
//	https://core.telegram.org/bots/api#sendmessage
//
// mode: HTML, MarkdownV2
//
// SendHTMLMessage make a sendMessage api request with parse_mod=HTML.
func (b *Bot) SendHTMLMessage(ctx context.Context, chatID int64, text string) (*Message, error) {
	const mod = "HTML"
	formData := url.Values{
		"chat_id":    {strconv.FormatInt(chatID, 10)},
		"text":       {text},
		"parse_mode": {mod},
	}

	var result Message
	err := b.postForm(ctx, "/sendMessage", formData, &result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

// SendHTMLMessage make a sendMessage api request with parse_mod=HTML.
func (b *Bot) SendMarkdownMessage(ctx context.Context, chatID int64, text string) (*Message, error) {
	const mod = "MarkdownV2"
	formData := url.Values{
		"chat_id":    {strconv.FormatInt(chatID, 10)},
		"text":       {text},
		"parse_mode": {mod},
	}

	var result Message
	err := b.postForm(ctx, "/sendMessage", formData, &result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}
