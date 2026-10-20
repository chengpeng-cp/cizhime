package ai

import (
	"context"
	"fmt"
	"strings"

	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/cloudwego/eino/components/model"
	"github.com/zeromicro/go-zero/core/logx"
)

// ChatModelCandidate associates a configured model ID with its client.
type ChatModelCandidate struct {
	Name  string
	Model model.ChatModel
}

const maxFallbackModels = 2

// NewChatModel 创建支持 OpenAI 兼容协议的 ChatModel
// 支持多种服务商：DeepSeek、通义千问(DashScope)、Moonshot、OpenAI、OpenRouter 等
// 通过 Provider 字段切换服务商，也可使用 custom 自定义 BaseURL
func NewChatModel(ctx context.Context, cfg *AIConfig) (model.ChatModel, error) {
	candidates, err := NewChatModels(ctx, cfg)
	if err != nil {
		return nil, err
	}
	return candidates[0].Model, nil
}

// NewChatModels creates the primary client and configured fallback clients.
// Fallback initialization errors are logged and skipped so one bad fallback
// does not make an otherwise usable primary model unavailable.
func NewChatModels(ctx context.Context, cfg *AIConfig) ([]ChatModelCandidate, error) {
	cfg = cfg.withDefaults()

	if cfg.APIKey == "" {
		return nil, fmt.Errorf("AI APIKey is required")
	}
	if cfg.BaseURL == "" {
		return nil, fmt.Errorf("AI BaseURL is required (provider=%s)", cfg.Provider)
	}
	if strings.TrimSpace(cfg.Model) == "" {
		return nil, fmt.Errorf("AI Model is required (provider=%s)", cfg.Provider)
	}

	modelNames := []string{cfg.Model}
	seen := map[string]struct{}{cfg.Model: {}}
	for _, name := range strings.Split(cfg.FallbackModels, ",") {
		name = strings.TrimSpace(name)
		if name == "" {
			continue
		}
		if _, ok := seen[name]; ok {
			continue
		}
		if len(modelNames)-1 >= maxFallbackModels {
			logx.Errorf("AI fallback model limit exceeded; ignoring model=%s", name)
			continue
		}
		seen[name] = struct{}{}
		modelNames = append(modelNames, name)
	}

	candidates := make([]ChatModelCandidate, 0, len(modelNames))
	for i, name := range modelNames {
		chatModel, err := openai.NewChatModel(ctx, &openai.ChatModelConfig{
			BaseURL: cfg.BaseURL,
			APIKey:  cfg.APIKey,
			Model:   name,
		})
		if err != nil {
			if i == 0 {
				return nil, fmt.Errorf("failed to create chat model (provider=%s, model=%s): %w", cfg.Provider, name, err)
			}
			logx.Errorf("AI fallback model initialization failed (provider=%s, model=%s): %v", cfg.Provider, name, err)
			continue
		}
		candidates = append(candidates, ChatModelCandidate{Name: name, Model: chatModel})
	}
	return candidates, nil
}
