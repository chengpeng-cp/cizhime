package ai

import (
	"context"
	"fmt"

	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/cloudwego/eino/components/model"
)

// NewChatModel 创建支持 OpenAI 兼容协议的 ChatModel
// 支持多种服务商：DeepSeek、通义千问(DashScope)、Moonshot、OpenAI 等
// 通过 Provider 字段切换服务商，也可使用 custom 自定义 BaseURL
func NewChatModel(ctx context.Context, cfg *AIConfig) (model.ChatModel, error) {
	cfg = cfg.withDefaults()

	if cfg.APIKey == "" {
		return nil, fmt.Errorf("AI APIKey is required")
	}
	if cfg.BaseURL == "" {
		return nil, fmt.Errorf("AI BaseURL is required (provider=%s)", cfg.Provider)
	}

	chatModel, err := openai.NewChatModel(ctx, &openai.ChatModelConfig{
		BaseURL: cfg.BaseURL,
		APIKey:  cfg.APIKey,
		Model:   cfg.Model,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create chat model (provider=%s, model=%s): %w", cfg.Provider, cfg.Model, err)
	}

	return chatModel, nil
}
