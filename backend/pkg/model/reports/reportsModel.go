package reports

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ ReportsModel = (*customReportsModel)(nil)

type (
	// ReportsModel is an interface to be customized, add more methods here,
	// and implement the added methods in customReportsModel.
	ReportsModel interface {
		reportsModel
	}

	customReportsModel struct {
		*defaultReportsModel
	}
)

// NewReportsModel returns a model for the database table.
func NewReportsModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) ReportsModel {
	return &customReportsModel{
		defaultReportsModel: newReportsModel(conn, c, opts...),
	}
}
