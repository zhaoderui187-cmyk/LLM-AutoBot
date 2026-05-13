import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LayoutDashboard, Users, Server, Activity, Settings as SettingsIcon, Workflow, Bot, Menu, X } from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

export function Navigation({ mobileOpen, onMobileToggle }: { mobileOpen?: boolean; onMobileToggle?: () => void }) {
  const { t } = useLanguage();

  const navItems: NavItem[] = [
    { to: '/', icon: <LayoutDashboard className="h-[18px] w-[18px]" />, label: t.navbar.dashboard },
    { to: '/accounts', icon: <Users className="h-[18px] w-[18px]" />, label: t.navbar.accounts },
    { to: '/proxies', icon: <Server className="h-[18px] w-[18px]" />, label: t.navbar.proxies },
    { to: '/tasks', icon: <Activity className="h-[18px] w-[18px]" />, label: t.navbar.tasks },
    { to: '/api', icon: <Workflow className="h-[18px] w-[18px]" />, label: t.navbar.apiGateway },
    { to: '/bot', icon: <Bot className="h-[18px] w-[18px]" />, label: t.navbar.autoBot },
    { to: '/settings', icon: <SettingsIcon className="h-[18px] w-[18px]" />, label: t.navbar.settings },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-200 ${
      isActive
        ? 'bg-[#0A84FF] text-white shadow-[0_1px_3px_rgba(10,132,255,0.3)]'
        : 'text-[#A1A1A6] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#F5F5F7]'
    }`;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#0A84FF] to-[#5E5CE6] rounded-xl flex items-center justify-center font-bold text-white text-[13px] shadow-[0_2px_8px_rgba(10,132,255,0.25)]">A</div>
          <div>
            <h1 className="text-[15px] font-semibold text-[#F5F5F7] tracking-tight">AccVault</h1>
          </div>
        </div>
        {onMobileToggle && (
          <button onClick={onMobileToggle} className="md:hidden absolute top-5 right-4 text-[#6E6E73] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="text-[11px] font-semibold text-[#48484A] uppercase tracking-wider px-3 pb-1.5 pt-1">{t.navbar.title}</p>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={navLinkClass}
            onClick={onMobileToggle}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Version */}
      <div className="p-4 text-center">
        <p className="text-[11px] text-[#48484A]">AccVault v1.2</p>
      </div>
    </>
  );

  return (
    <>
      <div className="hidden md:flex w-[250px] bg-[rgba(28,28,30,0.72)] backdrop-blur-2xl border-r border-[rgba(255,255,255,0.06)] h-screen fixed top-0 left-0 flex-col text-[#F5F5F7]">
        {sidebarContent}
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onMobileToggle} />
          <div className="relative w-[250px] h-full bg-[#1C1C1E] border-r border-[rgba(255,255,255,0.06)] flex flex-col text-[#F5F5F7] shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] rounded-xl flex items-center justify-center text-[#A1A1A6] hover:text-white hover:bg-[#2C2C2E] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
