import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

export function Settings() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-[22px] font-semibold text-[#F5F5F7] tracking-tight">{t.settings.title}</h1>
        <p className="text-[13px] text-[#6E6E73] mt-1">{t.settings.system}</p>
      </div>

      <div className="bg-[#1C1C1E] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[rgba(10,132,255,0.1)] flex items-center justify-center">
              <Globe className="h-5 w-5 text-[#0A84FF]" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-[#F5F5F7]">{t.settings.language}</p>
              <p className="text-[12px] text-[#6E6E73] mt-0.5">{t.settings.languageDesc}</p>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'zh' | 'en')}
            className="bg-[#2C2C2E] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-[13px] text-[#F5F5F7] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[rgba(10,132,255,0.25)] appearance-none min-w-[140px]"
          >
            <option value="zh">{t.settings.zh}</option>
            <option value="en">{t.settings.en}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
