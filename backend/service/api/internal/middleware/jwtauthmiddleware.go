package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"cizhima-backend/pkg/errno"
	"cizhima-backend/pkg/response"

	"github.com/golang-jwt/jwt/v4"
)

type JwtAuthMiddleware struct {
	AccessSecret string
}

func NewJwtAuthMiddleware(accessSecret string) *JwtAuthMiddleware {
	return &JwtAuthMiddleware{AccessSecret: accessSecret}
}

type JwtAuthClaims struct {
	UserId uint   `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func (m *JwtAuthMiddleware) Handle(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := m.parseToken(r)
		if token == "" {
			response.Error(w, errno.ErrUnauthorized)
			return
		}

		claims, err := m.validateToken(token)
		if err != nil {
			response.Error(w, errno.ErrTokenInvalid)
			return
		}

		ctx := context.WithValue(r.Context(), "userId", uint64(claims.UserId))
		r = r.WithContext(ctx)
		next(w, r)
	}
}

func (m *JwtAuthMiddleware) parseToken(r *http.Request) string {
	header := r.Header.Get("Authorization")
	prefix := "Bearer "
	if strings.HasPrefix(header, prefix) {
		return header[len(prefix):]
	}
	return ""
}

func (m *JwtAuthMiddleware) validateToken(token string) (*JwtAuthClaims, error) {
	claims := &JwtAuthClaims{}
	_, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(m.AccessSecret), nil
	})
	return claims, err
}
