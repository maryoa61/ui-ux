import React, { useState } from 'react';
import { ActiveTab, VpnStatus, VpnConfig, CloudflareConfig, NetworkStats } from './types';
import { Navbar } from './components/Navbar';
import { AndroidSimulator } from './components/AndroidSimulator';
import { CodeExplorer } from './components/CodeExplorer';
import { GeminiAssistant } from './components/GeminiAssistant';
import { ProjectExporter } from './components/ProjectExporter';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');
  const [vpnStatus, setVpnStatus] = useState<VpnStatus>('DISCONNECTED');
  
  const [vpnConfig, setVpnConfig] = useState<VpnConfig>({
    host: 'fast-vpn.cloudflare-edge.workers.dev',
    path: '/vless',
    uuid: 'd342d11e-d424-4583-b36e-524ab1f0afa4',
    port: 443,
    tls: true,
    cleanIp: '104.16.123.96',
  });

  const [cfConfig, setCfConfig] = useState<CloudflareConfig>({
    accountId: '',
    apiToken: '',
    workerName: 'cf-vpn-worker',
    simulationMode: true,
  });

  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    downloadSpeedKbps: 0,
    uploadSpeedKbps: 0,
    pingMs: 0,
    totalDownloadedMb: 14.8,
    totalUploadedMb: 2.3,
  });

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E2E8F0] flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        vpnStatus={vpnStatus}
      />

      <main className="flex-1">
        {activeTab === 'simulator' && (
          <AndroidSimulator
            vpnStatus={vpnStatus}
            setVpnStatus={setVpnStatus}
            vpnConfig={vpnConfig}
            setVpnConfig={setVpnConfig}
            cfConfig={cfConfig}
            setCfConfig={setCfConfig}
            networkStats={networkStats}
            setNetworkStats={setNetworkStats}
          />
        )}

        {activeTab === 'codebase' && <CodeExplorer />}

        {activeTab === 'assistant' && <GeminiAssistant />}

        {activeTab === 'exporter' && <ProjectExporter />}
      </main>

      <footer className="bg-[#0D1117] border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> توسعه یافته بر پایه Jetpack Compose Material 3 & Clean Architecture</span>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> سرویس VpnService اندروید ۱۴</span>
            <span className="flex items-center gap-1.5 text-indigo-400 font-mono"><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div> Cloudflare Workers API v4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
