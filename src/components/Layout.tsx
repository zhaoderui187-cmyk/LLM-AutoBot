import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation, MobileMenuButton } from '@/components/Navigation';

export function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#161618] text-[#F5F5F7]">
      <Navigation mobileOpen={mobileNavOpen} onMobileToggle={() => setMobileNavOpen(false)} />
      {!mobileNavOpen && <MobileMenuButton onClick={() => setMobileNavOpen(true)} />}
      <main className="flex-1 md:ml-[250px] p-5 pt-16 md:p-8 md:pt-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
