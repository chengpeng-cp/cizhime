// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.1

package logic

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"strings"

	"cizhima-backend/pkg/ai"
	"cizhima-backend/pkg/env"
	"cizhima-backend/pkg/errno"
	"cizhima-backend/pkg/model/reports"
	"cizhima-backend/pkg/sharecode"
	"cizhima-backend/service/api/internal/svc"
	"cizhima-backend/service/api/internal/types"

	"github.com/go-sql-driver/mysql"
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

// isDuplicateKeyErr 判断是否为 MySQL 唯一键冲突错误（错误码 1062）
func isDuplicateKeyErr(err error) bool {
	var mysqlErr *mysql.MySQLError
	if errors.As(err, &mysqlErr) {
		return mysqlErr.Number == 1062
	}
	return strings.Contains(err.Error(), "Duplicate entry")
}

func (l *AnalyzeLogic) Analyze(req *types.AnalyzeRequest) (resp *types.ReportResponse, err error) {
	// 1. 验证 Agent 风格
	if !ai.IsValidStyle(req.AgentStyle) {
		return nil, errno.ErrInvalidAgentStyle
	}

	// 2. 检查 ChatModel 是否可用
	if len(l.svcCtx.ChatModels) == 0 {
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
	report, err := ai.AnalyzeWithModels(l.ctx, l.svcCtx.ChatModels, ai.AgentStyle(req.AgentStyle), questionnaire)
	if err != nil {
		l.Errorf("AI analyze failed: %v", err)
		// 区分超时/繁忙，前端可给出更准确的提示
		if errors.Is(err, ai.ErrAITimeout) {
			return nil, errno.ErrAITimeout
		}
		if errors.Is(err, ai.ErrAIBusy) {
			return nil, errno.ErrAIBusy
		}
		if env.IsProd() {
			return nil, errno.ErrAIAnalyzeFailed
		}
		return nil, errno.ErrAIAnalyzeFailed.WithMessage(err.Error())
	}

	// 分数兜底到合法区间，避免 AI 返回越界值
	if report.Score < 0 {
		report.Score = 0
	} else if report.Score > 100 {
		report.Score = 100
	}

	// 切片兜底为空数组，避免 JSON 序列化为 null
	if report.Highlights == nil {
		report.Highlights = []string{}
	}
	if report.Warnings == nil {
		report.Warnings = []string{}
	}
	if report.Advice == nil {
		report.Advice = []string{}
	}

	// 5. 生成分享码并入库（唯一键冲突时自动重新生成，避免极小概率碰撞直接失败）
	qBytes, _ := json.Marshal(questionnaire)
	highlights, _ := json.Marshal(report.Highlights)
	warnings, _ := json.Marshal(report.Warnings)
	analysis, _ := json.Marshal(report.Analysis)
	advice, _ := json.Marshal(report.Advice)
	rawResponse, _ := json.Marshal(report)

	const maxShareCodeAttempts = 5
	var shareCode string
	var insertErr error
	for attempt := 1; attempt <= maxShareCodeAttempts; attempt++ {
		shareCode = sharecode.Generate(6)
		_, insertErr = l.svcCtx.ReportsModel.Insert(l.ctx, &reports.Reports{
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
		if insertErr == nil {
			break
		}
		if isDuplicateKeyErr(insertErr) {
			l.Infof("分享码冲突，重新生成: %s（第 %d 次）", shareCode, attempt)
			continue
		}
		break
	}
	if insertErr != nil {
		l.Errorf("Failed to insert report: %v", insertErr)
		if isDuplicateKeyErr(insertErr) {
			return nil, errno.ErrShareCodeExists
		}
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
