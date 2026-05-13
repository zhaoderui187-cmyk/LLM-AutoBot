# AccVault 🛡️

AccVault is a modern, Apple-style macOS-inspired desktop application for managing API accounts, proxy networks, and automating account registration via an integrated Python Playwright engine.

## ✨ Features

- **macOS-Inspired UI**: Beautiful glassmorphism sidebar, dark-themed containers, Apple Blue (`#0A84FF`) accents, and smooth animations.
- **API Gateway**: Route requests dynamically across multiple API keys based on availability, rate limits, and proxy health.
- **AutoBot Engine**: Integrated Python script runner for automating account registration (e.g., OpenAI, Claude). Logs output directly to the desktop app.
- **Account & Proxy Pool**: Store API keys safely and assign them proxies to avoid IP bans.
- **Built-in Backend**: Runs an Express server inside the Electron app for Webhook listening and API routing.

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Radix UI, Lucide Icons
- **Backend/Desktop**: Electron, Node.js, Express, Firebase Admin SDK
- **Automation**: Python 3, Playwright, Requests
- **Database**: Firebase Firestore

## 🛠️ Setup & Installation

### 1. Prerequisites

- **Node.js** (v18+)
- **Python** (v3.8+)
- **Git**

### 2. Clone the Repository

```bash
git clone https://github.com/zhaoderui187-cmyk/AccVault.git
cd AccVault
npm install
```

### 3. Firebase Configuration

AccVault uses Firebase Firestore to store accounts and proxies. 

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database**.
3. Go to Project Settings -> General -> Add Web App.
4. Copy the config values and rename `firebase-applet-config.example.json` to `firebase-applet-config.json`.
5. Fill in the values:
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

### 4. Setting up AutoBot (Python)

To use the integrated registration bot, install the Python dependencies:

```bash
pip install playwright requests
playwright install chromium
```

Open `bot_script.py` and customize the `register_account()` function to target the specific platform you want to automate.

### 5. Running the App (Development)

Run the Vite frontend and local Express server:
```bash
npm run dev
```

Run as an Electron Desktop App:
```bash
npm run electron:dev
```

### 6. Packaging for Production

Build the React app and package it into a standalone Windows `.exe`:
```bash
npm run pack
```

The compiled application will be available in the `release/` folder.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
