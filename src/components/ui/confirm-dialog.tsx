import React from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="relative bg-[#2C2C2E] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                variant === 'danger' ? 'bg-[rgba(255,69,58,0.12)]' : 'bg-[rgba(255,159,10,0.12)]'
              }`}>
                <AlertTriangle className={`h-6 w-6 ${variant === 'danger' ? 'text-[#FF453A]' : 'text-[#FF9F0A]'}`} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#F5F5F7] mb-1">{title}</h3>
                <p className="text-[13px] text-[#6E6E73] leading-relaxed">{description}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" className="flex-1" onClick={onCancel}>
                {cancelLabel}
              </Button>
              <Button variant="destructive" className="flex-1" onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
