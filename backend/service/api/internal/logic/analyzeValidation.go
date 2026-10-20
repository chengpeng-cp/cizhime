package logic

import (
	"strings"
	"unicode/utf8"

	"cizhima-backend/pkg/errno"
	"cizhima-backend/service/api/internal/types"
)

const maxExtraNoteChars = 500

func validateAnalyzeRequest(req *types.AnalyzeRequest) error {
	if req == nil {
		return errno.ErrInvalidParams.WithMessage("请求内容不能为空")
	}

	q := &req.Questionnaire
	q.ExtraNote = strings.TrimSpace(q.ExtraNote)

	checkChoice := func(field, value string, allowed ...string) error {
		for _, candidate := range allowed {
			if value == candidate {
				return nil
			}
		}
		return errno.ErrInvalidParams.WithMessage(field + "选项无效")
	}

	if err := checkChoice("学历", q.Education, "高中及以下", "大专", "本科", "硕士", "博士"); err != nil {
		return err
	}
	if err := checkChoice("工作地区", q.Region, "一线城市", "新一线城市", "二线城市", "三线及以下", "海外"); err != nil {
		return err
	}
	if err := checkChoice("工作稳定程度", q.Stability, "铁饭碗", "较稳定", "一般般", "随时可能凉"); err != nil {
		return err
	}
	if err := checkChoice("加班频率", q.OvertimeFrequency, "从不加班", "1-2次", "3-5次", "加班是我的第二职业"); err != nil {
		return err
	}
	if err := checkChoice("薪资范围", q.SalaryRange, "5k以下", "5-10k", "10-20k", "20-50k", "50k+"); err != nil {
		return err
	}
	if err := checkChoice("办公环境", q.WorkEnvironment, "神仙环境", "还行", "憋屈", "工地现场"); err != nil {
		return err
	}
	if err := checkChoice("同事关系", q.ColleagueRelation, "神仙同事", "普通同事", "塑料同事", "宫斗现场"); err != nil {
		return err
	}

	if q.CommuteMinutes < 0 || q.CommuteMinutes > 360 {
		return errno.ErrInvalidParams.WithMessage("通勤时间必须在 0 到 360 分钟之间")
	}
	if q.SalarySatisfaction < 1 || q.SalarySatisfaction > 10 {
		return errno.ErrInvalidParams.WithMessage("薪资满意度必须在 1 到 10 分之间")
	}
	if q.BossToxicity < 1 || q.BossToxicity > 10 {
		return errno.ErrInvalidParams.WithMessage("领导合作体验必须在 1 到 10 分之间")
	}
	if utf8.RuneCountInString(q.ExtraNote) > maxExtraNoteChars {
		return errno.ErrInvalidParams.WithMessage("补充说明不能超过 500 个字符")
	}

	return nil
}
