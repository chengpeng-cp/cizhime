# 前端脚手架

基于 React 19 + TypeScript + Vite 的前端脚手架。

## 目录结构

```
frontend/
├── src/
│   ├── components/       # 组件
│   │   └── layout/       # 布局组件
│   ├── pages/            # 页面
│   ├── router/           # 路由配置
│   ├── services/         # API 请求封装
│   ├── store/            # Redux 状态管理
│   ├── types/            # TS 类型定义
│   ├── utils/            # 工具函数
│   ├── styles/           # 全局样式
│   ├── App.tsx           # 根组件
│   └── main.tsx          # 入口文件
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

## 核心特性

- **请求封装**: Axios 封装，含 Token 自动刷新、401 重试、错误处理
- **状态管理**: Redux Toolkit
- **路由保护**: 提供 ProtectedRoute 示例，业务方按需启用
- **主题切换**: 支持亮色/暗色主题
- **错误边界**: 全局 ErrorBoundary 捕获渲染错误
- **TypeScript**: 完整的类型支持

## 标准工作流

1. **新页面**: `pages/` 创建 -> `router/index.tsx` 加路由
2. **新接口**: `types/api.ts` 加类型 -> `services/` 加方法
3. **新状态**: `store/modules/` 加 slice -> 组件用 `useSelector/useDispatch`
4. **新组件**: `components/` 对应分类下创建

## 关键规则

- 组件里不直接调 API，必须走 `services/`
- 组件里不直接改 state，必须走 `dispatch action`
- 组件/服务里不内联定义类型，必须放 `types/`

## 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint

# 自动修复
npm run lint:fix

# 代码格式化
npm run format
```

## 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `VITE_API_BASE_URL` | API 基础地址 | `http://localhost:8888` |

在 `.env` 文件中配置（开发环境）或在 `.env.production` 中配置（生产环境）。
