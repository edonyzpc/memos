package v1

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/pkg/errors"
)

const (
	// ShareTokenAudienceName is the audience for share-image JWTs.
	ShareTokenAudienceName = "memo.share-image"
	// ShareTokenTTL is the default token lifetime for share-image tokens.
	ShareTokenTTL = 5 * time.Minute
)

// ShareClaimsMessage represents claims for share-image JWT tokens.
// Memo is the memo UID associated with the token.
type ShareClaimsMessage struct {
	Memo string `json:"memo"`
	jwt.RegisteredClaims
}

// GenerateShareToken generates a short-lived JWT for share-image rendering.
func GenerateShareToken(memoUID string, expirationTime time.Time, secret []byte) (string, error) {
	registeredClaims := jwt.RegisteredClaims{
		Issuer:   Issuer,
		Audience: jwt.ClaimStrings{ShareTokenAudienceName},
		IssuedAt: jwt.NewNumericDate(time.Now()),
		Subject:  memoUID,
	}
	if !expirationTime.IsZero() {
		registeredClaims.ExpiresAt = jwt.NewNumericDate(expirationTime)
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &ShareClaimsMessage{
		Memo:             memoUID,
		RegisteredClaims: registeredClaims,
	})
	token.Header["kid"] = KeyID

	tokenString, err := token.SignedString(secret)
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

// ParseShareToken validates a share-image token and returns its claims.
func ParseShareToken(tokenString string, secret []byte) (*ShareClaimsMessage, error) {
	if tokenString == "" {
		return nil, errors.New("share token is empty")
	}

	claims := &ShareClaimsMessage{}
	parser := jwt.NewParser(
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Name}),
		jwt.WithIssuer(Issuer),
		jwt.WithAudience(ShareTokenAudienceName),
		jwt.WithExpirationRequired(),
	)
	token, err := parser.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (any, error) {
		if kid, ok := t.Header["kid"].(string); ok && kid == KeyID {
			return secret, nil
		}
		return nil, errors.Errorf("unexpected share token kid=%v", t.Header["kid"])
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid or expired share token")
	}

	if claims.Memo == "" {
		claims.Memo = claims.Subject
	}
	if claims.Memo == "" {
		return nil, errors.New("share token memo is empty")
	}

	return claims, nil
}
