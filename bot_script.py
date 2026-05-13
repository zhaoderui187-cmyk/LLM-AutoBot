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

# ─── Registration Flow (CUSTOMIZE THIS) ─────────────
def register_account(proxy=None):
    with sync_playwright() as p:
        browser_args = {}
        if proxy:
            server = f"http://{proxy['ip']}:{proxy['port']}"
            print(f"[*] Using proxy: {server}")
            browser_args["proxy"] = {
                "server": server,
                "username": proxy.get("username", ""),
                "password": proxy.get("password", ""),
            }
        
        try:
            browser = p.chromium.launch(headless=True, **browser_args)
            context = browser.new_context()
            page = context.new_page()
            
            # TODO: Implement your registration flow here
            print("[*] Navigating to target site...")
            # page.goto("https://platform.example.com/signup")
            time.sleep(1) # Simulated wait
            
            email = f"bot-{int(time.time())}@example.com"
            password = f"SecurePass{random.randint(1000,9999)}!"
            api_key = f"sk-simulated-{random.randint(10000,99999)}"
            
            print(f"[✓] Successfully registered: {email}")
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
