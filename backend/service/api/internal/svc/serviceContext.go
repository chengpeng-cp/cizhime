package svc

import (
	"context"
	"net/http"
	"time"

	"cizhima-backend/pkg/ai"
	"cizhima-backend/pkg/model/reports"
	"cizhima-backend/service/api/internal/config"
	"cizhima-backend/service/api/internal/middleware"

	"github.com/cloudwego/eino/components/model"
	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type ServiceContext struct {
	Config config.Config
	Conn   sqlx.SqlConn
	Redis  *redis.Redis

	JwtAuth    func(next http.HandlerFunc) http.HandlerFunc
	ApiLimiter func(next http.HandlerFunc) http.HandlerFunc

	ChatModel   model.ChatModel
	ReportsModel reports.ReportsModel
}

func NewServiceContext(c config.Config) *ServiceContext {
	conn := sqlx.NewMysql(c.DataSource)

	if c.MySQL.MaxOpenConns > 0 || c.MySQL.MaxIdleConns > 0 || c.MySQL.ConnMaxLifetime > 0 {
		db, err := conn.RawDB()
		if err == nil {
			if c.MySQL.MaxOpenConns > 0 {
				db.SetMaxOpenConns(c.MySQL.MaxOpenConns)
			}
			if c.MySQL.MaxIdleConns > 0 {
				db.SetMaxIdleConns(c.MySQL.MaxIdleConns)
			}
			if c.MySQL.ConnMaxLifetime > 0 {
				db.SetConnMaxLifetime(time.Duration(c.MySQL.ConnMaxLifetime) * time.Second)
			}
		}
	}

	var rds *redis.Redis
	if len(c.Redis) > 0 {
		rds = redis.MustNewRedis(redis.RedisConf{
			Host: c.Redis[0].Host,
			Type: "node",
			Pass: c.Redis[0].Pass,
		})
	}

	// 创建 AI ChatModel
	chatModel, err := ai.NewChatModel(context.Background(), &c.AI)
	if err != nil {
		// AI 服务不可用不应阻止服务启动，logic 层会处理 nil ChatModel
		chatModel = nil
	}

	// 创建 reports model
	reportsModel := reports.NewReportsModel(conn, c.Redis)

	return &ServiceContext{
		Config: c,
		Conn:   conn,
		Redis:  rds,

		JwtAuth:    middleware.NewJwtAuthMiddleware(c.Auth.AccessSecret).Handle,
		ApiLimiter: middleware.RateLimitMiddleware(middleware.NewRateLimiter(100, time.Minute)),

		ChatModel:   chatModel,
		ReportsModel: reportsModel,
	}
}
