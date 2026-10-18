package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestRateLimiterAllow(t *testing.T) {
	rl := NewRateLimiter(2, time.Minute)

	if !rl.Allow("1.1.1.1") || !rl.Allow("1.1.1.1") {
		t.Fatal("前两次请求应放行")
	}
	if rl.Allow("1.1.1.1") {
		t.Fatal("超过限额的请求应被拒绝")
	}
	if !rl.Allow("2.2.2.2") {
		t.Fatal("不同 key 之间应互不影响")
	}
}

func TestRateLimiterWindowExpiry(t *testing.T) {
	rl := NewRateLimiter(1, 50*time.Millisecond)

	if !rl.Allow("k") {
		t.Fatal("第一次请求应放行")
	}
	if rl.Allow("k") {
		t.Fatal("窗口内第二次请求应被拒绝")
	}

	time.Sleep(60 * time.Millisecond)
	if !rl.Allow("k") {
		t.Fatal("窗口过期后应恢复放行")
	}
}

func TestRateLimitMiddleware(t *testing.T) {
	handler := RateLimitMiddleware(NewRateLimiter(1, time.Minute))(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/analyze", nil)
	req.RemoteAddr = "9.9.9.9:12345"

	rec := httptest.NewRecorder()
	handler(rec, req)
	if rec.Code != http.StatusOK || rec.Body.String() != "ok" {
		t.Fatalf("首次请求应正常透传, got code=%d body=%s", rec.Code, rec.Body.String())
	}

	rec = httptest.NewRecorder()
	handler(rec, req)
	if !strings.Contains(rec.Body.String(), "40001") {
		t.Fatalf("超限请求应返回限流业务码 40001, got %s", rec.Body.String())
	}
}

func TestClientIP(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "10.0.0.1:8080"
	if got := clientIP(req); got != "10.0.0.1" {
		t.Fatalf("clientIP = %q, want 10.0.0.1", got)
	}

	req.Header.Set("X-Forwarded-For", "1.2.3.4, 5.6.7.8")
	if got := clientIP(req); got != "1.2.3.4" {
		t.Fatalf("带 X-Forwarded-For 时 clientIP = %q, want 1.2.3.4", got)
	}

	req2 := httptest.NewRequest(http.MethodGet, "/", nil)
	req2.RemoteAddr = "10.0.0.2:8080"
	req2.Header.Set("X-Real-IP", "6.6.6.6")
	if got := clientIP(req2); got != "6.6.6.6" {
		t.Fatalf("带 X-Real-IP 时 clientIP = %q, want 6.6.6.6", got)
	}
}
