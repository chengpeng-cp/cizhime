// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.1

package handler

import (
	"errors"
	"net/http"

	"cizhima-backend/pkg/errno"
	"cizhima-backend/pkg/response"
	"cizhima-backend/service/api/internal/logic"
	"cizhima-backend/service/api/internal/svc"
	"cizhima-backend/service/api/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func analyzeHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 问卷字段固定且自由文本最多 500 字，8 KiB 足以容纳合法请求。
		r.Body = http.MaxBytesReader(w, r.Body, 8<<10)

		var req types.AnalyzeRequest
		if err := httpx.Parse(r, &req); err != nil {
			var maxBytesErr *http.MaxBytesError
			if errors.As(err, &maxBytesErr) {
				response.Error(w, errno.ErrInvalidParams.WithMessage("请求内容过大"))
				return
			}
			response.Error(w, errno.ErrInvalidParams.WithMessage("请求参数格式错误"))
			return
		}

		l := logic.NewAnalyzeLogic(r.Context(), svcCtx)
		resp, err := l.Analyze(&req)
		response.Response(w, resp, err)
	}
}
