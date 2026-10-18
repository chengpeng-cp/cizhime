<div align="center">

# 辞职么 · cizhime

**AI 辅助辞职决策工具 —— 填一份问卷，让 AI 帮你理性评估"该不该辞职"**

[![GitHub](https://img.shields.io/badge/GitHub-chengpeng--cp%2Fcizhime-181717?logo=github&logoColor=white)](https://github.com/chengpeng-cp/cizhime)
[![Gitee](https://img.shields.io/badge/Gitee-CP--chengpeng%2Fcizhime-C71D23?logo=gitee&logoColor=white)](https://gitee.com/CP-chengpeng/cizhime)
[![Bilibili](https://img.shields.io/badge/Bilibili-配套视频教程-00A1D6?logo=bilibili&logoColor=white)](https://space.bilibili.com/481791559)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

<table>
<tr>
<td width="58%" valign="top">

## 👨‍🏫 关于作者 · 配套课程

本项目是我在 **B 站持续更新的开源实战项目**，完整开发过程（架构设计、每个功能的实现思路）都在视频里讲解。

- 📺 **B 站主页**：[https://space.bilibili.com/481791559](https://space.bilibili.com/481791559)
  - 点个 **关注**，给视频 **一键三连** 🙏
- 💬 **微信交流**：遇到问题 / 想深入交流，扫码加我（备注：**辞职么**）

> ⭐ 如果这个项目对你有帮助，欢迎 Star ⭐ + 关注 B 站，这是我持续更新的最大动力！

</td>
<td width="42%" valign="top" align="center">

**扫码加我微信 👇**

<img src="assets/images/vx.png" alt="微信二维码" width="240" />

</td>
</tr>
</table>

---

## 📖 项目介绍

**辞职么**是一个 AI 辅助辞职决策工具：用户通过结构化问卷填写自己的**学历、地区、薪资、加班频率、通勤时间、办公环境、同事关系、领导风格**等维度信息，后端调用大模型（DeepSeek / 通义千问 / Moonshot / OpenAI 等）进行多维度分析，生成包含**评分、总结、亮点、风险、建议、吐槽**的个性化报告，并支持通过**分享码**一键分享给朋友参考。

## ✨ 功能特性

- **结构化问卷**：覆盖收入、工作量、环境、成长四大维度的标准化采集
- **AI 多维分析**：大模型对问卷数据综合评估，输出客观评分与文字结论
- **可视化报告**：评分、总结、亮点、警告、分维度分析、行动建议、吐槽一应俱全
- **分享码机制**：每份报告生成唯一分享码，便于朋友参考决策
- **多 Agent 风格**：毒舌损友 / 专业顾问 / 阴阳大师 / 知心大姐，四种 AI 表达风格
- **多 AI Provider**：支持 DeepSeek、通义 DashScope、Moonshot、OpenAI 及自定义接入
- **响应式 UI**：基于 Tailwind CSS 的现代界面，支持亮/暗主题与动画交互
- **工程化脚手架**：goctl 代码生成、统一响应、错误码体系、限流中间件、Docker 编排一应俱全

## 🛠️ 技术栈

### 后端

| 技术 | 说明 |
|------|------|
| [go-zero](https://github.com/zeromicro/go-zero) v1.10 | 微服务框架（REST + goctl 代码生成） |
| Go 1.26 | 开发语言 |
| MySQL 8 | 报告数据存储 |
| Redis 7 | 缓存 |
| JWT | 认证中间件（含 Token 自动刷新能力） |
| sliding-window | 滑动窗口限流中间件 |
| [Eino](https://github.com/cloudwego/eino) | 大模型编排（可插拔 Provider） |
| Docker Compose | 本地基础设施 / 生产编排 |

### 前端

| 技术 | 说明 |
|------|------|
| React 19 + TypeScript | UI 框架 |
| Vite 7 | 构建工具 |
| Redux Toolkit + React Query | 状态管理与数据请求 |
| Tailwind CSS 4 | 原子化样式 |
| React Router DOM 7 | 路由（含路由保护） |
| Axios | HTTP 请求封装（Token 自动刷新、401 重试） |
| GSAP + lucide-react | 动画与图标 |

## 📁 项目结构

```
cizhime/
├── backend/                    # 后端服务（go-zero）
│   ├── service/api/            # API 服务
│   │   ├── api.api             # API 接口定义（源文件，生成代码的输入）
│   │   ├── api.go              # 服务入口
│   │   ├── etc/                # 环境配置（api / test / prod）
│   │   └── internal/           # handler / logic / middleware / svc / types
│   ├── pkg/                    # 公共包（errno / response / crypto / model / env / ai）
│   ├── deploy/                 # Docker Compose 编排（基础设施 + 生产）
│   ├── docker/                 # Dockerfile
│   ├── scripts/                # 工具脚本（SQL 同步等）
│   └── Makefile                # 构建、生成、运行命令
├── frontend/                   # 前端应用（React + Vite）
│   └── src/
│       ├── pages/              # home / survey / generating / report / error
│       ├── components/         # 通用组件与布局
│       ├── services/           # API 请求封装
│       ├── store/              # Redux 状态管理
│       ├── router/             # 路由配置
│       ├── types/              # TS 类型定义
│       └── utils/              # 工具函数（请求封装、Token 存储等）
└── README.md
```

## 🚀 快速开始

### 环境要求

| 依赖 | 版本要求 | 用途 |
|------|---------|------|
| [Go](https://go.dev/dl/) | 1.26+ | 后端服务 |
| [Node.js](https://nodejs.org/) | 20.19+（推荐 22 LTS） | 前端应用 |
| [Docker & Docker Compose](https://www.docker.com/) | 最新版 | 一键启动 MySQL + Redis |
| AI API Key | — | DeepSeek / DashScope / Moonshot / OpenAI 任选其一 |

### 1. 克隆项目

```bash
# GitHub
git clone https://github.com/chengpeng-cp/cizhime.git
cd cizhime

# 或 Gitee 镜像（国内更快）
git clone https://gitee.com/CP-chengpeng/cizhime.git
cd cizhime
```

### 2. 启动后端

```bash
cd backend

# 1) 配置后端环境变量：复制模板并填写真实值（DB / Redis / JWT / AI API Key）
cp .env.example .env
# 编辑 .env，将 ${CHANGE_ME_*} 占位符替换为真实值
#   - DB_* / REDIS_*：与下一步 deploy/.env.infra 中的密码保持一致
#   - JWT_SECRET：至少 32 位随机字符串
#   - AI_PROVIDER + AI_API_KEY：填你自己的大模型 Key

# 2) 配置基础设施环境变量：复制模板并设置 MySQL / Redis 密码
cp deploy/.env.infra.example deploy/.env.infra
# 编辑 deploy/.env.infra，将 ${CHANGE_ME_*} 替换为真实值

# 3) 一键启动基础设施（MySQL + Redis，自动导入表结构）
make infra-up

# 4) 启动 API 服务（默认 http://localhost:8888）
make run
```

验证后端是否启动成功：

```bash
curl http://localhost:8888/api/v1/health
# 返回 {"code":0,"message":"成功","data":{}}
```

> 💡 想深入了解 goctl 代码生成？`make install` 安装 goctl，`make gen` 一键重新生成 API / Model / Swagger 代码（仓库中已包含生成好的代码，首次跑起来无需执行）。

### 3. 启动前端

```bash
cd frontend

# 1) 安装依赖
npm install

# 2) （可选）配置 API 地址
# 开发模式下 Vite 已内置代理（/api -> http://localhost:8888），无需配置即可跑通；
# 如需直连后端，复制 .env.example 为 .env 并设置 VITE_API_BASE_URL=http://localhost:8888

# 3) 启动开发服务器（默认 http://localhost:3000）
npm run dev
```

### 4. 体验完整流程

打开 <http://localhost:3000> → 点击开始问卷 → 填写信息并选择 AI 风格 → 生成报告 → 玩得开心 🎉

## ⚙️ 配置说明

### 后端环境变量（`backend/.env`）

| 变量 | 说明 | 示例 |
|------|------|------|
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL 连接信息 | `localhost` / `3306` / `root` / `***` / `cizhima` |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis 连接信息 | `localhost` / `6379` / `***` |
| `JWT_SECRET` | JWT 签名密钥（≥32 字符） | 随机字符串 |
| `AI_PROVIDER` | AI 服务商 | `deepseek` / `dashscope` / `moonshot` / `openai` / `custom` |
| `AI_API_KEY` | AI 服务 API Key | `sk-***` |
| `AI_BASE_URL` / `AI_MODEL` | 可选，自定义接入地址与模型 | `https://api.deepseek.com/v1` |

### 基础设施环境变量（`backend/deploy/.env.infra`）

| 变量 | 说明 |
|------|------|
| `MYSQL_PORT` / `MYSQL_ROOT_PASSWORD` / `MYSQL_DATABASE` | MySQL 端口 / root 密码 / 数据库名 |
| `REDIS_PORT` / `REDIS_PASSWORD` | Redis 端口 / 密码 |
| `ADMINER_PORT` / `REDIS_INSIGHT_PORT` | Adminer、Redis Insight 管理面板端口 |

### 前端环境变量（`frontend/.env`）

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_API_BASE_URL` | 后端 API 基础地址（留空则走 Vite 代理） | `http://localhost:8888` |

> 🔒 真实配置文件（`.env`、`.env.infra`、`.env.prod`）已在 `.gitignore` 中屏蔽，仓库只提交 `.example` 模板，请放心填写真实密钥。

## 🔌 API 接口

所有响应均为统一格式：`{"code": 0, "message": "成功", "data": {...}}`（`code != 0` 表示业务错误）。

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/health` | 健康检查 |
| `POST` | `/api/v1/analyze` | 提交问卷，AI 生成分析报告（返回分享码） |
| `GET` | `/api/v1/report/:shareCode` | 通过分享码获取报告 |

调用示例：

```bash
# 提交问卷生成报告
curl -X POST http://localhost:8888/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "agentStyle": "poison",
    "questionnaire": {
      "education": "本科",
      "region": "深圳",
      "stability": "私企，随时可能优化",
      "overtimeFrequency": "经常加班",
      "commuteMinutes": 60,
      "salaryRange": "15k-20k",
      "salarySatisfaction": 4,
      "workEnvironment": "普通格子间",
      "colleagueRelation": "表面和气",
      "bossToxicity": 8,
      "extraNote": "每天通勤两小时实在顶不住"
    }
  }'

# 通过分享码获取报告
curl http://localhost:8888/api/v1/report/<你的分享码>
```

`agentStyle` 可选值：`poison`（毒舌损友）、`professional`（专业顾问）、`yinyang`（阴阳大师）、`sister`（知心大姐）。完整请求/响应结构见 `backend/service/api/api.api`，启动后可访问 `backend/docs/swagger/api.json` 查看 Swagger 文档。

## 📦 常用命令

### 后端（`cd backend`）

```bash
make help         # 查看所有命令
make install      # 安装 goctl 代码生成工具
make gen          # 生成 API / Model / Swagger 代码（改接口/表后执行）
make run          # 运行 API 服务
make build        # 构建本机二进制到 bin/
make test         # 运行测试
make lint         # 代码检查
make infra-up     # 启动基础设施（MySQL + Redis + 自动建表）
make infra-down   # 停止基础设施
make db-import    # 重新导入 SQL 表结构
make docker       # 构建 Docker 镜像
make clean        # 清理构建产物
```

### 前端（`cd frontend`）

```bash
npm run dev       # 启动开发服务器（http://localhost:3000）
npm run build     # 构建生产版本（产物在 dist/）
npm run preview   # 本地预览生产构建
npm run lint      # 代码检查
npm run lint:fix  # 自动修复
npm run format    # 代码格式化
```

## 🐳 生产部署

```bash
# 1) 构建前端产物（产物挂载给 Nginx 容器）
cd frontend && npm install && npm run build

# 2) 配置生产环境变量
cd ../backend/deploy
cp .env.prod.example .env.prod
# 编辑 .env.prod：数据库/Redis 强密码、JWT_SECRET、AI_API_KEY

# 3) 一键启动（MySQL + Redis + API + Nginx）
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

访问 `http://<你的服务器IP>` 即可（Nginx 托管前端静态资源并反向代理 `/api` 到后端）。

## ❓ 常见问题

<details>
<summary><b>为什么 <code>make infra-up</code> 报错 / MySQL 连不上？</b></summary>

请确认 `backend/deploy/.env.infra` 已从模板复制并填写了真实的 `MYSQL_ROOT_PASSWORD` / `REDIS_PASSWORD`，且与 `backend/.env` 中的 `DB_PASSWORD` / `REDIS_PASSWORD` 一致。
</details>

<details>
<summary><b>没有 AI API Key 能跑起来吗？</b></summary>

可以启动项目，但生成报告会失败。建议注册一个 [DeepSeek](https://platform.deepseek.com/) 账号，价格便宜且国内可直连。
</details>

<details>
<summary><b>前端为什么是 3000 端口？</b></summary>

端口在 `frontend/vite.config.ts` 的 `server.port` 中配置（默认 3000）；开发模式下 `/api` 请求已被 Vite 代理到 `http://localhost:8888`，无需额外配置跨域。
</details>

<details>
<summary><b>改了数据库表结构 / 接口定义怎么办？</b></summary>

本项目的原则是"只改源定义，用工具生成代码"：
- 改表：编辑 `backend/pkg/model/sql/*.sql` → `make gen-model` → `make db-import`
- 改接口：编辑 `backend/service/api/api.api` → `make gen-api` → 在 `internal/logic/` 写业务逻辑
</details>

## 📄 License

本项目基于 [MIT License](LICENSE) 开源，欢迎使用、修改与分发。

---

<div align="center">

**⭐ 如果这个项目对你有帮助，欢迎 Star + 关注 B 站 ⭐**

📺 [B站：https://space.bilibili.com/481791559](https://space.bilibili.com/481791559) · 💬 微信见文首二维码（备注：辞职么）

</div>
