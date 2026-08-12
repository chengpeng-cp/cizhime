package ai

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/cloudwego/eino/schema"
)

// AgentStyle Agent 风格类型
type AgentStyle string

const (
	StylePoison       AgentStyle = "poison"       // 毒舌损友
	StyleProfessional AgentStyle = "professional" // 专业顾问
	StyleYinyang      AgentStyle = "yinyang"      // 阴阳大师
	StyleSister       AgentStyle = "sister"       // 知心大姐
)

// PromptTemplate prompt 模板结构
type PromptTemplate struct {
	Name         string `json:"name"`
	SystemPrompt string `json:"system_prompt"`
}

// promptTemplates 内置的 Agent 风格 prompt
var promptTemplates = map[AgentStyle]string{
	StylePoison:       poisonPrompt,
	StyleProfessional: professionalPrompt,
	StyleYinyang:      yinyangPrompt,
	StyleSister:       sisterPrompt,
}

// GetSupportedStyles 返回支持的 Agent 风格列表
func GetSupportedStyles() []AgentStyle {
	return []AgentStyle{StylePoison, StyleProfessional, StyleYinyang, StyleSister}
}

// IsValidStyle 检查风格是否有效
func IsValidStyle(style string) bool {
	_, ok := promptTemplates[AgentStyle(style)]
	return ok
}

// buildMessages 构建 AI 调用的 messages
func buildMessages(style AgentStyle, questionnaire map[string]interface{}) ([]*schema.Message, error) {
	systemPrompt, ok := promptTemplates[style]
	if !ok {
		return nil, fmt.Errorf("unsupported agent style: %s", style)
	}

	// 将问卷数据转为易读的文本
	qBytes, err := json.Marshal(questionnaire)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal questionnaire: %w", err)
	}

	userPrompt := fmt.Sprintf(`请根据以下用户填写的工作信息，分析并判断该用户是否应该辞职。

用户问卷数据：
%s

请严格按照以下 JSON 格式返回分析结果（不要包含 markdown 代码块标记，直接返回纯 JSON）：
{
  "verdict": "建议辞职/建议苟住/建议观望",
  "score": 0-100的整数，表示辞职指数，越高越建议辞职,
  "summary": "一句话总结",
  "highlights": ["工作亮点1", "工作亮点2"],
  "warnings": ["工作槽点1", "工作槽点2"],
  "analysis": {
    "income": "收入维度分析",
    "workload": "工作强度分析",
    "environment": "环境与人际分析",
    "growth": "发展前景分析"
  },
  "advice": ["建议1", "建议2", "建议3"],
  "roast": "一句犀利总结"
}

分析要求：
1. 结合当前就业市场环境和经济形势
2. 客观分析用户的工作状况
3. 给出有建设性的建议
4. 语言风格要符合你的角色设定
5. highlights 和 warnings 各 2-3 条
6. advice 给出 3 条具体建议
7. roast 要有趣、有共鸣、适合传播`, string(qBytes))

	return []*schema.Message{
		{
			Role:    schema.System,
			Content: systemPrompt,
		},
		{
			Role:    schema.User,
			Content: userPrompt,
		},
	}, nil
}

// extractJSON 从 AI 返回的文本中提取 JSON
func extractJSON(text string) string {
	// 去除可能的 markdown 代码块标记
	text = strings.TrimSpace(text)
	if strings.HasPrefix(text, "```json") {
		text = strings.TrimPrefix(text, "```json")
		text = strings.TrimSuffix(text, "```")
	} else if strings.HasPrefix(text, "```") {
		text = strings.TrimPrefix(text, "```")
		text = strings.TrimSuffix(text, "```")
	}
	return strings.TrimSpace(text)
}
