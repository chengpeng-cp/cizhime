# 后端脚手架

基于 go-zero 的 API 服务脚手架。

## 目录结构

```
backend/
├── service/
│   └── api/              # API 服务
│       ├── api.api       # API 定义文件（源文件）
│       ├── api.go        # 服务入口
│       └── etc/
│           ├── api.yaml  # 配置文件
│           ├── prod.yaml # 生产配置
│           └── test.yaml # 测试配置
├── pkg/
│   ├── errno/            # 错误码体系
│   ├── response/         # 统一响应封装
│   ├── env/              # 环境判断工具
│   ├── crypto/           # 加密工具
│   └── model/
│       └── sql/          # SQL 源文件
├── deploy/               # Docker Compose 配置
├── docker/               # Dockerfile
├── scripts/              # 工具脚本
├── Makefile              # 构建脚本
└── go.mod                # Go 模块
```

## 核心特性

- **代码生成**: 使用 goctl 自动生成 API handler、types、model
- **认证**: JWT 中间件已预留，但当前匿名 API 路由未接入认证
- **限流保护**: 内置滑动窗口限流中间件
- **统一响应**: 标准化 JSON 响应格式
- **错误码体系**: 可扩展的业务错误码
- **配置管理**: 支持环境变量注入
- **Docker 支持**: 一键构建容器镜像
- **基础设施**: Docker Compose 一键启动 MySQL + Redis

## 常用命令

```bash
# 安装 goctl 工具
make install

# 生成所有代码（API + Model + Swagger）
make gen

# 仅生成 API 代码
make gen-api

# 仅生成 Model 代码
make gen-model

# 生成 Swagger 文档
make gen-swagger

# 构建服务
make build

# 运行服务
make run

# 启动基础设施
make infra-up

# 停止基础设施
make infra-down

# 导入 SQL
make db-import

# 运行测试
make test

# 代码检查
make lint

# 清理构建产物
make clean
```

## 标准工作流

1. **加接口**: 修改 `service/api/api.api` -> `make gen-api` -> 在 `internal/logic/` 写业务逻辑
2. **加数据表**: 写 `pkg/model/sql/*.sql` -> `make gen-model` -> `make db-import`
3. **改接口/改表**: 改对应的源文件 -> 重新执行对应的 make 命令

## 注意事项

- 只改源定义，用工具生成代码，严禁手改生成文件
- `pkg` 不依赖任何 `service/*/internal/` 的包
- 修改接口定义后需同步重新生成 Swagger 文档
