// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.1

package handler

import (
	"net/http"

	"cizhima-backend/pkg/response"
	"cizhima-backend/service/api/internal/logic"
	"cizhima-backend/service/api/internal/svc"
	"cizhima-backend/service/api/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func analyzeHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.AnalyzeRequest
		if err := httpx.Parse(r, &req); err != nil {
			response.Error(w, err)
			return
		}

		l := logic.NewAnalyzeLogic(r.Context(), svcCtx)
		resp, err := l.Analyze(&req)
		response.Response(w, resp, err)
	}
}
