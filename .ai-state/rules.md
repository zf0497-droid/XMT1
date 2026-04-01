# XMT项目开发规则

## 项目信息
- **项目名称**：XMT新媒体智能生产系统
- **场景定位**：MCN批量生产系统
- **目标规模**：日产100-500条视频，10-50人团队使用

## 核心原则（继承自CLAUDE.md）

### 1. 全链路重构机制
- 修改现有功能时，必须评估"补丁 vs 重构"
- 代码减少>20% → 强制重构
- 单文件修改≥3次 → 触发重构评估

### 2. 零信任验证
- 每次代码变更后强制执行：`npm run lint && npm run type-check && npm test`
- 测试失败禁止继续

### 3. 代码质量三关
- 反模式检测（无用代码、过时模式）
- 简洁性检查（函数<50行，文件<300行，嵌套<3层）
- 代码标准检查（ESLint + TypeScript）

### 4. 零过时模式
- 禁用：jQuery、moment.js（用date-fns）、class组件（用函数组件+hooks）
- 禁用：var（用const/let）、回调地狱（用async/await）

### 5. 简洁至上
- 能用10行解决，绝不写50行
- 避免过度抽象和不必要的设计模式

## 项目特定规则

### 技术栈约束
- **前端**：Next.js 15 + React 18 + TypeScript + Zustand
- **UI**：Radix UI + Tailwind CSS（已有）
- **视频**：Remotion 4.0.424（暂不升级，除非有breaking需求）
- **后端**：待定（Phase 1可能用Next.js API Routes）

### 模块化原则
- 编辑器保持独立（`/react-video-editor-pro-main`）
- 新系统代码放在 `/xmt-system`
- 共享组件放在 `/shared`

### API设计规范
- RESTful风格
- 统一错误处理格式
- 所有接口必须有TypeScript类型定义

### 渲染任务规范
- 每个任务必须有唯一ID
- 状态：pending → processing → completed/failed
- 失败任务自动重试3次

### 安全规范
- 所有用户输入必须验证和转义
- API密钥存储在环境变量
- 平台token加密存储

## 开发流程

1. **功能开发前**：检查是否有现成组件可复用
2. **代码提交前**：运行三关质量检查
3. **功能完成后**：更新 `.ai-state/current-phase.json`
4. **遇到问题时**：先检查 `.ai-state/refactor-tracker.json` 是否有历史记录

## 文件组织

```
/Users/sh.zqq.com/Projects/XMT/
├── react-video-editor-pro-main/  # 现有编辑器（只读，除非必要）
├── xmt-system/                   # 新系统代码
│   ├── backend/                  # 后端服务
│   ├── frontend/                 # 前端应用
│   ├── templates/                # 视频模板
│   └── shared/                   # 共享代码
├── .ai-state/                    # AI状态管理
│   ├── requirements.json         # 需求文档
│   ├── current-phase.json        # 当前进度
│   ├── refactor-tracker.json     # 重构追踪
│   └── rules.md                  # 本文件
└── docs/                         # 项目文档
```

## 下一步行动

根据 `current-phase.json`，下一步是：
1. 技术架构设计
2. 团队角色配置
3. 开发环境搭建
