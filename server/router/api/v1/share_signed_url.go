package v1

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/url"
	"strconv"
	"time"
)

const (
	shareAttachmentVariantFull  = "full"
	shareAttachmentVariantThumb = "thumb"
)

func buildAttachmentPath(name, filename string) string {
	escaped := url.PathEscape(filename)
	return fmt.Sprintf("/file/%s/%s", name, escaped)
}

func buildSignedAttachmentURL(name, filename string, expiresAt time.Time, thumbnail bool, secret string) string {
	path := buildAttachmentPath(name, filename)
	exp := expiresAt.Unix()
	variant := shareAttachmentVariantFull
	if thumbnail {
		variant = shareAttachmentVariantThumb
	}
	sig := signAttachmentPath(path, exp, variant, secret)

	values := url.Values{}
	if thumbnail {
		values.Set("thumbnail", "true")
	}
	values.Set("exp", strconv.FormatInt(exp, 10))
	values.Set("sig", sig)

	return fmt.Sprintf("%s?%s", path, values.Encode())
}

func validateSignedAttachmentURL(name, filename string, exp int64, sig string, thumbnail bool, secret string) bool {
	if exp <= 0 || sig == "" {
		return false
	}
	if time.Now().Unix() > exp {
		return false
	}
	path := buildAttachmentPath(name, filename)
	variant := shareAttachmentVariantFull
	if thumbnail {
		variant = shareAttachmentVariantThumb
	}
	expected := signAttachmentPath(path, exp, variant, secret)
	return hmac.Equal([]byte(expected), []byte(sig))
}

func signAttachmentPath(path string, exp int64, variant string, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(path))
	mac.Write([]byte("|"))
	mac.Write([]byte(strconv.FormatInt(exp, 10)))
	mac.Write([]byte("|"))
	mac.Write([]byte(variant))
	return hex.EncodeToString(mac.Sum(nil))
}
