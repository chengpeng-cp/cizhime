# 辞职么 前后端分离开发脚手架

基于 go-zero + React + TypeScript 的优秀前后端分离开发脚手架，提取自生产项目，可直接用于快速搭建新项目。

## 项目结构

```
辞职么/
├── backend/          # go-zero 后端脚手架
└── frontend/         # React 前端脚手架
```

## 技术栈

### 后端
- **框架**: go-zero v1.10.1
- **数据库**: MySQL 8.0 + Redis 7
- **认证**: JWT
- **代码生成**: goctl
- **部署**: Docker + Docker Compose

### 前端
- **框架**: React 19 + TypeScript + Vite 7
- **状态管理**: Redux Toolkit
- **UI样式**: Tailwind CSS 4
- **路由**: React Router DOM 7
- **HTTP**: Axios（含Token自动刷新）

## 快速开始

### 环境要求
- Go 1.26+
- Node.js 20+
- Docker & Docker Compose

### 启动后端

```bash
cd backend

# 1. 复制环境变量配置文件
cp .env.example .env
# todo: 修改 .env 中的配置值

# 2. 启动基础设施（MySQL + Redis）
make infra-up

# 3. 安装 goctl 工具
make install

# 4. 生成 API 和 Model 代码
make gen

# 5. 运行服务
make run
```

### 启动前端

```bash
cd frontend

# 1. 安装依赖
npm install

# 2. 复制环境变量配置文件
cp .env.example .env
# todo: 修改 .env 中的 API 地址

# 3. 启动开发服务器
npm run dev
```

## 关键文件说明

### 后端
| 文件 | 说明 |
|------|------|
| `service/api/api.api` | API 接口定义（源文件） |
| `service/api/api.go` | 服务入口 |
| `pkg/errno/errno.go` | 错误码体系 |
| `pkg/response/response.go` | 统一响应封装 |
| `pkg/crypto/aes.go` | AES-GCM 加密工具 |
| `internal/middleware/jwtauthmiddleware.go` | JWT 认证中间件 |
| `internal/middleware/ratelimitmiddleware.go` | 限流中间件 |
| `Makefile` | 构建、生成、运行命令 |
| `deploy/docker-compose.base.yml` | 基础设施编排 |

### 前端
| 文件 | 说明 |
|------|------|
| `src/utils/request.ts` | Axios 请求封装（含Token自动刷新） |
| `src/utils/authStorage.ts` | Token 本地存储工具 |
| `src/store/index.ts` | Redux Store 配置 |
| `src/router/index.tsx` | 路由配置（含 ProtectedRoute 示例） |
| `src/App.tsx` | 根组件（含 ErrorBoundary、ThemeProvider） |

## 使用新项目的步骤

1. 复制 `辞职么` 目录到新项目
2. 全局替换 `辞职么-backend` 为你的模块名
3. 全局替换 `辞职么` 为你的项目名
4. 按照文件中的 `todo: ` 标注逐一修改配置
5. 根据业务需求扩展 API 接口和页面组件

## 业务接入指南

脚手架仅包含基础设施（HTTP 封装、JWT 中间件、限流、错误码、主题切换、错误边界等），不包含任何业务代码。以下是接入业务的步骤。

### 后端：添加业务接口

1. 在 `service/api/api.api` 中定义接口（参考文件中的注释示例）
2. 执行 `make gen-api` 生成 handler、logic、types 代码
3. 在 `internal/logic/` 中实现业务逻辑
4. 需要鉴权的接口，在 `api.api` 中添加 `middleware: JwtAuth` 配置块

### 后端：添加数据表

1. 在 `pkg/model/sql/` 下创建 `.sql` 文件定义表结构
2. 执行 `make gen-model` 生成 model 代码
3. 执行 `make db-import` 导入表到数据库
4. 在 `ServiceContext` 中注入 model，在 logic 中使用

### 后端：实现登录认证

脚手架提供了 JWT 中间件（`internal/middleware/jwtauthmiddleware.go`），但不包含登录注册接口。接入步骤：

1. 在 `api.api` 中定义登录/注册接口
2. 执行 `make gen-api` 生成代码
3. 在 logic 中实现：验证账号密码 -> 生成 JWT（使用 `config.Auth.AccessSecret`）-> 返回 token
4. 前端通过 `authStorage.setToken()` 保存 token

### 前端：添加业务页面

1. 在 `src/pages/` 下创建页面组件
2. 在 `src/router/index.tsx` 中添加路由
3. 需要鉴权的路由，使用 `ProtectedRoute` 包裹

### 前端：添加 API 调用

1. 在 `src/types/api.ts` 中定义请求/响应类型
2. 在 `src/services/` 下创建 service 文件，使用 `get/post/put/del` 封装
3. 在 `services/index.ts` 中统一导出

### 前端：添加状态管理

1. 在 `src/store/modules/` 下创建 slice
2. 在 `src/store/index.ts` 中注册 reducer
3. 组件中通过 `useSelector/useDispatch` 使用

### 前端：处理认证过期

`request.ts` 在 token 刷新失败时会触发 `auth:expired` 事件。业务方可以监听此事件跳转登录页：

```tsx
useEffect(() => {
  const handler = () => {
    // 跳转登录页
    navigate('/login', { replace: true })
  }
  window.addEventListener('auth:expired', handler)
  return () => window.removeEventListener('auth:expired', handler)
}, [])
```

## 标注说明

脚手架中所有需要修改的地方都标注了 `todo: 要执行的修改` 注释，包括：
- 项目名、模块名
- 数据库配置
- API 地址
- 容器名称
- 环境变量
- 业务错误码
- 页面标题等
