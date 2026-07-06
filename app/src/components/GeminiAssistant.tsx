import React, { useState } from 'react';
import { Bot, Send, Sparkles, User, RefreshCw, Cpu, Shield, Globe } from 'lucide-react';

export const GeminiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: 'درود! من دستیار هوش مصنوعی متخصص در توسعه اندروید (Jetpack Compose) و معماری شبکه‌های Cloudflare Workers (Xray-core / VLESS) هستم. چه کمکی در ساخت کلاینت یا بهینه‌سازی لتنسی از من ساخته است؟',
      time: 'الآن',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    'چگونه لتنسی (Ping) ورکر VLESS در کلودفلر را برای اینترنت ایران بهینه‌تر کنیم؟',
    'تفاوت استفاده از ProcessBuilder با JNI برای اجرای باینری Xray در اندروید چیست؟',
    'چطور آی‌پی‌های تمیز (Clean IPs) کلودفلر را به صورت خودکار در کلاینت تست و جایگزین کنیم؟',
    'نحوه مدیریت پس‌زمینه (Foreground Service) و جلوگیری از بسته شدن VPN توسط باتری اندروید ۱۴ چگونه است؟',
  ];

  const handleSendPrompt = async (promptText?: string) => {
    const query = promptText || inputPrompt;
    if (!query.trim()) return;

    const userMsg = { sender: 'user' as const, text: query, time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    if (!promptText) setInputPrompt('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: data.reply,
            time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: `❌ خطا: ${data.error || 'پاسخی دریافت نشد. لطفاً کلید GEMINI_API_KEY را بررسی کنید.'}`,
            time: 'الآن',
          },
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: `❌ خطا در شبکه: ${err.message}`, time: 'الآن' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-right" dir="rtl">
      <div className="bg-[#0D1117] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[750px]">
        {/* Header */}
        <div className="bg-[#161B22] px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>هوش مصنوعی مشاور توسعه Xray & Workers</span>
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-400 font-sans">قدرت گرفته از مدل Gemini 3.5 Flash (پاسخ‌دهی سرور ساید)</p>
            </div>
          </div>
          <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full uppercase font-bold">
            AI Architect Active
          </span>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]'
                    : 'bg-[#161B22] border border-slate-800 text-indigo-400'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600/20 border border-indigo-500/30 text-white rounded-tl-none shadow-inner'
                    : 'bg-[#161B22] border border-slate-800 text-slate-200 rounded-tr-none shadow-md whitespace-pre-wrap font-sans'
                }`}
              >
                <div>{msg.text}</div>
                <div
                  className={`text-[10px] mt-2 font-mono ${
                    msg.sender === 'user' ? 'text-indigo-300 text-left' : 'text-slate-500 text-left'
                  }`}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div className="bg-[#161B22] border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-300 flex items-center gap-2 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>جمینای در حال بررسی معماری شبکه و تولید پاسخ فنی...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="px-6 py-3.5 bg-[#161B22]/60 border-t border-slate-800">
          <p className="text-xs text-slate-400 mb-2.5 flex items-center gap-1.5 font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>سوالات پیشنهادی برای بهینه‌سازی اپلیکیشن:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendPrompt(p)}
                disabled={loading}
                className="text-xs bg-[#0A0C10] hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 text-slate-300 px-3.5 py-2 rounded-xl transition-all text-right disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#161B22] border-t border-slate-800 flex gap-2.5">
          <input
            type="text"
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && handleSendPrompt()}
            placeholder="سوال یا چالش برنامه‌نویسی اندروید / Cloudflare خود را بپرسید..."
            disabled={loading}
            className="flex-1 bg-[#0A0C10] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50 shadow-inner"
          />
          <button
            onClick={() => handleSendPrompt()}
            disabled={loading || !inputPrompt.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex items-center gap-2"
          >
            <span>ارسال</span>
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
