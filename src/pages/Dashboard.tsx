import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Users, Server, Activity, Zap, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface ApiStatsData {
  totalServed: number;
  rateLimitHits: number;
  avgLatencyMs: number;
  accountUsage: Record<string, number>;
}

export function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({ accounts: 0, proxies: 0, tasks: 0 });
  const [apiStats, setApiStats] = useState<ApiStatsData>({ totalServed: 0, rateLimitHits: 0, avgLatencyMs: 0, accountUsage: {} });
  const [rotationEnabled, setRotationEnabled] = useState(true);
  const [rotationStrategy, setRotationStrategy] = useState('round-robin');

  useEffect(() => {
    const savedAuto = localStorage.getItem('nexus_auto_rotate');
    if (savedAuto !== null) setRotationEnabled(savedAuto === 'true');
    const savedStrategy = localStorage.getItem('nexus_rotate_strategy');
    if (savedStrategy) setRotationStrategy(savedStrategy);
  }, []);

  const handleRotationChange = (enabled: boolean) => {
    setRotationEnabled(enabled);
    localStorage.setItem('nexus_auto_rotate', String(enabled));
  };

  const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRotationStrategy(e.target.value);
    localStorage.setItem('nexus_rotate_strategy', e.target.value);
  };

  useEffect(() => {
    if (!user) return;
    const qAccounts = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubscribeAccounts = onSnapshot(qAccounts, (s) => setStats(p => ({ ...p, accounts: s.size })), (e) => handleFirestoreError(e, OperationType.LIST, 'accounts'));
    const qProxies = query(collection(db, 'proxies'), where('userId', '==', user.uid));
    const unsubscribeProxies = onSnapshot(qProxies, (s) => setStats(p => ({ ...p, proxies: s.size })), (e) => handleFirestoreError(e, OperationType.LIST, 'proxies'));
    const qTasks = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const unsubscribeTasks = onSnapshot(qTasks, (s) => setStats(p => ({ ...p, tasks: s.size })), (e) => handleFirestoreError(e, OperationType.LIST, 'tasks'));

    const fetchApiStats = async () => {
      try {
        const vaultQ = query(collection(db, 'vaultRouting'), where('userId', '==', user.uid));
        const snaps = await getDocs(vaultQ);
        if (!snaps.empty) {
          const vaultKey = snaps.docs[0].id;
          const res = await fetch(`${window.location.origin}/api/vault/stats/${vaultKey}`);
          if (res.ok) {
            const data = await res.json();
            setApiStats({ totalServed: data.totalServed || 0, rateLimitHits: data.rateLimitHits || 0, avgLatencyMs: data.avgLatencyMs || 0, accountUsage: data.accountUsage || {} });
          }
        }
      } catch (err) { console.error('Failed to fetch api stats', err); }
    };
    fetchApiStats();
    const interval = setInterval(fetchApiStats, 10000);
    return () => { unsubscribeAccounts(); unsubscribeProxies(); unsubscribeTasks(); clearInterval(interval); };
  }, [user]);

  const successRate = apiStats.totalServed > 0 ? ((1 - (apiStats.rateLimitHits / apiStats.totalServed)) * 100).toFixed(1) : '100.0';
  const avgLatencyDisplay = apiStats.avgLatencyMs > 0 ? `${(apiStats.avgLatencyMs / 1000).toFixed(2)}s` : '--';

  const statCards = [
    { label: t.dashboard.totalAccounts, value: stats.accounts, icon: <Users className="h-5 w-5" />, color: 'text-[#0A84FF]', bg: 'bg-[rgba(10,132,255,0.1)]' },
    { label: t.dashboard.activeProxies, value: stats.proxies, icon: <Server className="h-5 w-5" />, color: 'text-[#30D158]', bg: 'bg-[rgba(48,209,88,0.1)]' },
    { label: t.dashboard.runningTasks, value: stats.tasks, icon: <Activity className="h-5 w-5" />, color: 'text-[#FF9F0A]', bg: 'bg-[rgba(255,159,10,0.1)]' },
    { label: t.dashboard.totalApisServed, value: apiStats.totalServed.toLocaleString(), icon: <Zap className="h-5 w-5" />, color: 'text-[#BF5AF2]', bg: 'bg-[rgba(191,90,242,0.1)]' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-[22px] font-semibold text-[#F5F5F7] tracking-tight">{t.dashboard.title}</h1>
        <p className="text-[13px] text-[#6E6E73] mt-1">{t.dashboard.overview}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <div key={i} className="bg-[#1C1C1E] rounded-xl p-4 border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>{s.icon}</div>
            </div>
            <p className="text-[24px] font-bold text-[#F5F5F7] tracking-tight">{s.value}</p>
            <p className="text-[12px] text-[#6E6E73] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Routing Config */}
        <div className="bg-[#1C1C1E] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
          <h2 className="text-[15px] font-semibold text-[#F5F5F7] mb-4">{t.dashboard.routingConfig}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#F5F5F7] font-medium">{t.dashboard.autoRotation}</p>
                <p className="text-[12px] text-[#6E6E73] mt-0.5 leading-relaxed">{t.dashboard.autoRotationDesc}</p>
              </div>
              <button
                onClick={() => handleRotationChange(!rotationEnabled)}
                className={`relative inline-flex h-[26px] w-[46px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 ease-in-out ${rotationEnabled ? 'bg-[#30D158]' : 'bg-[#48484A]'}`}
              >
                <span className={`inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-in-out ${rotationEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
              </button>
            </div>
            <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <label className="text-[12px] font-medium text-[#6E6E73] block mb-2">{t.dashboard.rotationStrategy}</label>
              <select
                value={rotationStrategy}
                onChange={handleStrategyChange}
                disabled={!rotationEnabled}
                className="w-full bg-[#2C2C2E] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-[13px] text-[#F5F5F7] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[rgba(10,132,255,0.25)] disabled:opacity-40 appearance-none"
              >
                <option value="round-robin">{t.dashboard.roundRobin}</option>
                <option value="random">{t.dashboard.random}</option>
                <option value="least-used">{t.dashboard.leastUsed}</option>
                <option value="long-life">{t.dashboard.longLife}</option>
              </select>
            </div>
          </div>
        </div>

        {/* API Stats */}
        <div className="bg-[#1C1C1E] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
          <h2 className="text-[15px] font-semibold text-[#F5F5F7] mb-4">{t.dashboard.apiStats}</h2>
          <div className="space-y-1">
            {[
              { icon: <TrendingUp className="h-4 w-4" />, label: t.dashboard.successRate, value: `${successRate}%`, color: 'text-[#30D158]' },
              { icon: <Clock className="h-4 w-4" />, label: t.dashboard.avgLatency, value: avgLatencyDisplay, color: 'text-[#0A84FF]' },
              { icon: <AlertTriangle className="h-4 w-4" />, label: t.dashboard.rateLimitHits, value: apiStats.rateLimitHits, color: 'text-[#FF453A]' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                <div className="flex items-center gap-2.5 text-[#A1A1A6]">
                  {item.icon}
                  <span className="text-[13px]">{item.label}</span>
                </div>
                <span className={`text-[14px] font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
