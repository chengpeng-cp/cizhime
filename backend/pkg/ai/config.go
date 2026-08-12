package ai

// Provider 预设的大模型服务商
type Provider string

const (
	ProviderDeepSeek  Provider = "deepseek"  // DeepSeek
	ProviderDashScope Provider = "dashscope" // 阿里云通义千问
	ProviderMoonshot  Provider = "moonshot"  // 月之暗面 Kimi
	ProviderOpenAI    Provider = "openai"    // OpenAI
	ProviderCustom    Provider = "custom"    // 自定义 BaseURL
)

// providerPresets 预设服务商的默认配置
var providerPresets = map[Provider]struct {
	BaseURL string
	Model   string
}{
	ProviderDeepSeek:  {BaseURL: "https://api.deepseek.com/v1", Model: "deepseek-chat"},
	ProviderDashScope: {BaseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1", Model: "qwen-plus"},
	ProviderMoonshot:  {BaseURL: "https://api.moonshot.cn/v1", Model: "moonshot-v1-8k"},
	ProviderOpenAI:    {BaseURL: "https://api.openai.com/v1", Model: "gpt-4o-mini"},
}

// AIConfig AI 服务配置
type AIConfig struct {
	Provider Provider `json:",optional"` // 服务商：deepseek/dashscope/moonshot/openai/custom
	APIKey   string   `json:",optional"` // API Key
	BaseURL  string   `json:",optional"` // 自定义 BaseURL（Provider 为 custom 时使用，或覆盖预设值）
	Model    string   `json:",optional"` // 模型名称
}

// withDefaults 填充默认值
func (c *AIConfig) withDefaults() *AIConfig {
	// 默认 Provider
	if c.Provider == "" {
		c.Provider = ProviderDeepSeek
	}

	// 根据 Provider 填充预设 BaseURL 和 Model
	if preset, ok := providerPresets[c.Provider]; ok {
		if c.BaseURL == "" {
			c.BaseURL = preset.BaseURL
		}
		if c.Model == "" {
			c.Model = preset.Model
		}
	}

	return c
}
