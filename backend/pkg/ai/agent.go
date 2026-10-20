package ai

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/cloudwego/eino/components/model"
	"github.com/cloudwego/eino/schema"
	"github.com/zeromicro/go-zero/core/logx"
)

var (
	// ErrAITimeout AI 请求超时（请求上下文被取消或超时），重试无意义
	ErrAITimeout = errors.New("ai request timeout")
	// ErrAIBusy AI 多次尝试后仍失败（服务繁忙或返回异常）
	ErrAIBusy = errors.New("ai service busy")
)

const (
	// maxAttempts AI 调用最大尝试次数（首次 + 重试）
	maxAttempts = 3
	// retryInterval 两次尝试之间的等待时间
	retryInterval = 800 * time.Millisecond
	// modelAttemptTimeout bounds one upstream call so a stalled free endpoint
	// leaves time for another candidate within the API request budget.
	modelAttemptTimeout = 35 * time.Second
)

// Report AI 分析生成的报告
type Report struct {
	Verdict    string            `json:"verdict"`
	Score      int               `json:"score"`
	Summary    string            `json:"summary"`
	Highlights []string          `json:"highlights"`
	Warnings   []string          `json:"warnings"`
	Analysis   map[string]string `json:"analysis"`
	Advice     []string          `json:"advice"`
	Roast      string            `json:"roast"`
}

// Analyze 使用指定的 Agent 风格分析问卷数据，生成辞职报告。
// 模型偶发超时、空响应或格式漂移时会自动重试，最多 maxAttempts 次。
func Analyze(ctx context.Context, chatModel model.ChatModel, style AgentStyle, questionnaire map[string]interface{}) (*Report, error) {
	return AnalyzeWithModels(ctx, []ChatModelCandidate{{Name: "configured", Model: chatModel}}, style, questionnaire)
}

// AnalyzeWithModels tries each candidate once when a fallback pool is
// configured. With a single candidate it preserves the existing retry
// behavior. A valid JSON response with missing required fields also triggers
// failover.
func AnalyzeWithModels(ctx context.Context, candidates []ChatModelCandidate, style AgentStyle, questionnaire map[string]interface{}) (*Report, error) {
	if len(candidates) == 0 {
		return nil, fmt.Errorf("no AI model candidates configured")
	}

	// 构建 messages
	messages, err := buildMessages(style, questionnaire)
	if err != nil {
		return nil, fmt.Errorf("failed to build messages: %w", err)
	}

	var lastErr error
	for modelIndex, candidate := range candidates {
		attempts := 1
		if len(candidates) == 1 {
			attempts = maxAttempts
		}
		for attempt := 1; attempt <= attempts; attempt++ {
			if ctxErr := ctx.Err(); ctxErr != nil {
				return nil, fmt.Errorf("%w: %v", ErrAITimeout, ctxErr)
			}

			attemptCtx, cancel := context.WithTimeout(ctx, modelAttemptTimeout)
			report, err := tryGenerate(attemptCtx, candidate.Model, messages)
			cancel()
			if err == nil {
				return report, nil
			}
			lastErr = err
			logx.Infof("AI 模型 %s 第 %d 次尝试失败", candidate.Name, attempt)

			if ctx.Err() != nil {
				return nil, fmt.Errorf("%w: %v", ErrAITimeout, ctx.Err())
			}
			if attempt < attempts || modelIndex < len(candidates)-1 {
				select {
				case <-ctx.Done():
					return nil, fmt.Errorf("%w: %v", ErrAITimeout, ctx.Err())
				case <-time.After(retryInterval):
				}
			}
		}
	}

	return nil, fmt.Errorf("%w: %v", ErrAIBusy, lastErr)
}

// tryGenerate 单次调用模型并解析结果
func tryGenerate(ctx context.Context, chatModel model.ChatModel, messages []*schema.Message) (*Report, error) {
	resp, err := chatModel.Generate(ctx, messages)
	if err != nil {
		return nil, errors.New("failed to generate report")
	}

	jsonStr := extractJSON(resp.Content)

	var report Report
	if err := json.Unmarshal([]byte(jsonStr), &report); err != nil {
		return nil, errors.New("failed to parse AI response as JSON")
	}

	// Missing key fields indicate an incomplete response; fail over instead of
	// persisting a report that the UI cannot render meaningfully.
	if report.Verdict != "建议辞职" && report.Verdict != "建议苟住" && report.Verdict != "建议观望" {
		return nil, errors.New("AI response has an unsupported verdict")
	}
	if report.Summary == "" || report.Roast == "" || len(report.Highlights) == 0 || len(report.Warnings) == 0 || len(report.Advice) == 0 {
		return nil, errors.New("AI response is missing required report fields")
	}
	for _, key := range []string{"income", "workload", "environment", "growth"} {
		if report.Analysis[key] == "" {
			return nil, errors.New("AI response is missing required report fields")
		}
	}

	return &report, nil
}
