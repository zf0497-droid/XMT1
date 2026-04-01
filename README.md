# React Video Editor Pro - 中文版

一个功能强大的在线视频编辑器，已完成中文化翻译。

## ✨ 特性

- 🎬 **视频编辑** - 完整的视频编辑功能
- 📝 **文字工具** - 丰富的文字样式和动画
- 🎵 **音频处理** - 音频添加和编辑
- 📑 **字幕支持** - SRT字幕上传和生成
- 🖼️ **图片处理** - 图片添加和编辑
- 🎨 **动画效果** - 入场/出场动画
- 📱 **移动端适配** - 响应式设计
- 🌐 **完整中文化** - 95%界面已翻译

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 运行开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3001](http://localhost:3001)

### 构建生产版本

```bash
npm run build
npm start
```

## 📦 技术栈

- **框架**: Next.js 14
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **视频处理**: Remotion
- **UI组件**: Radix UI
- **状态管理**: React Context

## 🌍 中文化

本项目已完成95%的中文化翻译，包括：

- ✅ 所有核心编辑面板
- ✅ 时间轴控制
- ✅ 设置面板
- ✅ 错误提示
- ✅ 移动端界面
- ✅ 使用文档

详见 [翻译完成总结.md](./翻译完成总结.md)

## 📝 项目结构

```
app/reactvideoeditor/pro/
├── components/          # UI组件
│   ├── overlay/        # 编辑面板
│   ├── shared/         # 共享组件
│   └── advanced-timeline/ # 时间轴
├── locales/            # 语言包
│   ├── zh-CN.ts       # 中文翻译
│   └── index.ts       # 导出
├── contexts/           # React Context
└── utils/              # 工具函数
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

基于 React Video Editor Pro 项目进行中文化翻译。
