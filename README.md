# 辞职么

> AI 辅助辞职决策工具 —— 填一份问卷，让 AI 帮你理性评估"该不该辞职"。

辞职么通过结构化问卷采集用户的学历、地区、薪资、加班、通勤、办公环境、同事关系、领导风格等维度信息，调用大模型进行多维度分析，生成包含评分、总结、亮点、风险、建议与"吐槽"的个性化报告，并支持通过分享码一键分享。

## 功能特性

- **结构化问卷**：覆盖收入、工作量、环境、成长四大维度的标准化采集
- **AI 多维分析**：大模型对问卷数据综合评估，输出客观评分与文字结论
- **可视化报告**：评分、总结、亮点、警告、分维度分析、行动建议、吐槽一应俱全
- **分享码机制**：每份报告生成唯一分享码，便于朋友参考决策
- **多 Agent 风格**：支持不同的 AI 表达风格（毒舌 / 温和 / 理性等）
- **多 AI Provider**：支持 DeepSeek、通义 DashScope、Moonshot、OpenAI 及自定义接入
- **响应式 UI**：基于 Tailwind CSS 的现代界面，支持亮/暗主题与动画交互

## 技术栈

### 后端
- **框架**：[go-zero](https://github.com/zeromicro/go-zero) v1.10.1
- **语言**：Go 1.26
- **存储**：MySQL 8 + Redis 7
- **认证**：JWT（含 Token 自动刷新）
- **限流**：滑动窗口限流中间件
- **代码生成**：goctl（API / Model / Swagger）
- **AI 接入**：可插拔 Provider 架构
- **部署**：Docker + Docker Compose

### 前端
- **框架**：React 19 + TypeScript + Vite 7
- **状态管理**：Redux Toolkit + React Query
- **样式**：Tailwind CSS 4
- **路由**：React Router DOM 7（含路由保护）
- **HTTP**：Axios（含 Token 自动刷新、401 重试）
- **动画**：GSAP
- **图标**：lucide-react

## 项目结构

```
cizhime/
├── backend/                  # 后端服务（go-zero）
│   ├── service/api/          # API 服务
│   │   ├── api.api           # API 接口定义（源文件）
│   │   ├── api.go            # 服务入口
│   │   └── internal/         # handler / logic / middleware / svc / types
│   ├── pkg/                  # 公共包（errno / response / crypto / model / env）
│   ├── deploy/               # Docker Compose 编排
│   ├── docker/               # Dockerfile
│   ├── scripts/              # 工具脚本
│   └── Makefile              # 构建、生成、运行命令
├── frontend/                 # 前端应用（React + Vite）
│   └── src/
│       ├── pages/            # home / survey / generating / report / error
│       ├── components/       # 通用组件与布局
│       ├── services/         # API 请求封装
│       ├── store/            # Redux 状态管理
│       ├── router/           # 路由配置
│       ├── types/            # TS 类型定义
│       └── utils/            # 工具函数（请求封装、Token 存储等）
└── README.md
```

## 快速开始

### 环境要求

- **Go** 1.26+
- **Node.js** 20+
- **Docker & Docker Compose**（用于启动 MySQL + Redis）
- 一个可用的 AI API Key（DeepSeek / DashScope / Moonshot / OpenAI 任选其一）

### 1. 克隆仓库

```bash
git clone https://github.com/chengpeng-cp/cizhime.git
cd cizhime
```

### 2. 启动后端

```bash
cd backend

# 1) 复制环境变量配置，并填写真实值（DB / Redis / JWT / AI API Key）
cp .env.example .env
# 编辑 .env，把 ${CHANGE_ME_*} 占位符替换为真实值

# 2) 复制基础设施配置，并填写 MySQL/Redis 密码
cp deploy/.env.infra.example deploy/.env.infra
# 编辑 deploy/.env.infra

# 3) 启动基础设施（MySQL + Redis，并自动导入表结构）
make infra-up

# 4) 安装 goctl 代码生成工具
make install

# 5) 生成 API / Model / Swagger 代码
make gen

# 6) 运行服务
make run
```

服务默认监听 `http://localhost:8888`，健康检查接口：`GET /api/v1/health`。

### 3. 启动前端

```bash
cd frontend

# 1) 安装依赖
npm install

# 2) 复制环境变量，配置后端 API 地址
cp .env.example .env
# 编辑 .env，设置 VITE_API_BASE_URL=http://localhost:8888

# 3) 启动开发服务器
npm run dev
```

前端默认运行在 `http://localhost:5173`。

## 配置说明

### 后端环境变量（`backend/.env`）

| 变量 | 说明 | 示例 |
|------|------|------|
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL 连接信息 | `localhost` / `3306` / `root` / `***` / `cizhima` |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis 连接信息 | `localhost` / `6379` / `***` |
| `JWT_SECRET` | JWT 签名密钥（≥32 字符） | 随机字符串 |
| `AI_PROVIDER` | AI 服务商 | `deepseek` / `dashscope` / `moonshot` / `openai` / `custom` |
| `AI_API_KEY` | AI 服务 API Key | `sk-***` |
| `AI_BASE_URL` / `AI_MODEL` | 可选，自定义接入地址与模型 | — |

### 前端环境变量（`frontend/.env`）

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_API_BASE_URL` | 后端 API 基础地址 | `http://localhost:8888` |

> 真实配置文件（`.env`、`.env.infra`）已在 `.gitignore` 中屏蔽，仅提交 `.example` 模板。

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/health` | 健康检查 |
| `POST` | `/api/v1/analyze` | 提交问卷并生成分析报告 |
| `GET` | `/api/v1/report/:shareCode` | 通过分享码获取报告 |

请求/响应结构详见 `backend/service/api/api.api`，启动后可在 `backend/docs/swagger/api.json` 查看 Swagger 文档。

## 常用命令

### 后端

```bash
make install      # 安装 goctl
make gen          # 生成 API / Model / Swagger 代码
make run          # 运行服务
make build        # 构建二进制到 bin/
make test         # 运行测试
make lint         # 代码检查
make infra-up     # 启动基础设施
make infra-down   # 停止基础设施
make docker       # 构建 Docker 镜像
make clean        # 清理构建产物
```

### 前端

```bash
npm run dev       # 启动开发服务器
npm run build     # 构建生产版本
npm run preview   # 预览生产构建
npm run lint      # 代码检查
npm run lint:fix  # 自动修复
npm run format    # 代码格式化
```

## 部署

后端支持 Docker 部署，前端构建后可由任意静态资源服务器（Nginx / CDN）托管：

```bash
# 后端：构建镜像
cd backend && make docker

# 前端：构建产物
cd frontend && npm run build
# 产物位于 frontend/dist/，部署到 Nginx 或静态托管
```

## License

本项目基于 [MIT License](LICENSE) 开源，欢迎使用、修改与分发。
