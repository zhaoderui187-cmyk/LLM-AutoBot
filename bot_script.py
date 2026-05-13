#!/usr/bin/env python3
"""
LLM AutoBot Auto-Registration Bot Framework
=========================================
This script registers accounts and pushes them to your LLM AutoBot.
Requirements:
  pip install playwright requests
  playwright install chromium
"""

import requests
import time
import random
import sys
import json
import os
from playwright.sync_api import sync_playwright

# ─── Configuration ──────────────────────────────────
# Defaults (will be overridden by args if passed, or just hardcode here)
VAULT_URL = "http://localhost:3000/api/vault/accounts/sync"
VAULT_KEY = "YOUR_VAULT_KEY"
BACKEND_SECRET = "YOUR_BACKEND_SECRET"
TARGET_PLATFORM = "GPT-5.5"

# Load config from command line arguments if available
# This allows the Electron app to pass the current vault key
config_file = sys.argv[1] if len(sys.argv) > 1 else "bot_config.json"
try:
    with open(config_file, "r") as f:
        conf = json.load(f)
        VAULT_KEY = conf.get("vaultKey", VAULT_KEY)
        BACKEND_SECRET = conf.get("backendSecret", BACKEND_SECRET)
        PROXIES = conf.get("proxies", [])
except FileNotFoundError:
    PROXIES = []
    print("[!] No bot_config.json found. Using defaults.")

# ─── Vault Sync ─────────────────────────────────────
def push_to_vault(email, password, api_key):
    """Push a newly registered account to LLM AutoBot."""
    headers = {
        "Authorization": f"Bearer {VAULT_KEY}",
        "X-Backend-Secret": BACKEND_SECRET,
        "Content-Type": "application/json"
    }
    payload = {
        "email": email,
        "password": password,
        "apiKey": api_key,
        "platform": TARGET_PLATFORM,
        "status": "active"
    }
    try:
        resp = requests.post(VAULT_URL, json=payload, headers=headers, timeout=10)
        data = resp.json()
        if data.get("success"):
            print(f"[✓] Synced {email} -> LLM AutoBot")
            return True
        else:
            print(f"[✗] Sync failed: {data}")
            return False
    except Exception as e:
        print(f"[✗] Sync error: {e}")
        return False

# ─── Temp Mail Helper (1secmail API) ────────────────
def get_temp_email():
    import string
    domain = "1secmail.com"
    username = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    return f"{username}@{domain}", username, domain

def wait_for_verification_email(username, domain, retries=15, delay=5):
    print(f"[*] 等待 {username}@{domain} 的验证邮件...")
    for _ in range(retries):
        time.sleep(delay)
        try:
            resp = requests.get(f"https://www.1secmail.com/api/v1/?action=getMessages&login={username}&domain={domain}").json()
            if resp and len(resp) > 0:
                mail_id = resp[0]['id']
                mail_resp = requests.get(f"https://www.1secmail.com/api/v1/?action=readMessage&login={username}&domain={domain}&id={mail_id}").json()
                body = mail_resp.get('textBody', '')
                
                # 尝试提取验证链接 (根据实际情况修改正则)
                import re
                urls = re.findall(r'https?://[^\s<>"]+verify[^\s<>"]+', body)
                if urls: return urls[0]
                
                urls = re.findall(r'https?://[^\s<>"]+', body)
                if urls: return urls[0]
        except Exception as e:
            pass
    return None

# ─── Registration Flow (CUSTOMIZE THIS) ─────────────
def register_account(proxy=None):
    email, mail_user, mail_domain = get_temp_email()
    import string
    password = ''.join(random.choices(string.ascii_letters + string.digits, k=12)) + "Aa1!"
    
    print(f"[*] 准备注册: {email} | {password}")
    
    with sync_playwright() as p:
        browser_args = {
            "headless": False, # 改为 False 可以在本地看到自动点击的过程
            "args": ["--disable-blink-features=AutomationControlled"]
        }
        if proxy:
            server = f"http://{proxy['ip']}:{proxy['port']}"
            print(f"[*] Using proxy: {server}")
            browser_args["proxy"] = {
                "server": server,
                "username": proxy.get("username", ""),
                "password": proxy.get("password", ""),
            }
        
        try:
            browser = p.chromium.launch(**browser_args)
            context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            page = context.new_page()
            
            # TODO: 实现你的注册逻辑
            print("[*] 正在访问目标注册网站...")
            page.goto("https://example.com/signup", timeout=30000)
            
            # 1. 自动填表
            # page.locator("input[type='email']").fill(email)
            # page.locator("button[type='submit']").click()
            time.sleep(2)
            
            # 2. 遇到验证码 (CAPTCHA)
            # 你可能需要接入 2captcha 等打码平台，或者设置一个暂停让你手动点
            print("[!] 若遇到验证码，请手动完成，或接入打码 API...")
            
            # 3. 邮箱验证
            # verify_url = wait_for_verification_email(mail_user, mail_domain)
            # if not verify_url: raise Exception("未收到验证邮件")
            # page.goto(verify_url)
            
            # 4. 短信验证 (需要接码平台如 smspool)
            # phone = requests.get("https://smspool.net/api/get_number...").json()
            # page.locator("input[name='phone']").fill(phone['number'])
            
            # 5. 提取 API Key
            # page.goto("https://example.com/api-keys")
            # api_key = page.locator(".api-key").input_value()
            
            # 模拟生成 (请替换为实际提取的 Key)
            api_key = f"sk-simulated-{random.randint(10000,99999)}"
            
            print(f"[✓] 成功注册并获取到 Key！")
            return (email, password, api_key)
            
        except Exception as e:
            print(f"[✗] Registration error: {e}")
            return None
        finally:
            if 'browser' in locals():
                browser.close()

# ─── Main Loop ──────────────────────────────────────
def main():
    print("=" * 50)
    print("LLM AutoBot Auto-Registration Bot")
    print("=" * 50)
    
    # Check if we have credentials
    if VAULT_KEY == "YOUR_VAULT_KEY":
        print("[!] Warning: VAULT_KEY is not set. Have you initialized the Vault?")
    
    target_count = 3  # For simulation purposes
    registered = 0
    
    for i in range(target_count):
        print(f"\\n--- Attempt {i+1}/{target_count} ---")
        
        proxy = random.choice(PROXIES) if PROXIES else None
        
        result = register_account(proxy)
        if result:
            email, password, api_key = result
            if push_to_vault(email, password, api_key):
                registered += 1
        
        if i < target_count - 1:
            delay = random.uniform(2, 5) # Short delay for testing
            print(f"[~] Waiting {delay:.1f}s before next attempt...")
            time.sleep(delay)
    
    print(f"\\n{'='*50}")
    print(f"Done! Registered {registered}/{target_count} accounts")

if __name__ == "__main__":
    # Force unbuffered stdout so electron gets logs in real-time
    sys.stdout = os.fdopen(sys.stdout.fileno(), 'w', 1) if hasattr(os, 'fdopen') else sys.stdout
    main()
