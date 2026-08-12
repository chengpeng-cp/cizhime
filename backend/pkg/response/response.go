package response

import (
	"cizhima-backend/pkg/errno"
	"net/http"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/rest/httpx"
)

type Body struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func Response(w http.ResponseWriter, data interface{}, err error) {
	if err == nil {
		httpx.OkJson(w, Body{Code: 0, Message: "成功", Data: data})
		return
	}

	switch e := err.(type) {
	case errno.ErrNo:
		httpx.OkJson(w, Body{Code: e.Code, Message: e.Message})
	default:
		logx.Errorf("internal error: %v", err)
		httpx.OkJson(w, Body{Code: errno.ErrInternal.Code, Message: errno.ErrInternal.Message})
	}
}

func Success(w http.ResponseWriter, data interface{}) {
	httpx.OkJson(w, Body{Code: 0, Message: "成功", Data: data})
}

func Error(w http.ResponseWriter, err error) {
	switch e := err.(type) {
	case errno.ErrNo:
		httpx.OkJson(w, Body{Code: e.Code, Message: e.Message})
	default:
		logx.Errorf("internal error: %v", err)
		httpx.OkJson(w, Body{Code: errno.ErrInternal.Code, Message: errno.ErrInternal.Message})
	}
}
