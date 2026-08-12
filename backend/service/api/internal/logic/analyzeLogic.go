// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.1

package logic

import (
	"context"
	"database/sql"
	"encoding/json"
	"math/rand"

	"cizhima-backend/pkg/ai"
	"cizhima-backend/pkg/errno"
	"cizhima-backend/pkg/model/reports"
	"cizhima-backend/service/api/internal/svc"
	"cizhima-backend/service/api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type AnalyzeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewAnalyzeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *AnalyzeLogic {
	return &AnalyzeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// generateShareCode 生成 6 位随机分享码（Base62）
func generateShareCode() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 6)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func (l *AnalyzeLogic) Analyze(req *types.AnalyzeRequest) (resp *types.ReportResponse, err error) {
	// 1. 验证 Agent 风格
	if !ai.IsValidStyle(req.AgentStyle) {
		return nil, errno.ErrInvalidAgentStyle
	}

	// 2. 检查 ChatModel 是否可用
	if l.svcCtx.ChatModel == nil {
		return nil, errno.ErrAIAnalyzeFailed.WithMessage("AI 服务未初始化")
	}

	// 3. 将问卷数据转为 map
	questionnaire := map[string]interface{}{
		"education":          req.Questionnaire.Education,
		"region":             req.Questionnaire.Region,
		"stability":          req.Questionnaire.Stability,
		"overtimeFrequency":  req.Questionnaire.OvertimeFrequency,
		"commuteMinutes":     req.Questionnaire.CommuteMinutes,
		"salaryRange":        req.Questionnaire.SalaryRange,
		"salarySatisfaction": req.Questionnaire.SalarySatisfaction,
		"workEnvironment":    req.Questionnaire.WorkEnvironment,
		"colleagueRelation":  req.Questionnaire.ColleagueRelation,
		"bossToxicity":       req.Questionnaire.BossToxicity,
	}
	if req.Questionnaire.ExtraNote != "" {
		questionnaire["extraNote"] = req.Questionnaire.ExtraNote
	}

	// 4. 调用 AI 分析
	report, err := ai.Analyze(l.ctx, l.svcCtx.ChatModel, ai.AgentStyle(req.AgentStyle), questionnaire)
	if err != nil {
		l.Errorf("AI analyze failed: %v", err)
		return nil, errno.ErrAIAnalyzeFailed.WithMessage(err.Error())
	}

	// 5. 生成分享码
	shareCode := generateShareCode()

	// 6. 准备数据库存储数据
	qBytes, _ := json.Marshal(questionnaire)
	highlights, _ := json.Marshal(report.Highlights)
	warnings, _ := json.Marshal(report.Warnings)
	analysis, _ := json.Marshal(report.Analysis)
	advice, _ := json.Marshal(report.Advice)
	rawResponse, _ := json.Marshal(report)

	// 7. 存入数据库
	_, err = l.svcCtx.ReportsModel.Insert(l.ctx, &reports.Reports{
		ShareCode:     shareCode,
		AgentStyle:    req.AgentStyle,
		Questionnaire: string(qBytes),
		Verdict:       report.Verdict,
		Score:         int64(report.Score),
		Summary:       sql.NullString{String: report.Summary, Valid: report.Summary != ""},
		Highlights:    sql.NullString{String: string(highlights), Valid: len(report.Highlights) > 0},
		Warnings:      sql.NullString{String: string(warnings), Valid: len(report.Warnings) > 0},
		Analysis:      sql.NullString{String: string(analysis), Valid: len(report.Analysis) > 0},
		Advice:        sql.NullString{String: string(advice), Valid: len(report.Advice) > 0},
		Roast:         sql.NullString{String: report.Roast, Valid: report.Roast != ""},
		RawResponse:   sql.NullString{String: string(rawResponse), Valid: true},
	})
	if err != nil {
		l.Errorf("Failed to insert report: %v", err)
		return nil, errno.ErrInternal.WithMessage("保存报告失败")
	}

	// 8. 构建响应
	resp = &types.ReportResponse{
		ShareCode:  shareCode,
		Verdict:    report.Verdict,
		Score:      report.Score,
		Summary:    report.Summary,
		Highlights: report.Highlights,
		Warnings:   report.Warnings,
		Advice:     report.Advice,
		Roast:      report.Roast,
	}

	// 填充 analysis
	if report.Analysis != nil {
		resp.Analysis = types.Analysis{
			Income:      report.Analysis["income"],
			Workload:    report.Analysis["workload"],
			Environment: report.Analysis["environment"],
			Growth:      report.Analysis["growth"],
		}
	}

	l.Infof("Report generated successfully, shareCode: %s, verdict: %s", shareCode, report.Verdict)
	return resp, nil
}
