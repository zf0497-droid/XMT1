# XMT项目架构设计

## 系统概览

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ 创作者   │  │ 审核者   │  │ 管理员   │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                     前端应用层 (Next.js)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 模板库   │  │ 任务管理 │  │ 发布中心 │  │ 编辑器   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                     API网关层 (Next.js API)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ 认证鉴权 │  │ 请求路由 │  │ 限流熔断 │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      业务逻辑层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 模板服务 │  │ 渲染服务 │  │ 发布服务 │  │ 用户服务 │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      数据持久层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │PostgreSQL│  │  Redis   │  │  AWS S3  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      外部服务层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │AWS Lambda│  │ 抖音API  │  │ 快手API  │  ...             │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## 技术栈决策

### 前端
- **框架**：Next.js 15 + React 18
- **语言**：TypeScript 5
- **状态管理**：Zustand（已有）
- **UI组件**：Radix UI + Tailwind CSS（已有）
- **视频编辑**：Remotion 4.0.424 + @remotion/player

### 后端（Phase 1简化方案）
- **框架**：Next.js API Routes（快速启动，后续可迁移独立服务）
- **语言**：TypeScript 5
- **ORM**：Prisma（类型安全）
- **任务队列**：Bull + Redis

### 数据库
- **主库**：PostgreSQL 15（关系数据）
- **缓存/队列**：Redis 7
- **文件存储**：AWS S3 + CloudFront CDN

### 云服务
- **渲染**：AWS Lambda + Remotion
- **存储**：AWS S3
- **CDN**：CloudFront
- **监控**：Sentry（已集成）

## 核心模块设计

### 1. 模板系统

#### 数据模型
```typescript
interface VideoTemplate {
  id: string;
  name: string;
  category: 'koubo' | 'tuwen' | 'hunj ian' | 'daihuo';
  thumbnail: string;
  config: TemplateConfig;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateConfig {
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  layers: LayerConfig[];
}

interface LayerConfig {
  type: 'video' | 'text' | 'image' | 'audio';
  params: Record<string, any>; // 可配置参数
}
```

#### API设计
```
GET    /api/templates          # 获取模板列表
GET    /api/templates/:id      # 获取模板详情
POST   /api/templates          # 创建模板（管理员）
PUT    /api/templates/:id      # 更新模板
DELETE /api/templates/:id      # 删除模板
```

### 2. 渲染系统

#### 架构流程
```
用户提交 → 创建任务 → 入队列 → Lambda渲染 → 上传S3 → 回调通知
```

#### 数据模型
```typescript
interface RenderTask {
  id: string;
  userId: string;
  templateId: string;
  params: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  outputUrl?: string;
  error?: string;
  retryCount: number;
  createdAt: Date;
  completedAt?: Date;
}
```

#### API设计
```
POST   /api/render/submit      # 提交渲染任务
GET    /api/render/tasks       # 获取任务列表
GET    /api/render/tasks/:id   # 获取任务状态
POST   /api/render/batch       # 批量提交
DELETE /api/render/tasks/:id   # 取消任务
```

#### 任务队列设计
```typescript
// 使用Bull队列
const renderQueue = new Queue('video-render', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

// 并发控制
renderQueue.process(10, async (job) => {
  // 调用Lambda渲染
  const result = await renderOnLambda(job.data);
  return result;
});
```

### 3. 发布系统

#### 平台抽象层
```typescript
interface PlatformAdapter {
  name: string;
  upload(video: VideoFile, metadata: VideoMetadata): Promise<string>;
  getStatus(taskId: string): Promise<PublishStatus>;
  formatVideo(input: string, format: PlatformFormat): Promise<string>;
}

class DouyinAdapter implements PlatformAdapter { ... }
class KuaishouAdapter implements PlatformAdapter { ... }
```

#### 数据模型
```typescript
interface PublishTask {
  id: string;
  renderTaskId: string;
  platforms: string[]; // ['douyin', 'kuaishou']
  metadata: {
    title: string;
    description: string;
    tags: string[];
    coverImage?: string;
  };
  status: Record<string, PublishStatus>;
  createdAt: Date;
}

type PublishStatus = 'pending' | 'uploading' | 'published' | 'failed';
```

#### API设计
```
POST   /api/publish/submit     # 提交发布任务
GET    /api/publish/tasks      # 获取发布任务列表
GET    /api/publish/tasks/:id  # 获取发布状态
POST   /api/publish/accounts   # 添加平台账号
GET    /api/publish/accounts   # 获取账号列表
```

## 数据库Schema

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'creator',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 模板表
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  thumbnail TEXT,
  config JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 渲染任务表
CREATE TABLE render_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  template_id UUID REFERENCES templates(id),
  params JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  output_url TEXT,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- 发布任务表
CREATE TABLE publish_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  render_task_id UUID REFERENCES render_tasks(id),
  platforms TEXT[] NOT NULL,
  metadata JSONB NOT NULL,
  status JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 平台账号表
CREATE TABLE platform_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  platform VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_render_tasks_user_id ON render_tasks(user_id);
CREATE INDEX idx_render_tasks_status ON render_tasks(status);
CREATE INDEX idx_publish_tasks_render_task_id ON publish_tasks(render_task_id);
```

## 部署架构（Phase 1）

```
┌─────────────────────────────────────────┐
│         Vercel (Next.js)                │
│  ┌──────────────────────────────────┐   │
│  │  前端 + API Routes               │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         AWS                             │
│  ┌──────────┐  ┌──────────┐            │
│  │ Lambda   │  │   S3     │            │
│  │(渲染)    │  │(存储)    │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         外部服务                         │
│  ┌──────────┐  ┌──────────┐            │
│  │PostgreSQL│  │  Redis   │            │
│  │(Supabase)│  │(Upstash) │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
```

## 开发路线图

### Phase 1: MVP（2-3个月）
**Week 1-2: 基础搭建**
- [ ] 项目脚手架
- [ ] 数据库设计和迁移
- [ ] 用户认证系统

**Week 3-4: 模板系统**
- [ ] 5个基础模板开发
- [ ] 模板管理界面
- [ ] 模板预览功能

**Week 5-6: 渲染系统**
- [ ] Lambda渲染配置
- [ ] 任务队列实现
- [ ] 进度追踪

**Week 7-8: 发布系统**
- [ ] 抖音API集成
- [ ] 发布任务管理
- [ ] 账号授权流程

**Week 9-10: 集成测试**
- [ ] 端到端测试
- [ ] 性能优化
- [ ] Bug修复

**Week 11-12: 上线准备**
- [ ] 文档编写
- [ ] 部署配置
- [ ] 监控告警

### Phase 2: 扩展（3-4个月）
- 多平台支持（快手、视频号、B站）
- AI集成（文案、配音、字幕）
- 数据看板
- 高并发优化

### Phase 3: 智能化（4-6个月）
- 智能剪辑
- A/B测试
- 爆款分析
- 团队协作

## 风险与对策

### 技术风险
| 风险 | 影响 | 概率 | 对策 |
|------|------|------|------|
| Lambda冷启动慢 | 渲染延迟 | 高 | 预热策略、保持实例 |
| 平台API限流 | 发布失败 | 中 | 队列限速、重试机制 |
| 成本超预算 | 运营压力 | 中 | 监控告警、并发上限 |

### 业务风险
| 风险 | 影响 | 概率 | 对策 |
|------|------|------|------|
| 平台政策变化 | 功能失效 | 中 | 抽象层隔离、多平台分散 |
| 模板同质化 | 用户流失 | 高 | 持续更新、支持自定义 |
| 账号封禁 | 用户投诉 | 低 | 随机延迟、模拟人工 |

## 下一步行动

1. 确认技术栈选择（特别是后端语言）
2. 搭建项目脚手架
3. 实现第一个模板
4. 配置AWS Lambda渲染环境
