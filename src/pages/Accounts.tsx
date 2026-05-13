import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Account, AccountStatus } from '@/types';

export function Accounts() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState('GPT-5.5');
  const [status, setStatus] = useState<AccountStatus>('active');
  const [apiKey, setApiKey] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
      setAccounts(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'accounts'));
    
    return () => unsubscribe();
  }, [user]);

  const addAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await setDoc(doc(db, 'accounts', crypto.randomUUID()), {
        userId: user.uid,
        email,
        platform,
        status,
        apiKey,
        password: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setEmail('');
      setApiKey('');
      toast.success(t.accounts.addAccount, email);
    } catch (err) {
      toast.error('Error', 'Failed to add account');
      handleFirestoreError(err, OperationType.CREATE, 'accounts');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, 'accounts', deleteTarget));
      toast.success(t.accounts.delete, 'Account removed successfully');
    } catch (err) {
      toast.error('Error', 'Failed to delete account');
      handleFirestoreError(err, OperationType.DELETE, `accounts/${deleteTarget}`);
    } finally {
      setDeleteTarget(null);
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'active': return t.accounts.active;
      case 'exhausted': return t.accounts.exhausted;
      case 'banned': return t.accounts.banned;
      case 'pending': return t.accounts.pending;
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-6 border-b border-[#27272A] pb-4">
        <h1 className="text-xl font-semibold tracking-tight">{t.accounts.title}<span className="text-xs font-mono text-[#71717A] ml-2">{t.accounts.management}</span></h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t.accounts.addAccount}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addAccount} className="flex gap-4 items-end flex-wrap md:flex-nowrap">
            <div className="flex-1 space-y-1 w-full md:w-auto">
              <label className="text-[10px] text-[#71717A] tracking-widest uppercase">{t.accounts.platform}</label>
              <Input value={platform} onChange={e => setPlatform(e.target.value)} required />
            </div>
            <div className="flex-1 space-y-1 w-full md:w-auto">
              <label className="text-[10px] text-[#71717A] tracking-widest uppercase">{t.accounts.email}</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="flex-1 space-y-1 w-full md:w-auto">
              <label className="text-[10px] text-[#71717A] tracking-widest uppercase">{t.accounts.status}</label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value as AccountStatus)} 
                className="flex h-8 w-full rounded border border-[#27272A] bg-[#111114] px-3 py-1 text-xs font-mono text-[#E4E4E7] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3F3F46]"
              >
                <option value="active">{t.accounts.active}</option>
                <option value="exhausted">{t.accounts.exhausted}</option>
                <option value="banned">{t.accounts.banned}</option>
                <option value="pending">{t.accounts.pending}</option>
              </select>
            </div>
            <div className="flex-1 space-y-1 w-full md:w-auto">
              <label className="text-[10px] text-[#71717A] tracking-widest uppercase">{t.accounts.apiKey}</label>
              <Input value={apiKey} onChange={e => setApiKey(e.target.value)} />
            </div>
            <Button type="submit" className="w-full md:w-auto mt-4 md:mt-0">{t.accounts.submit}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-3 mt-4">
          <h2 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-widest">{t.accounts.registry}</h2>
          <span className="text-[10px] text-[#71717A] font-mono">{t.accounts.strategy}</span>
        </div>
        <div className="bg-[#18181B] border border-[#27272A] rounded-lg overflow-hidden flex flex-col">
          <div className="grid grid-cols-5 text-[10px] font-bold text-[#71717A] border-b border-[#27272A] p-3 uppercase tracking-tighter bg-[#111114]">
            <span>{t.accounts.platform}</span>
            <span>{t.accounts.email}</span>
            <span>{t.accounts.apiKey}</span>
            <span>{t.accounts.status}</span>
            <span>{t.accounts.actions}</span>
          </div>
          <div className="font-mono text-sm max-h-[600px] overflow-y-auto">
            {accounts.length === 0 ? (
              <div className="p-4 text-center text-[#71717A] text-xs">{t.accounts.noAccounts}</div>
            ) : null}
            {accounts.map(acc => (
              <div key={acc.id} className="grid grid-cols-5 p-3 border-b border-[#27272A] hover:bg-[#27272A]/30 items-center transition-colors">
                <span className="text-blue-400 font-sans text-xs">{acc.platform}</span>
                <span className="text-zinc-300 truncate pr-4 text-xs">{acc.email}</span>
                <span className="text-zinc-500 text-[10px] truncate pr-4">{acc.apiKey ? acc.apiKey.substring(0, 15) + '...' : '--'}</span>
                <span>
                  <span className={`px-2 py-0.5 rounded text-[10px] border ${
                    acc.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                    acc.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {getStatusText(acc.status).toUpperCase()}
                  </span>
                </span>
                <div>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(acc.id)}>{t.accounts.delete}</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t.confirm.deleteTitle}
        description={t.confirm.deleteAccountDesc}
        confirmLabel={t.confirm.confirm}
        cancelLabel={t.confirm.cancel}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
