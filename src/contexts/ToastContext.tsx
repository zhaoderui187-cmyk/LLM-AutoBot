import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  success: () => {}, error: () => {}, warning: () => {}, info: () => {},
});

export const useToast = () => useContext(ToastContext);

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-[#30D158]" />,
  error: <XCircle className="h-5 w-5 text-[#FF453A]" />,
  warning: <AlertTriangle className="h-5 w-5 text-[#FF9F0A]" />,
  info: <Info className="h-5 w-5 text-[#0A84FF]" />,
};

const bgColors: Record<ToastType, string> = {
  success: 'border-[rgba(48,209,88,0.2)]',
  error: 'border-[rgba(255,69,58,0.2)]',
  warning: 'border-[rgba(255,159,10,0.2)]',
  info: 'border-[rgba(10,132,255,0.2)]',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const value: ToastContextType = {
    success: (t, m) => addToast('success', t, m),
    error: (t, m) => addToast('error', t, m),
    warning: (t, m) => addToast('warning', t, m),
    info: (t, m) => addToast('info', t, m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] space-y-2 max-w-sm">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className={`bg-[#2C2C2E] border ${bgColors[toast.type]} backdrop-blur-xl rounded-xl px-4 py-3 flex items-start gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.4)]`}
            >
              <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#F5F5F7]">{toast.title}</p>
                {toast.message && <p className="text-[12px] text-[#6E6E73] mt-0.5">{toast.message}</p>}
              </div>
              <button onClick={() => remove(toast.id)} className="shrink-0 text-[#48484A] hover:text-[#F5F5F7] transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
