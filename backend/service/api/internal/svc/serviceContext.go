package svc

import (
	"context"
	"net/http"
	"time"

	"cizhima-backend/pkg/ai"
	"cizhima-backend/pkg/model/reports"
	"cizhima-backend/service/api/internal/config"
	"cizhima-backend/service/api/internal/middleware"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type ServiceContext struct {
	Config config.Config
	Conn   sqlx.SqlConn
	Redis  *redis.Redis

	JwtAuth        func(next http.HandlerFunc) http.HandlerFunc
	ApiLimiter     func(next http.HandlerFunc) http.HandlerFunc
	AnalyzeLimiter func(next http.HandlerFunc) http.HandlerFunc

	ChatModels   []ai.ChatModelCandidate
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
		// 启动时探测 Redis，配置错误尽早暴露（报告查询依赖 Redis 缓存）
		if rds.PingCtx(context.Background()) {
			logx.Infof("Redis 连接正常: %s", c.Redis[0].Host)
		} else {
			logx.Errorf("Redis 连接失败: %s，请检查 Redis 服务是否启动、端口与密码是否正确（报告查询将不可用）", c.Redis[0].Host)
		}
	}

	// 创建 AI ChatModel
	chatModels, err := ai.NewChatModels(context.Background(), &c.AI)
	if err != nil {
		// AI 服务不可用不应阻止服务启动，logic 层会处理空 ChatModels
		logx.Errorf("AI ChatModel 初始化失败，analyze 接口将不可用: %v", err)
		chatModels = nil
	}

	// 创建 reports model
	reportsModel := reports.NewReportsModel(conn, c.Redis)

	return &ServiceContext{
		Config: c,
		Conn:   conn,
		Redis:  rds,

		JwtAuth: middleware.NewJwtAuthMiddleware(c.Auth.AccessSecret).Handle,
		// 通用限流：120 次/分钟/IP，防止接口被恶意刷取
		ApiLimiter: middleware.RateLimitMiddleware(middleware.NewRateLimiter(120, time.Minute)),
		// AI 生成接口更严格：10 次/分钟/IP，直接关系模型 token 成本
		AnalyzeLimiter: middleware.RateLimitMiddleware(middleware.NewRateLimiter(10, time.Minute)),

		ChatModels:   chatModels,
		ReportsModel: reportsModel,
	}
}
