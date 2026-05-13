import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Bot, Wifi, WifiOff, Play, Pause, Copy, Check, RefreshCw, Users, Zap } from 'lucide-react';
import type { Account } from '@/types';

interface BotStatus {
  id: string;
  name: string;
  lastSeen: number;
  registered: number;
  errors: number;
}

export function AutoBot() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vaultKey, setVaultKey] = useState<string | null>(null);
  const [backendSecret, setBackendSecret] = useState<string>('');
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Account)));
    });
    // Load vault key
    (async () => {
      const vQ = query(collection(db, 'vaultRouting'), where('userId', '==', user.uid));
      const vSnap = await getDocs(vQ);
      if (!vSnap.empty) {
        setVaultKey(vSnap.docs[0].id);
        setBackendSecret(vSnap.docs[0].data().backendSecret || '');
      }
    })();
    return () => unsub();
  }, [user]);

  const [botStatus, setBotStatus] = useState<string>('stopped');
  const [botLogs, setBotLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!window.electronAPI) return;
    const unsubLog = window.electronAPI.onScriptLog((data) => {
      setBotLogs((prev) => [...prev, data]);
    });
    const unsubStatus = window.electronAPI.onScriptStatus((status) => {
      setBotStatus(status);
    });
    return () => {
      unsubLog();
      unsubStatus();
    };
  }, []);

  const startBot = async () => {
    if (!window.electronAPI) return;
    setBotLogs([]);
    setBotStatus('running');
    
    // Fetch proxies
    const pSnap = await getDocs(query(collection(db, 'proxies'), where('userId', '==', user?.uid)));
    const botProxies = pSnap.docs.map(d => d.data());
    
    window.electronAPI.runScript('bot_script.py', {
      vaultKey,
      backendSecret,
      proxies: botProxies,
    });
  };

  const stopBot = () => {
    if (window.electronAPI) {
      window.electronAPI.stopScript();
    }
  };

  const activeCount = accounts.filter(a => a.status === 'active').length;
  const exhaustedCount = accounts.filter(a => a.status === 'exhausted').length;
  const bannedCount = accounts.filter(a => a.status === 'banned').length;
  const host = window.location.origin;

  const botScript = `#!/usr/bin/env python3
"""
LLM AutoBot Auto-Registration Bot Framework
=========================================
This script provides the framework for automatically
registering accounts and pushing them to your LLM AutoBot.

Requirements: pip install playwright requests
Setup: playwright install chromium
"""

import requests
import time
import random
from playwright.sync_api import sync_playwright

# ─── Configuration ──────────────────────────────────
VAULT_URL = "${host}/api/vault/accounts/sync"
VAULT_KEY = "${vaultKey || 'YOUR_VAULT_KEY'}"
BACKEND_SECRET = "${backendSecret || 'YOUR_BACKEND_SECRET'}"
TARGET_PLATFORM = "GPT-5.5"

# Proxy pool (loaded from your LLM AutoBot proxy list)
PROXIES = [
    # {"ip": "1.2.3.4", "port": "8080", "user": "u", "pass": "p"},
]

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
        resp = requests.post(VAULT_URL, json=payload,
                             headers=headers, timeout=10)
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
    """
    Main registration logic.
    Customize this function for your target platform.
    Returns: (email, password, api_key) or None
    """
    with sync_playwright() as p:
        browser_args = {}
        if proxy:
            browser_args["proxy"] = {
                "server": f"http://{proxy['ip']}:{proxy['port']}",
                "username": proxy.get("user", ""),
                "password": proxy.get("pass", ""),
            }
        
        browser = p.chromium.launch(
            headless=True,
            **browser_args
        )
        context = browser.new_context()
        page = context.new_page()
        
        try:
            # ====================================
            # TODO: Implement your registration flow here
            # 
            # Example steps:
            # 1. page.goto("https://platform.example.com/signup")
            # 2. Fill registration form
            # 3. Handle email verification
            # 4. Navigate to API keys page
            # 5. Create and copy API key
            # ====================================
            
            email = f"bot-{int(time.time())}@example.com"
            password = f"SecurePass{random.randint(1000,9999)}!"
            api_key = "sk-placeholder"
            
            print(f"[!] Registration flow not implemented")
            print(f"[!] Customize register_account() function")
            return None
            
        except Exception as e:
            print(f"[✗] Registration error: {e}")
            return None
        finally:
            browser.close()

# ─── Main Loop ──────────────────────────────────────
def main():
    print("=" * 50)
    print("LLM AutoBot Auto-Registration Bot")
    print("=" * 50)
    
    target_count = 10  # Number of accounts to register
    registered = 0
    
    for i in range(target_count):
        print(f"\\n--- Attempt {i+1}/{target_count} ---")
        
        # Select proxy
        proxy = random.choice(PROXIES) if PROXIES else None
        
        result = register_account(proxy)
        if result:
            email, password, api_key = result
            if push_to_vault(email, password, api_key):
                registered += 1
        
        # Random delay between registrations
        delay = random.uniform(30, 120)
        print(f"[~] Waiting {delay:.0f}s before next attempt...")
        time.sleep(delay)
    
    print(f"\\n{'='*50}")
    print(f"Done! Registered {registered}/{target_count} accounts")

if __name__ == "__main__":
    main()`;

  const copyScript = () => {
    navigator.clipboard.writeText(botScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
    toast.success(t.autoBot.scriptCopied);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-[22px] font-semibold text-[#F5F5F7] tracking-tight">{t.autoBot.title}</h1>
        <p className="text-[13px] text-[#6E6E73] mt-1">{t.autoBot.subtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t.autoBot.totalPool, value: accounts.length, icon: <Users className="h-5 w-5" />, color: 'text-[#0A84FF]', bg: 'bg-[rgba(10,132,255,0.1)]' },
          { label: t.autoBot.activeAccounts, value: activeCount, icon: <Zap className="h-5 w-5" />, color: 'text-[#30D158]', bg: 'bg-[rgba(48,209,88,0.1)]' },
          { label: t.autoBot.exhaustedAccounts, value: exhaustedCount, icon: <Pause className="h-5 w-5" />, color: 'text-[#FF9F0A]', bg: 'bg-[rgba(255,159,10,0.1)]' },
          { label: t.autoBot.bannedAccounts, value: bannedCount, icon: <WifiOff className="h-5 w-5" />, color: 'text-[#FF453A]', bg: 'bg-[rgba(255,69,58,0.1)]' },
        ].map((s, i) => (
          <div key={i} className="bg-[#1C1C1E] rounded-xl p-4 border border-[rgba(255,255,255,0.06)]">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center ${s.color} mb-3`}>{s.icon}</div>
            <p className="text-[24px] font-bold text-[#F5F5F7] tracking-tight">{s.value}</p>
            <p className="text-[12px] text-[#6E6E73] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-[#1C1C1E] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
        <h2 className="text-[15px] font-semibold text-[#F5F5F7] mb-4">{t.autoBot.howItWorks}</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: '1', title: t.autoBot.step1Title, desc: t.autoBot.step1Desc, color: 'from-[#0A84FF] to-[#5E5CE6]' },
            { step: '2', title: t.autoBot.step2Title, desc: t.autoBot.step2Desc, color: 'from-[#30D158] to-[#0A84FF]' },
            { step: '3', title: t.autoBot.step3Title, desc: t.autoBot.step3Desc, color: 'from-[#FF9F0A] to-[#FF453A]' },
            { step: '4', title: t.autoBot.step4Title, desc: t.autoBot.step4Desc, color: 'from-[#BF5AF2] to-[#FF453A]' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${s.color} flex items-center justify-center text-white font-bold text-[14px] mx-auto mb-2.5 shadow-md`}>{s.step}</div>
              <p className="text-[13px] font-semibold text-[#F5F5F7] mb-1">{s.title}</p>
              <p className="text-[12px] text-[#6E6E73] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bot Controls & Logs */}
      {window.electronAPI && (
        <Card className="border-[rgba(10,132,255,0.15)] bg-[#1C1C1E]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[#0A84FF] text-[15px]">Local Bot Runner</CardTitle>
              <CardDescription className="mt-1">Run the Python bot script directly from the desktop app</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {botStatus === 'running' ? (
                <Button variant="destructive" onClick={stopBot}><Pause className="h-4 w-4 mr-1.5" /> Stop Bot</Button>
              ) : (
                <Button onClick={startBot} className="bg-[#30D158] text-black hover:bg-[#32D74B]"><Play className="h-4 w-4 mr-1.5" /> Start Bot</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-[#161618] border border-[rgba(255,255,255,0.08)] rounded-lg p-3 h-48 overflow-y-auto font-mono text-[12px] whitespace-pre-wrap">
              {botLogs.map((log, i) => (
                <div key={i} className={log.includes('[Error]') || log.includes('[✗]') ? 'text-[#FF453A]' : log.includes('[✓]') ? 'text-[#30D158]' : 'text-[#A1A1A6]'}>{log}</div>
              ))}
              {botLogs.length === 0 && <div className="text-[#48484A] italic">No logs yet. Click 'Start Bot' to begin.</div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bot Script */}
      <Card className="border-[rgba(10,132,255,0.15)]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-[#0A84FF] text-[14px]">{t.autoBot.botScript}</CardTitle>
              <CardDescription className="mt-1">{t.autoBot.botScriptDesc}</CardDescription>
            </div>
            <Button variant="secondary" onClick={copyScript}>
              {copiedScript ? <Check className="h-4 w-4 mr-1.5 text-[#30D158]" /> : <Copy className="h-4 w-4 mr-1.5" />}
              {t.autoBot.copyScript}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="p-4 rounded-lg bg-[#161618] border border-[rgba(255,255,255,0.04)] font-mono text-[11px] text-[#A1A1A6] overflow-x-auto max-h-[400px] overflow-y-auto leading-relaxed">
            {botScript}
          </pre>
        </CardContent>
      </Card>

      {/* Configuration */}
      {vaultKey && (
        <div className="bg-[#1C1C1E] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
          <h2 className="text-[15px] font-semibold text-[#F5F5F7] mb-4">{t.autoBot.config}</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-[13px] text-[#A1A1A6]">Webhook URL</span>
              <code className="text-[12px] text-[#30D158] font-mono">{host}/api/vault/accounts/sync</code>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-[13px] text-[#A1A1A6]">Vault Key</span>
              <code className="text-[12px] text-[#0A84FF] font-mono">{vaultKey.substring(0, 20)}...</code>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[13px] text-[#A1A1A6]">Backend Secret</span>
              <code className="text-[12px] text-[#FF9F0A] font-mono">{backendSecret.substring(0, 20)}...</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
