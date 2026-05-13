import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Terminal, CheckCircle2, XCircle, AlertCircle, Play } from 'lucide-react';
import type { Task, TaskStatus } from '@/types';

export function Tasks() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskName, setTaskName] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
      data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setTasks(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tasks'));
    return () => unsubscribe();
  }, [user]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await setDoc(doc(db, 'tasks', crypto.randomUUID()), {
        userId: user.uid, name: taskName, status: 'running' as TaskStatus,
        logs: 'Task started...\nInitializing...\n', createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      toast.success(t.tasks.launchScript, taskName);
      setTaskName('');
    } catch (err) { toast.error('Error', 'Failed to create task'); handleFirestoreError(err, OperationType.CREATE, 'tasks'); }
  };

  const updateTaskStatus = async (id: string, status: TaskStatus, newLog?: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      await updateDoc(doc(db, 'tasks', id), { status, logs: (task.logs || '') + (newLog ? `\n${newLog}` : ''), updatedAt: serverTimestamp() });
      toast.info(task.name, `Status → ${status}`);
    } catch (err) { toast.error('Error', 'Failed to update task'); handleFirestoreError(err, OperationType.UPDATE, `tasks/${id}`); }
  };

  const statusIcon: Record<string, React.ReactNode> = {
    running: <Terminal className="h-4 w-4 text-[#0A84FF] animate-pulse" />,
    completed: <CheckCircle2 className="h-4 w-4 text-[#30D158]" />,
    failed: <XCircle className="h-4 w-4 text-[#FF453A]" />,
    manual_action_required: <AlertCircle className="h-4 w-4 text-[#FF9F0A]" />,
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-[22px] font-semibold text-[#F5F5F7] tracking-tight">{t.tasks.title}</h1>
        <p className="text-[13px] text-[#6E6E73] mt-1">{t.tasks.tasksSummary}</p>
      </div>

      <div className="bg-[#1C1C1E] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
        <form onSubmit={addTask} className="flex gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] font-medium text-[#6E6E73]">{t.tasks.scriptName}</label>
            <Input value={taskName} onChange={e => setTaskName(e.target.value)} required placeholder={t.tasks.scriptPlaceholder} />
          </div>
          <Button type="submit"><Play className="h-4 w-4 mr-1.5" />{t.tasks.startRun}</Button>
        </form>
      </div>

      <div className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="bg-[#1C1C1E] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[rgba(255,255,255,0.04)]">
              <div className="flex items-center gap-2.5">
                {statusIcon[task.status] || statusIcon.running}
                <span className="text-[13px] font-medium text-[#F5F5F7]">{task.name}</span>
              </div>
              <div className="flex gap-2">
                {task.status === 'running' && (<>
                  <Button size="sm" variant="secondary" onClick={() => updateTaskStatus(task.id, 'manual_action_required', t.tasks.pausedMsg)}>{t.tasks.pauseManual}</Button>
                  <Button size="sm" variant="destructive" onClick={() => updateTaskStatus(task.id, 'failed', t.tasks.abortedMsg)}>{t.tasks.abort}</Button>
                  <Button size="sm" className="bg-[rgba(48,209,88,0.1)] text-[#30D158] hover:bg-[rgba(48,209,88,0.18)]" onClick={() => updateTaskStatus(task.id, 'completed', t.tasks.successMsg)}>{t.tasks.complete}</Button>
                </>)}
                {task.status === 'manual_action_required' && (
                  <Button size="sm" onClick={() => updateTaskStatus(task.id, 'running', 'Resuming...')}>{t.tasks.resume}</Button>
                )}
              </div>
            </div>
            <div className="bg-[#161618] p-4 text-[#30D158] font-mono text-[12px] whitespace-pre-wrap overflow-y-auto max-h-[200px] leading-relaxed">{task.logs}</div>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-center text-[#48484A] py-8 text-[13px]">{t.tasks.noTasks}</p>}
      </div>
    </div>
  );
}
