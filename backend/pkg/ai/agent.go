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
	// 构建 messages
	messages, err := buildMessages(style, questionnaire)
	if err != nil {
		return nil, fmt.Errorf("failed to build messages: %w", err)
	}

	var lastErr error
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		if ctxErr := ctx.Err(); ctxErr != nil {
			return nil, fmt.Errorf("%w: %v", ErrAITimeout, ctxErr)
		}

		report, err := tryGenerate(ctx, chatModel, messages)
		if err == nil {
			return report, nil
		}
		lastErr = err

		if attempt < maxAttempts {
			logx.Infof("AI 生成第 %d 次尝试失败，准备重试: %v", attempt, err)
			select {
			case <-ctx.Done():
				return nil, fmt.Errorf("%w: %v", ErrAITimeout, ctx.Err())
			case <-time.After(retryInterval):
			}
		}
	}

	return nil, fmt.Errorf("%w: %v", ErrAIBusy, lastErr)
}

// tryGenerate 单次调用模型并解析结果
func tryGenerate(ctx context.Context, chatModel model.ChatModel, messages []*schema.Message) (*Report, error) {
	resp, err := chatModel.Generate(ctx, messages)
	if err != nil {
		return nil, fmt.Errorf("failed to generate report: %w", err)
	}

	jsonStr := extractJSON(resp.Content)

	var report Report
	if err := json.Unmarshal([]byte(jsonStr), &report); err != nil {
		return nil, fmt.Errorf("failed to parse AI response as JSON: %w, raw: %s", err, resp.Content)
	}

	// 关键字段缺失说明响应不完整，同样触发重试
	if report.Verdict == "" {
		return nil, fmt.Errorf("AI response missing verdict, raw: %s", resp.Content)
	}

	return &report, nil
}
