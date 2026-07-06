import React, { useState } from 'react';
import { KOTLIN_CODEBASE } from '../data/kotlinCodebase';
import { KotlinSourceFile } from '../types';
import { FileCode, Copy, Check, Download, Layers, Shield, Smartphone, Server, Terminal, Search } from 'lucide-react';

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<KotlinSourceFile>(KOTLIN_CODEBASE[0]);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const element = document.createElement('a');
    const file = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = selectedFile.filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredFiles = KOTLIN_CODEBASE.filter(f => {
    const matchesSearch = f.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.description.includes(searchQuery);
    const matchesCat = activeCategory === 'all' || f.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'compose_ui': return <Smartphone className="w-4 h-4 text-indigo-400" />;
      case 'viewmodel': return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'vpn_service': return <Shield className="w-4 h-4 text-amber-400" />;
      case 'repository': return <Server className="w-4 h-4 text-purple-400" />;
      case 'worker_js': return <Terminal className="w-4 h-4 text-teal-400" />;
      default: return <FileCode className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-right" dir="rtl">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.2)]">
              <FileCode className="w-5 h-5" />
            </div>
            <span>سورس کدهای کامل پروژه اندروید (Kotlin & Jetpack Compose)</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1.5 font-sans">
            تمامی فایل‌های مورد نیاز برای کلاینت Xray و دیپلوی خودکار ورکر با اصول Clean Architecture و استاندارد Material 3 آماده شده‌اند.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === 'all' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] font-bold' : 'bg-[#161B22] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            همه فایل‌ها ({KOTLIN_CODEBASE.length})
          </button>
          <button
            onClick={() => setActiveCategory('compose_ui')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === 'compose_ui' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] font-bold' : 'bg-[#161B22] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            رابط کاربری Compose
          </button>
          <button
            onClick={() => setActiveCategory('viewmodel')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === 'viewmodel' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] font-bold' : 'bg-[#161B22] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ViewModel & State
          </button>
          <button
            onClick={() => setActiveCategory('vpn_service')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === 'vpn_service' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] font-bold' : 'bg-[#161B22] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            هسته Xray & VpnService
          </button>
          <button
            onClick={() => setActiveCategory('repository')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === 'repository' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] font-bold' : 'bg-[#161B22] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Repository & Cloudflare
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File List Sidebar */}
        <div className="lg:col-span-1 bg-[#0D1117] border border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-xl">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
            <input
              type="text"
              placeholder="جستجو در نام فایل یا توضیحات..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#161B22] border border-slate-800 rounded-xl pr-10 pl-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
            {filteredFiles.map((file) => (
              <button
                key={file.filename}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-right p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                  selectedFile.filename === file.filename
                    ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-md'
                    : 'bg-[#161B22]/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-[#161B22]'
                }`}
              >
                <div className="mt-0.5 shrink-0">{getCategoryIcon(file.category)}</div>
                <div className="overflow-hidden">
                  <div className="font-mono font-bold text-xs truncate text-slate-200">{file.filename}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5 font-sans">{file.title}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Code View Main Area */}
        <div className="lg:col-span-3 bg-[#0D1117] border border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
          {/* Code Header */}
          <div className="bg-[#161B22] px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                {getCategoryIcon(selectedFile.category)}
                <h3 className="font-mono font-bold text-base text-white">{selectedFile.filename}</h3>
                <span className="text-xs bg-[#0A0C10] border border-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-mono">
                  {selectedFile.path}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 font-sans">{selectedFile.description}</p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-[#0A0C10] hover:bg-slate-800 text-slate-200 border border-slate-800'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-indigo-400" />
                    <span>کپی کد</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadFile}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0A0C10] hover:bg-slate-800 text-slate-200 border border-slate-800 transition-all"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>دانلود فایل</span>
              </button>
            </div>
          </div>

          {/* Code Body */}
          <div className="p-4 sm:p-6 bg-[#0A0C10] overflow-x-auto flex-1 font-mono text-xs sm:text-sm text-slate-200 leading-relaxed text-left shadow-inner" dir="ltr">
            <pre className="select-all">
              <code>{selectedFile.code}</code>
            </pre>
          </div>

          {/* Footer Info */}
          <div className="bg-[#161B22] px-6 py-3.5 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 font-sans">
            <span className="font-mono">تعداد خطوط: {selectedFile.code.split('\n').length} خط</span>
            <span className="text-indigo-400 font-medium">کامپایل سازگار با Android Studio Koala / Kotlin 2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
