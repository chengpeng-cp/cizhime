package ai

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/cloudwego/eino/components/model"
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

// Analyze 使用指定的 Agent 风格分析问卷数据，生成辞职报告
func Analyze(ctx context.Context, chatModel model.ChatModel, style AgentStyle, questionnaire map[string]interface{}) (*Report, error) {
	// 构建 messages
	messages, err := buildMessages(style, questionnaire)
	if err != nil {
		return nil, fmt.Errorf("failed to build messages: %w", err)
	}

	// 调用模型生成
	resp, err := chatModel.Generate(ctx, messages)
	if err != nil {
		return nil, fmt.Errorf("failed to generate report: %w", err)
	}

	// 提取并解析 JSON
	jsonStr := extractJSON(resp.Content)

	var report Report
	if err := json.Unmarshal([]byte(jsonStr), &report); err != nil {
		return nil, fmt.Errorf("failed to parse AI response as JSON: %w, raw: %s", err, resp.Content)
	}

	return &report, nil
}
