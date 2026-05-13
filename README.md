# LLM AutoBot 🛡️

[![English](https://img.shields.io/badge/Language-English-blue)](#) [![简体中文](https://img.shields.io/badge/Language-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-red)](README_zh-CN.md)

LLM AutoBot is a modern, Apple macOS-inspired desktop application for managing API accounts, routing API traffic, proxy networks, and automating account registration via an integrated Python Playwright engine.

## ✨ Features

- **macOS-Inspired UI**: Beautiful glassmorphism sidebar, dark-themed containers, Apple Blue (`#0A84FF`) accents, and smooth animations.
- **API Gateway**: Route requests dynamically across multiple API keys based on availability, rate limits, and proxy health.
- **AutoBot Engine**: Integrated Python script runner for automating account registration (e.g., OpenAI, Claude). Logs output directly to the desktop app.
- **Account & Proxy Pool**: Store API keys safely and assign them proxies to avoid IP bans.
- **Built-in Backend**: Runs an Express server inside the Electron app for Webhook listening and API routing.

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Radix UI
- **Backend/Desktop**: Electron, Node.js, Express, Firebase Admin SDK
- **Automation**: Python 3, Playwright, Requests
- **Database**: Firebase Firestore

---

## 🛠️ Step-by-Step Setup Guide

Follow these instructions carefully to set up the project on your local machine.

### 1. Prerequisites

Before you begin, ensure you have the following installed:
- **[Node.js](https://nodejs.org/)** (v18 or higher) - For running the app and building the frontend.
- **[Python](https://www.python.org/downloads/)** (v3.8 or higher) - Required for the AutoBot registration engine.
- **Git** - To clone the repository.

### 2. Clone the Repository

```bash
git clone https://github.com/zhaoderui187-cmyk/LLM-AutoBot.git
cd LLM-AutoBot
npm install
```

### 3. Firebase Configuration (Database)

LLM AutoBot uses Firebase Firestore to store accounts and proxies. You need to create your own free Firebase project.

**Step 3.1: Create a Project**
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and follow the prompts. You do *not* need Google Analytics.

**Step 3.2: Enable Firestore**
1. In the left sidebar, click **Firestore Database** -> **Create database**.
2. Start in **Test mode** (or Native mode) and select a region close to you.
3. After creation, go to the **Rules** tab in Firestore.
4. Open the `firestore.rules` file in this repository, copy its entire contents, and paste it into the Firebase Rules text box. Click **Publish**. This secures your database.

**Step 3.3: Get Web Configuration**
1. Go to **Project Settings** (the gear icon on the top left) -> **General**.
2. Scroll down to "Your apps" and click the **Web `</>`** icon to add a web app.
3. Register the app (name it "LLM AutoBot").
4. Firebase will show you a configuration object (`firebaseConfig`).
5. In your local project folder, rename `firebase-applet-config.example.json` to `firebase-applet-config.json`.
6. Open `firebase-applet-config.json` and replace the placeholder values with the values from your Firebase console:

```json
{
  "projectId": "your-project-id",
  "appId": "your-app-id",
  "apiKey": "your-api-key",
  "authDomain": "your-project.firebaseapp.com",
  "firestoreDatabaseId": "(default)",
  "storageBucket": "your-project.firebasestorage.app",
  "messagingSenderId": "your-sender-id"
}
```

### 4. Setting up AutoBot (Python Engine)

If you plan to use the automated account registration feature, you must set up the Python environment.

Open a new terminal in the `LLM AutoBot` directory and run:
```bash
pip install playwright requests
playwright install chromium
```

**How to customize the Bot:**
1. Open `bot_script.py` in the root directory.
2. Locate the `register_account(proxy=None)` function.
3. Write your specific Playwright automation logic inside the `try` block (e.g., `page.goto("https://target-website.com/signup")`, filling out email, fetching verification codes).
4. Return a tuple `(email, password, api_key)` upon successful registration. The app will automatically sync it to your database.

### 5. Running the Application

You can run the app in two ways:

**Option A: Browser Web App (Development)**
Runs the Vite dev server and the backend Express server.
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

**Option B: Electron Desktop App**
Runs the app as a native window (simulating production).
```bash
npm run electron:dev
```

### 6. Packaging into a Windows `.exe`

To build the final standalone executable for Windows:

```bash
npm run pack
```

Once the process finishes, you will find `LLM AutoBot.exe` inside the `release/LLM AutoBot-win32-x64/` directory. You can distribute this folder to anyone.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
