'use client';

import React, { useState } from 'react';
import { Language } from '@/lib/localization';

interface HimooraIntelligenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  initialPrompt?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: string;
}

let msgCounter = 100;
function getNextMsgId(prefix: string) {
  msgCounter += 1;
  return `${prefix}-${msgCounter}`;
}

export default function HimooraIntelligenceDrawer({
  isOpen,
  onClose,
  language,
  initialPrompt,
}: HimooraIntelligenceDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text:
        language === 'fa'
          ? 'سلام، من دستیار هوش مالی هیمورا هستم. کلیه داده‌های مالی و دفاتر کل شرکت شما تحلیل شده است. چه سوال یا تحلیلی مد نظر شماست؟'
          : 'Hello! I am Himoora Intelligence Copilot. Your general ledger, liquidity horizon, and receivables exposure are indexed and verified. How can I assist you with financial analysis today?',
      timestamp: 'Active Now',
      source: 'Himoora Financial AI',
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);

  // Suggested Prompts
  const suggestionsEn = [
    'What were my highest expenses this month?',
    'Which customers owe the most?',
    'Analyze Q3 Tax Variance',
    'Liquidity Stress Test (IRR FX -15%)',
  ];

  const suggestionsFa = [
    'بیشترین هزینه این ماه مربوط به چه چیزی بوده؟',
    'کدام مشتریان بیشترین معوقه را دارند؟',
    'تحلیل انحراف مالیات عملکرد فصل سوم',
    'تست تاب‌آوری نقدینگی با افت ۱۵ درصدی ریال',
  ];

  const suggestions = language === 'fa' ? suggestionsFa : suggestionsEn;

  const handleSend = async (questionToSend?: string) => {
    const q = questionToSend || inputQuestion;
    if (!q.trim() || isLoading) return;

    const userMsg: Message = {
      id: getNextMsgId('usr'),
      sender: 'user',
      text: q,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const res = await fetch('/app/api/ai-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, language }),
      });

      const data = await res.json();
      const assistantMsg: Message = {
        id: getNextMsgId('ai'),
        sender: 'assistant',
        text: data.answer || 'Analysis complete.',
        timestamp: 'Just now',
        source: data.source,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: getNextMsgId('ai-err'),
          sender: 'assistant',
          text:
            language === 'fa'
              ? 'متاسفانه در برقراری ارتباط خطایی رخ داد، لطفا مجددا تلاش کنید.'
              : 'Error querying intelligence core. Please retry shortly.',
          timestamp: 'Error',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <span className="material-symbols-outlined text-[20px]">neurology</span>
            </div>
            <div>
              <h2 className="font-bold text-[14px]">
                {language === 'fa' ? 'دستیار هوش مالی هیمورا' : 'Himoora Intelligence Copilot'}
              </h2>
              <span className="text-[11px] text-blue-200 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Audited Ledger Grounding Active</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((m) => {
            const isAi = m.sender === 'assistant';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[90%] p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-2xs ${
                    isAi
                      ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                      : 'bg-[#0051d5] text-white rounded-tr-xs'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.text}</div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {m.timestamp} {m.source && `• ${m.source}`}
                </span>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-[12px] p-2">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
              <span>Analyzing ledger & forecasting...</span>
            </div>
          )}
        </div>

        {/* Quick Query Pills */}
        <div className="p-3 bg-white border-t border-slate-200/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1.5">
            Quick Queries:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(s)}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors truncate max-w-[200px]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            placeholder={
              language === 'fa'
                ? 'سوال مالی خود را بپرسید (مثلا بیشترین هزینه این ماه)...'
                : 'Ask financial question (e.g. highest expenses this month)...'
            }
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 p-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isLoading || !inputQuestion.trim()}
            className="p-2 bg-[#0051d5] hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
