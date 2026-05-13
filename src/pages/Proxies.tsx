import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2 } from 'lucide-react';
import type { Proxy } from '@/types';

export function Proxies() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'proxies'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProxies(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Proxy)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'proxies'));
    return () => unsubscribe();
  }, [user]);

  const addProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await setDoc(doc(db, 'proxies', crypto.randomUUID()), {
        userId: user.uid, ip, port, username, password, status: 'active', createdAt: serverTimestamp()
      });
      toast.success(t.proxies.addProxy, `${ip}:${port}`);
      setIp(''); setPort(''); setUsername(''); setPassword('');
      setShowForm(false);
    } catch (err) {
      toast.error('Error', 'Failed to add proxy');
      handleFirestoreError(err, OperationType.CREATE, 'proxies');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, 'proxies', deleteTarget));
      toast.success(t.proxies.remove, 'Proxy removed');
    } catch (err) {
      toast.error('Error', 'Failed to remove proxy');
      handleFirestoreError(err, OperationType.DELETE, `proxies/${deleteTarget}`);
    } finally { setDeleteTarget(null); }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-semibold text-[#F5F5F7] tracking-tight">{t.proxies.title}</h1>
          <p className="text-[13px] text-[#6E6E73] mt-1">{t.proxies.network}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1.5" />{t.proxies.addProxy}</Button>
      </div>

      {showForm && (
        <div className="bg-[#1C1C1E] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
          <form onSubmit={addProxy} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-[#6E6E73]">{t.proxies.ip}</label><Input value={ip} onChange={e => setIp(e.target.value)} required /></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-[#6E6E73]">{t.proxies.port}</label><Input value={port} onChange={e => setPort(e.target.value)} required /></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-[#6E6E73]">{t.proxies.username}</label><Input value={username} onChange={e => setUsername(e.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-[#6E6E73]">{t.proxies.password}</label><Input value={password} onChange={e => setPassword(e.target.value)} type="password" /></div>
            <Button type="submit">{t.proxies.submit}</Button>
          </form>
        </div>
      )}

      <div className="bg-[#1C1C1E] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="grid grid-cols-4 text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider p-3.5 px-5 bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.04)]">
          <span>{t.proxies.ip}:{t.proxies.port}</span><span>{t.proxies.username}</span><span>{t.accounts.status}</span><span className="text-right">{t.accounts.actions}</span>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {proxies.length === 0 && <div className="p-8 text-center text-[#48484A] text-[13px]">{t.proxies.noProxies}</div>}
          {proxies.map(p => (
            <div key={p.id} className="grid grid-cols-4 p-3.5 px-5 border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] items-center transition-colors">
              <span className="text-[13px] font-medium text-[#0A84FF]">{p.ip}:{p.port}</span>
              <span className="text-[13px] text-[#A1A1A6]">{p.username || '-'}</span>
              <span><span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${p.status === 'active' ? 'text-[#30D158] bg-[rgba(48,209,88,0.12)]' : 'text-[#FF453A] bg-[rgba(255,69,58,0.12)]'}`}>{p.status === 'active' ? t.accounts.active : p.status}</span></span>
              <div className="flex justify-end"><Button variant="ghost" size="icon" className="h-7 w-7 text-[#6E6E73] hover:text-[#FF453A]" onClick={() => setDeleteTarget(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>
            </div>
          ))}
        </div>
      </div>
      <ConfirmDialog open={deleteTarget !== null} title={t.confirm.deleteTitle} description={t.confirm.deleteProxyDesc} confirmLabel={t.confirm.confirm} cancelLabel={t.confirm.cancel} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
