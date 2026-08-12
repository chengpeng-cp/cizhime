// todo: 修改服务名称和配置文件路径

package main

import (
	"flag"
	"fmt"
	"os"

	"cizhima-backend/pkg/env"
	"cizhima-backend/service/api/internal/config"
	"cizhima-backend/service/api/internal/handler"
	"cizhima-backend/service/api/internal/svc"

	"github.com/joho/godotenv"
	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/rest"
)

var configFile = flag.String("f", "etc/api.yaml", "the config file")

func main() {
	flag.Parse()

	if _, err := os.Stat(".env"); err == nil {
		if err := godotenv.Load(); err != nil {
			fmt.Printf("Warning: Failed to load .env file: %v\n", err)
			return
		}
	}

	var c config.Config
	if *configFile == "" {
		if env.IsTest() {
			*configFile = "etc/test.yaml"
		} else if env.IsProd() {
			*configFile = "etc/prod.yaml"
		} else {
			fmt.Println("Unknown environment")
			return
		}
	}

	conf.MustLoad(*configFile, &c, conf.UseEnv())

	server := rest.MustNewServer(c.RestConf)
	defer server.Stop()

	ctx := svc.NewServiceContext(c)
	handler.RegisterHandlers(server, ctx)

	fmt.Printf("Starting %s server at %s:%d...\n", env.GetServerName(), c.Host, c.Port)
	server.Start()
}
