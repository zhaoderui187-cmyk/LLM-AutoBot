# LLM AutoBot 🛡️

[![English](https://img.shields.io/badge/Language-English-blue)](README.md) [![简体中文](https://img.shields.io/badge/Language-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-red)](#)

LLM AutoBot 是一款现代化的、基于 Apple macOS 设计风格的桌面应用程序。主要用于管理 API 账号库、代理网络配置、API 流量网关路由，以及内置 Python Playwright 引擎的自动化注册机（AutoBot）。

## ✨ 核心特性

- **macOS 风格 UI**：全局毛玻璃侧边栏、深色卡片设计、Apple 标志性蓝色 (`#0A84FF`) 点缀、圆滑过渡动画。
- **API 网关路由**：根据可用额度、被封禁状态及代理健康度，动态、智能地切换并分配多组 API Key。
- **自动化注册机 (AutoBot)**：内置 Python 脚本运行器，用于自动注册账号（如 OpenAI、Claude 等）。运行日志直接通过 IPC 管道实时输出到桌面应用面板。
- **账号与代理池池化管理**：安全存储 API 凭证，并与对应的高匿代理 IP 绑定防封。
- **内置后端引擎**：在 Electron 主进程中集成 Express 服务器，处理 Webhook 回调、自动化接口与路由转发。

## 🚀 技术栈

- **前端**：React 19, Vite, Tailwind CSS 4, Radix UI
- **后端 & 桌面端**：Electron, Node.js, Express, Firebase Admin SDK
- **自动化**：Python 3, Playwright, Requests
- **数据库**：Firebase Firestore (Serverless)

---

## 🛠️ 详细安装与部署教程

请严格按照以下步骤在你的本地计算机上配置并运行此项目。

### 1. 基础环境准备

在开始之前，请确保你的电脑已安装以下环境：
- **[Node.js](https://nodejs.org/)** (v18 或更高版本) - 用于运行项目和编译前端。
- **[Python](https://www.python.org/downloads/)** (v3.8 或更高版本) - 注册机 AutoBot 所需环境。
- **Git** - 用于克隆代码。

### 2. 克隆代码仓库

```bash
git clone https://github.com/zhaoderui187-cmyk/LLM-AutoBot.git
cd LLM-AutoBot
npm install
```

### 3. 配置 Firebase (数据库)

LLM AutoBot 完全依托免费的 Firebase Firestore 来存储账号和代理数据。你需要自己创建一个 Firebase 项目。

**3.1: 创建 Firebase 项目**
1. 访问 [Firebase Console](https://console.firebase.google.com/)。
2. 点击 **添加项目 (Add project)** 并按照提示完成创建（无需启用 Google Analytics）。

**3.2: 启用 Firestore 数据库**
1. 在左侧菜单栏，点击 **Firestore Database** -> **创建数据库 (Create database)**。
2. 选择 **测试模式 (Test mode)** 启动，并选择一个离你最近的服务器节点。
3. 创建完成后，点击顶部的 **规则 (Rules)** 选项卡。
4. 打开你刚刚克隆下来的本地代码库中的 `firestore.rules` 文件，**复制里面的所有代码**，粘贴并覆盖 Firebase 网页上的内容，然后点击 **发布 (Publish)**。这保证了你的数据库安全。

**3.3: 获取 Web 配置文件**
1. 点击左上角的齿轮图标进入 **项目设置 (Project Settings)** -> **常规 (General)**。
2. 向下滚动到 "你的应用 (Your apps)"，点击 **Web `</>`** 图标添加一个 Web 应用。
3. 给应用起个名字（比如 LLM AutoBot）并注册。
4. 注册后，屏幕上会出现一段带有 `firebaseConfig` 的代码块。
5. 回到你的本地代码目录，找到 `firebase-applet-config.example.json` 文件，并将其重命名为 `firebase-applet-config.json`。
6. 打开 `firebase-applet-config.json`，把从网页上复制的键值对替换进去：

```json
{
  "projectId": "你的-project-id",
  "appId": "你的-app-id",
  "apiKey": "你的-api-key",
  "authDomain": "你的-project.firebaseapp.com",
  "firestoreDatabaseId": "(default)",
  "storageBucket": "你的-project.firebasestorage.app",
  "messagingSenderId": "你的-sender-id"
}
```

### 4. 配置自动化注册机 (Python Bot)

如果你打算使用软件自带的“一键注册账号”功能，请配置 Python 环境。

在 `LLM AutoBot` 目录下打开一个新的终端，运行：
```bash
pip install playwright requests
playwright install chromium
```

**如何自定义注册脚本：**
1. 在根目录打开 `bot_script.py` 文件。
2. 找到 `register_account(proxy=None)` 函数。
3. 在 `try` 代码块中编写你自己的 Playwright 自动化逻辑（例如：`page.goto("https://你要注册的网站.com")`，自动填写邮箱，自动点击按钮获取验证码等）。
4. 注册成功后，只要确保函数最终返回一个包含 `(email, password, api_key)` 的元组，桌面端应用就会**自动通过 Webhook 将该账号录入你的数据库库存**！

### 5. 启动应用程序

你有两种方式可以启动开发环境：

**方式 A: 浏览器 Web 模式 (推荐开发调试用)**
该命令会同时启动 Vite 前端热更服务以及后端的 Express API 服务。
```bash
npm run dev
```
然后用浏览器打开 `http://localhost:3000` 即可。

**方式 B: Electron 桌面端模式**
作为原生窗口运行（模拟最终的生产环境体验）。
```bash
npm run electron:dev
```

### 6. 打包输出 Windows `.exe`

如果你想将应用编译打包为独立的 Windows 可执行程序发给别人，运行：

```bash
npm run pack
```

打包需要几分钟时间，完成后，你会在 `release/LLM AutoBot-win32-x64/` 目录下找到 `LLM AutoBot.exe`。你可以直接打包压缩这个文件夹发给任何人使用！

---

## 🤝 参与贡献

非常欢迎任何形式的贡献和 Pull Request！

1. Fork 这个项目
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄 开源协议

本项目采用 MIT 协议开源 - 查看 LICENSE 文件了解更多细节。
