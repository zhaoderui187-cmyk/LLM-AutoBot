import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Mail, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Login() {
  const { user, signInWithGoogle, signInWithGithub, signInWithEmail, registerWithEmail, loading, authError, clearError } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#161618] text-[#F5F5F7]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    clearError();
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#161618] text-[#F5F5F7] p-4">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0A84FF]/5 via-transparent to-[#BF5AF2]/5 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="relative w-full max-w-[380px]"
      >
        <div className="bg-[#1C1C1E] border border-[rgba(255,255,255,0.06)] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Header */}
          <div className="text-center pt-10 pb-6 px-8">
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-[#0A84FF] to-[#5E5CE6] rounded-2xl flex items-center justify-center mb-5 shadow-[0_4px_12px_rgba(10,132,255,0.3)]">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-[22px] font-semibold text-[#F5F5F7] tracking-tight">{t.login.title}</h1>
            <p className="text-[13px] text-[#6E6E73] mt-1.5">{t.login.desc}</p>
          </div>

          {/* Tab switcher */}
          <div className="mx-8 mb-5 flex bg-[#2C2C2E] rounded-lg p-0.5">
            <button
              onClick={() => { setMode('login'); clearError(); }}
              className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-[#3A3A3C] text-[#F5F5F7] shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
                  : 'text-[#6E6E73] hover:text-[#A1A1A6]'
              }`}
            >
              {t.login.signInTab}
            </button>
            <button
              onClick={() => { setMode('register'); clearError(); }}
              className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-[#3A3A3C] text-[#F5F5F7] shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
                  : 'text-[#6E6E73] hover:text-[#A1A1A6]'
              }`}
            >
              {t.login.registerTab}
            </button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mx-8 mb-4"
              >
                <div className="bg-[rgba(255,69,58,0.1)] border border-[rgba(255,69,58,0.2)] rounded-lg px-3 py-2.5 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-[#FF453A] shrink-0 mt-0.5" />
                  <p className="text-[12px] text-[#FF453A] leading-relaxed">{authError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="px-8 space-y-3">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#A1A1A6]">{t.login.email}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#A1A1A6]">{t.login.password}</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full mt-1" disabled={submitting}>
              <Mail className="h-4 w-4 mr-2" />
              {mode === 'login' ? t.login.signInEmail : t.login.registerEmail}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 px-8 my-5">
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
            <span className="text-[11px] text-[#48484A] font-medium uppercase tracking-wider">{t.login.orContinue}</span>
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
          </div>

          {/* Social buttons */}
          <div className="px-8 pb-8 space-y-2.5">
            <Button variant="secondary" className="w-full" onClick={signInWithGoogle}>
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t.login.signInGoogle}
            </Button>
            <Button variant="secondary" className="w-full" onClick={signInWithGithub}>
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              {t.login.signInGithub}
            </Button>

            <button onClick={switchMode} className="w-full text-center text-[12px] text-[#0A84FF] hover:text-[#409CFF] transition-colors pt-2">
              {mode === 'login' ? t.login.noAccount : t.login.hasAccount}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#48484A] mt-5">{t.login.restricted}</p>
      </motion.div>
    </div>
  );
}
