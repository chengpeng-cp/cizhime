package errno

import (
	"fmt"
)

type ErrNo struct {
	Code    int
	Message string
}

func (e ErrNo) Error() string {
	return e.Message
}

func (e ErrNo) WithMessage(msg string) ErrNo {
	return ErrNo{
		Code:    e.Code,
		Message: fmt.Sprintf("%s: %s", e.Message, msg),
	}
}

var (
	OK               = ErrNo{Code: 0, Message: "成功"}
	ErrUnknown       = ErrNo{Code: 10000, Message: "未知错误"}
	ErrInternal      = ErrNo{Code: 10001, Message: "服务器内部错误"}
	ErrInvalidParams = ErrNo{Code: 10002, Message: "参数错误"}

	ErrUnauthorized    = ErrNo{Code: 20004, Message: "未授权"}
	ErrTokenInvalid    = ErrNo{Code: 20005, Message: "Token无效"}
	ErrPermission      = ErrNo{Code: 20006, Message: "权限不足"}

	// 限流
	ErrTooManyRequests = ErrNo{Code: 40001, Message: "请求过于频繁，请稍后再试"}

	// 业务错误码
	ErrInvalidAgentStyle = ErrNo{Code: 30001, Message: "不支持的Agent风格"}
	ErrAIAnalyzeFailed   = ErrNo{Code: 30002, Message: "AI分析失败"}
	ErrReportNotFound    = ErrNo{Code: 30003, Message: "报告不存在"}
	ErrShareCodeExists   = ErrNo{Code: 30004, Message: "分享码生成失败"}
	ErrAITimeout         = ErrNo{Code: 30005, Message: "AI 响应超时，请稍后重试"}
	ErrAIBusy            = ErrNo{Code: 30006, Message: "AI 服务繁忙，请稍后重试"}
)

func ErrNew(code int, message string) error {
	return ErrNo{Code: code, Message: message}
}
