import React from 'react';
import { ActiveTab } from '../types';
import { Smartphone, Code2, Bot, Download, Sparkles } from 'lucide-react';
import { CFVpnLogo } from './CFVpnLogo';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  vpnStatus: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, vpnStatus }) => {
  return (
    <header className="bg-[#0D1117] border-b border-slate-800 sticky top-0 z-50 text-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-transform hover:scale-105">
            <CFVpnLogo size={42} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">
                Cloudflare Workers VPN Studio
              </h1>
              <span className="text-indigo-400 font-normal text-xs px-2 py-0.5 border border-indigo-400/30 rounded-full">v2.0.4</span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block uppercase tracking-wider font-semibold mt-0.5">
              شبیه‌ساز و استودیو دیپلوی اتوماتیک Jetpack Compose
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2 bg-[#161B22] p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>شبیه‌ساز موبایل</span>
            {vpnStatus === 'CONNECTED' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('codebase')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'codebase'
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>سورس کدهای کاتلین</span>
          </button>

          <button
            onClick={() => setActiveTab('assistant')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'assistant'
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Bot className="w-4 h-4 text-indigo-300" />
            <span className="flex items-center gap-1">
              دستیار جمینای
              <Sparkles className="w-3 h-3 text-indigo-300 animate-pulse" />
            </span>
          </button>

          <button
            onClick={() => setActiveTab('exporter')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'exporter'
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">دانلود پروژه اندروید استودیو</span>
            <span className="md:hidden">ZIP</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
