import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { Check, Copy, RefreshCw, KeyRound, Server } from 'lucide-react';

export function ApiProxy() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [vaultKey, setVaultKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeSyncing, setActiveSyncing] = useState(false);

  useEffect(() => { if (user) loadVaultRouting(); }, [user]);

  const loadVaultRouting = async () => {
    try {
      const q = query(collection(db, 'vaultRouting'), where('userId', '==', user?.uid));
      const snaps = await getDocs(q);
      if (!snaps.empty) setVaultKey(snaps.docs[0].id);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const generateVaultKey = async () => {
    if (!user) return;
    setActiveSyncing(true);
    try {
      const aSnap = await getDocs(query(collection(db, 'accounts'), where('userId', '==', user.uid)));
      const accounts = aSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const pSnap = await getDocs(query(collection(db, 'proxies'), where('userId', '==', user.uid)));
      const proxies = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const gen = () => 'sk-vault-' + Array.from({length: 32}, () => Math.floor(Math.random() * 36).toString(36)).join('');
      const newKey = gen(); const backendSecret = gen();
      await setDoc(doc(db, 'vaultRouting', newKey), { userId: user.uid, backendSecret, accounts, proxies, strategy: 'round-robin', updatedAt: serverTimestamp() });
      setVaultKey(newKey);
      toast.success(t.apiProxy.generateKey);
    } catch(err) { console.error(err); toast.error('Error', 'Failed to generate vault key'); }
    finally { setActiveSyncing(false); }
  };

  const syncAccountsToVault = async () => {
    if (!user || !vaultKey) return;
    setActiveSyncing(true);
    try {
      const aSnap = await getDocs(query(collection(db, 'accounts'), where('userId', '==', user.uid)));
      const pSnap = await getDocs(query(collection(db, 'proxies'), where('userId', '==', user.uid)));
      await updateDoc(doc(db, 'vaultRouting', vaultKey), { accounts: aSnap.docs.map(d => ({ id: d.id, ...d.data() })), proxies: pSnap.docs.map(d => ({ id: d.id, ...d.data() })), updatedAt: serverTimestamp() });
      toast.success(t.apiProxy.synced);
    } catch (err) { console.error(err); toast.error(t.apiProxy.syncFailed); }
    finally { setActiveSyncing(false); }
  };

  const copy = (text: string, isUrl: boolean) => {
    navigator.clipboard.writeText(text);
    if (isUrl) { setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }
    else { setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); }
  };

  const host = window.location.origin;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-semibold text-[#F5F5F7] tracking-tight">{t.apiProxy.title}</h1>
          <p className="text-[13px] text-[#6E6E73] mt-1">{t.apiProxy.routing}</p>
        </div>
        {vaultKey && (
          <Button variant="secondary" onClick={syncAccountsToVault} disabled={activeSyncing}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${activeSyncing ? 'animate-spin' : ''}`} />
            {t.apiProxy.syncAccounts}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#48484A] text-[13px]">{t.apiProxy.loadingVault}</div>
      ) : vaultKey ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#F5F5F7] text-[15px] font-semibold normal-case tracking-tight"><Server className="h-4 w-4 text-[#6E6E73]" />{t.apiProxy.baseUrl}</CardTitle>
                <CardDescription>{t.apiProxy.baseUrlDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input readOnly value={`${host}/v1`} className="font-mono text-[#30D158]" />
                  <Button variant="secondary" onClick={() => copy(`${host}/v1`, true)}>{copiedUrl ? <Check className="h-4 w-4 text-[#30D158]" /> : <Copy className="h-4 w-4" />}</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#F5F5F7] text-[15px] font-semibold normal-case tracking-tight"><KeyRound className="h-4 w-4 text-[#6E6E73]" />{t.apiProxy.vaultAccessKey}</CardTitle>
                <CardDescription>{t.apiProxy.vaultAccessKeyDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input readOnly value={vaultKey} type="password" className="font-mono text-[#0A84FF]" />
                  <Button variant="secondary" onClick={() => copy(vaultKey, false)}>{copiedKey ? <Check className="h-4 w-4 text-[#30D158]" /> : <Copy className="h-4 w-4" />}</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#161618]">
            <CardHeader><CardTitle>{t.apiProxy.clientExample}</CardTitle></CardHeader>
            <CardContent>
              <pre className="p-4 rounded-lg bg-[#1C1C1E] border border-[rgba(255,255,255,0.04)] font-mono text-[12px] text-[#A1A1A6] overflow-x-auto leading-relaxed">
{`from openai import OpenAI

client = OpenAI(
  api_key="`}<span className="text-[#0A84FF]">{vaultKey}</span>{`",
  base_url="`}<span className="text-[#30D158]">{host}/v1</span>{`"
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`}
              </pre>
            </CardContent>
          </Card>

          <Card className="border-[rgba(191,90,242,0.15)]">
            <CardHeader>
              <CardTitle className="text-[#BF5AF2]">{t.apiProxy.webhookTitle}</CardTitle>
              <CardDescription>{t.apiProxy.webhookDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="p-4 rounded-lg bg-[#1C1C1E] border border-[rgba(255,255,255,0.04)] font-mono text-[12px] text-[#A1A1A6] overflow-x-auto leading-relaxed">
{`import requests

def push_account(email, password, apikey):
    url = "`}<span className="text-[#30D158]">{host}/api/vault/accounts/sync</span>{`"
    headers = {
        "Authorization": "Bearer `}<span className="text-[#0A84FF]">{vaultKey}</span>{`",
        "X-Backend-Secret": "`}<span className="text-[#FF9F0A]">YOUR_BACKEND_SECRET</span>{`",
        "Content-Type": "application/json"
    }
    payload = {
        "email": email,
        "password": password,
        "apiKey": apikey,
        "platform": "GPT-5.5",
        "status": "active"
    }
    resp = requests.post(url, json=payload, headers=headers)
    print("Status:", resp.json())`}
              </pre>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex justify-center py-16">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-[#0A84FF] to-[#5E5CE6] rounded-2xl flex items-center justify-center mb-3 shadow-[0_4px_12px_rgba(10,132,255,0.3)]">
                <KeyRound className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-[18px] text-[#F5F5F7] normal-case tracking-tight">{t.apiProxy.initVault}</CardTitle>
              <CardDescription className="mt-2">{t.apiProxy.initVaultDesc}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-6">
              <Button size="lg" onClick={generateVaultKey} disabled={activeSyncing}><KeyRound className="h-4 w-4 mr-2" />{t.apiProxy.generateKey}</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
