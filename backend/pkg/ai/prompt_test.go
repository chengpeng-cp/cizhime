package ai

import "testing"

func TestExtractJSON(t *testing.T) {
	cases := []struct {
		name  string
		input string
		want  string
	}{
		{"纯 JSON", `{"verdict":"建议苟住"}`, `{"verdict":"建议苟住"}`},
		{"json 代码块", "```json\n{\"a\":1}\n```", `{"a":1}`},
		{"无语言标记的代码块", "```\n{\"a\":1}\n```", `{"a":1}`},
		{"前置说明文字", "好的，以下是分析结果：\n{\"a\":1}", `{"a":1}`},
		{"后置说明文字", "{\"a\":1}\n希望有帮助！", `{"a":1}`},
		{"前后都有说明且带代码块", "分析如下：\n```json\n{\"a\":{\"b\":2}}\n```\n以上。", `{"a":{"b":2}}`},
		{"嵌套大括号", `{"a":{"b":{"c":1}},"d":2}`, `{"a":{"b":{"c":1}},"d":2}`},
		{"首尾空白", "  \n {\"a\":1} \n ", `{"a":1}`},
		{"空字符串", "", ""},
		{"无 JSON 内容", "抱歉，我无法完成该请求", "抱歉，我无法完成该请求"},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := extractJSON(c.input); got != c.want {
				t.Fatalf("extractJSON(%q) = %q, want %q", c.input, got, c.want)
			}
		})
	}
}

func TestIsValidStyle(t *testing.T) {
	for _, style := range []string{"poison", "professional", "yinyang", "sister"} {
		if !IsValidStyle(style) {
			t.Fatalf("IsValidStyle(%q) = false, want true", style)
		}
	}
	for _, style := range []string{"", "unknown", "POISON"} {
		if IsValidStyle(style) {
			t.Fatalf("IsValidStyle(%q) = true, want false", style)
		}
	}
}
