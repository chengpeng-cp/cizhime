// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.1

package handler

import (
	"net/http"

	"cizhima-backend/pkg/response"
	"cizhima-backend/service/api/internal/logic"
	"cizhima-backend/service/api/internal/svc"
)

func healthHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := logic.NewHealthLogic(r.Context(), svcCtx)
		resp, err := l.Health()
		response.Response(w, resp, err)
	}
}
