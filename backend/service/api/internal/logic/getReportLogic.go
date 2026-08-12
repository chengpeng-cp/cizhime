// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.1

package logic

import (
	"context"
	"encoding/json"

	"cizhima-backend/pkg/errno"
	"cizhima-backend/service/api/internal/svc"
	"cizhima-backend/service/api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type GetReportLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetReportLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetReportLogic {
	return &GetReportLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetReportLogic) GetReport(req *types.GetReportRequest) (resp *types.ReportResponse, err error) {
	// 根据分享码查询报告
	report, err := l.svcCtx.ReportsModel.FindOneByShareCode(l.ctx, req.ShareCode)
	if err != nil {
		if err == sqlx.ErrNotFound {
			return nil, errno.ErrReportNotFound
		}
		l.Errorf("Failed to query report by shareCode %s: %v", req.ShareCode, err)
		return nil, errno.ErrInternal
	}

	// 构建响应
	resp = &types.ReportResponse{
		ShareCode: report.ShareCode,
		Verdict:   report.Verdict,
		Score:     int(report.Score),
	}

	if report.Summary.Valid {
		resp.Summary = report.Summary.String
	}
	if report.Roast.Valid {
		resp.Roast = report.Roast.String
	}

	// 解析 JSON 字段
	if report.Highlights.Valid {
		_ = json.Unmarshal([]byte(report.Highlights.String), &resp.Highlights)
	}
	if report.Warnings.Valid {
		_ = json.Unmarshal([]byte(report.Warnings.String), &resp.Warnings)
	}
	if report.Advice.Valid {
		_ = json.Unmarshal([]byte(report.Advice.String), &resp.Advice)
	}
	if report.Analysis.Valid {
		var analysisMap map[string]string
		_ = json.Unmarshal([]byte(report.Analysis.String), &analysisMap)
		if analysisMap != nil {
			resp.Analysis = types.Analysis{
				Income:      analysisMap["income"],
				Workload:    analysisMap["workload"],
				Environment: analysisMap["environment"],
				Growth:      analysisMap["growth"],
			}
		}
	}

	return resp, nil
}
