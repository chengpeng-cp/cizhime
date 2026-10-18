package sharecode

import (
	"strings"
	"testing"
)

func TestGenerateLength(t *testing.T) {
	if got := Generate(6); len(got) != 6 {
		t.Fatalf("Generate(6) 长度 = %d, want 6", len(got))
	}
	if got := Generate(16); len(got) != 16 {
		t.Fatalf("Generate(16) 长度 = %d, want 16", len(got))
	}
	if got := Generate(0); got != "" {
		t.Fatalf("Generate(0) = %q, want empty", got)
	}
	if got := Generate(-1); got != "" {
		t.Fatalf("Generate(-1) = %q, want empty", got)
	}
}

func TestGenerateCharset(t *testing.T) {
	for _, c := range Generate(64) {
		if !strings.ContainsRune(charset, c) {
			t.Fatalf("生成了字符集之外的字符: %q", c)
		}
	}
}

func TestGenerateUniqueness(t *testing.T) {
	seen := make(map[string]struct{}, 2000)
	for i := 0; i < 2000; i++ {
		code := Generate(6)
		if _, ok := seen[code]; ok {
			t.Fatalf("生成了重复分享码: %s", code)
		}
		seen[code] = struct{}{}
	}
}
