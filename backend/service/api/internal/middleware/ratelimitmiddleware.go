package middleware

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"cizhima-backend/pkg/errno"
	"cizhima-backend/pkg/response"
)

// gcKeyThreshold 记录的不同客户端数超过该阈值时触发一次过期清理，避免长期运行内存无限增长
const gcKeyThreshold = 10000

type RateLimiter struct {
	mu       sync.Mutex
	requests map[string][]time.Time
	limit    int
	window   time.Duration
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	windowStart := now.Add(-rl.window)

	// 惰性清理：删除窗口已过期的键，防止 map 无限增长
	if len(rl.requests) >= gcKeyThreshold {
		for k, v := range rl.requests {
			if len(v) == 0 || !v[len(v)-1].After(windowStart) {
				delete(rl.requests, k)
			}
		}
	}

	var valid []time.Time
	for _, t := range rl.requests[key] {
		if t.After(windowStart) {
			valid = append(valid, t)
		}
	}

	if len(valid) >= rl.limit {
		rl.requests[key] = valid
		return false
	}

	valid = append(valid, now)
	rl.requests[key] = valid
	return true
}

// RateLimitMiddleware 基于客户端 IP 的滑动窗口限流中间件
func RateLimitMiddleware(limiter *RateLimiter) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			if !limiter.Allow(clientIP(r)) {
				response.Error(w, errno.ErrTooManyRequests)
				return
			}
			next(w, r)
		}
	}
}

// clientIP 提取真实客户端 IP（兼容 nginx 反向代理场景）
func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if i := strings.IndexByte(xff, ','); i != -1 {
			return strings.TrimSpace(xff[:i])
		}
		return strings.TrimSpace(xff)
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return strings.TrimSpace(xri)
	}
	if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
		return host
	}
	return r.RemoteAddr
}
