// Package sharecode 生成分享链接使用的随机码。
package sharecode

import (
	"crypto/rand"
	"math/big"
)

const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// Generate 返回长度为 n 的随机 Base62 字符串。
// 使用 crypto/rand 生成，避免分享码被枚举猜测到他人的报告。
func Generate(n int) string {
	if n <= 0 {
		return ""
	}

	maxLen := big.NewInt(int64(len(charset)))
	b := make([]byte, n)
	for i := range b {
		// crypto/rand 出错在现实中不可达；退化为字符集首字符，保证不 panic
		idx, err := rand.Int(rand.Reader, maxLen)
		if err != nil {
			b[i] = charset[0]
			continue
		}
		b[i] = charset[idx.Int64()]
	}

	return string(b)
}
