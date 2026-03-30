'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

const QUICK_REPLIES = [
  '最新商机有哪些？',
  '亚洲市场商机查询',
  '如何升级专业版？',
  '有哪些数据来源？',
];

const SUGGESTED_RESPONSES: Record<string, { zh: string; ja: string }> = {
  '最新商机有哪些？': {
    zh: '我们目前收录了多条精选商机，涵盖精密制造、电子元器件、新能源、医疗器械、家具制造等行业。其中最受关注的包括东京医疗器械代理商寻求中国高端设备合作（预算500万美元）、胡志明市家具贸易商急寻中国实木家具供应商（预算80万美元）。',
    ja: '現在、多件の厳選ビジネス情報を收录しています。精密機器、電子部品、新エネルギー、医療機器、家具製造などの業界を含みます。最も注目されるのは、東京の医療機器代理店が中国側的高端機器への協力を求めている件（予算500万USD）、ホーチミン市の家具貿易会社が中国の实木家具供給元を急募している件（予算80万USD）です。',
  },
  '亚洲市场商机查询': {
    zh: '我们覆盖东南亚+东亚13个核心市场。主要高价值市场包括日本（精密制造、医疗器械）、韩国（半导体、电子）、新加坡（金融、贸易）。增长市场包括越南（制造业、家具）、马来西亚（电子）、泰国（汽车零部件）。新兴前沿包括印尼、菲律宾、印度等。',
    ja: '当プラットフォームは東南アジア+東アジア13のコア市場を覆盖しています。主な高価値市場は日本（精密機器、医療機器）、韓国（半導体、電子）、シンガポール（金融、貿易）です。成長市場にはベトナム（製造業、家具）、マレーシア（電子）、タイ（自動車部品）が含まれます。',
  },
  '如何升级专业版？': {
    zh: '升级专业版非常简单！点击「会员服务」页面，选择专业版（¥299/月），完成支付后权益即时生效。支持支付宝、微信和信用卡付款。如需企业发票，请联系 customer@zxqconsulting.com。',
    ja: 'プロフェッショナル版へのアップグレードは非常に簡単です！「メンバーサービス」ページでプロフェッショナル版（¥299/月）を選択し、お支払い完了後すぐにご權益が付与されます。支付宝、微信、クレジットカートがお使いいただけます。企業請求書が必要な場合は customer@zxqconsulting.com までご連絡ください。',
  },
  '有哪些数据来源？': {
    zh: '我们的数据来源包括：日本贸易振兴机构（JETRO）、韩国贸易协会（KITA）、越南政府经贸门户、各国半官方贸易促进机构和权威媒体RSS。数据每6小时自动更新，确保商机信息始终是最新的。',
    ja: '当プラットフォームのデータソースは：日本貿易振興機構（JETRO）、韓国貿易協会（KITA）、ベトナム政府经贸ポータル、各国の半官營貿易促進機関および権威あるメディアRSSを含みます。データは6時間ごとに自動更新され、ビジネス情報が常に最新であることを保証します。',
  },
};

const INTRO_MESSAGE: ChatMessage = {
  id: 'intro',
  role: 'assistant',
  content: '您好！我是出海通 AsiaBridge AI 助手 🤖\n\n我可以帮您：\n• 查询最新商机和贸易动态\n• 了解亚洲各国贸易数据趋势\n• 解答会员服务相关问题\n• 推荐适合您的合作机会\n\n请随时向我提问！',
  timestamp: new Date().toISOString(),
};

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-bold">出</span>
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm border border-stone-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const response = SUGGESTED_RESPONSES[text] ?? {
        zh: `感谢您的提问！关于"${text}"，我已记录您的问题。\n\n您的问题已转交人工客服，我们将在24小时内通过邮件回复您。\n\n如需即时帮助，您也可以发送邮件至 customer@zxqconsulting.com`,
        ja: `ご質問ありがとうございます！「${text}」について承りました。\n\nご質問は人工客服に転送され、24時間以内にメールで回答いたします。\n\n即時ヘルプが必要な場合は customer@zxqconsulting.com までメールをお送りください。`,
      };

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.zh,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    }, 1200);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl shadow-blue-200 flex items-center justify-center transition-all z-50 hover:scale-110 active:scale-95',
          isOpen && 'rotate-45'
        )}
        aria-label="打开AI助手"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          )}
        </svg>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[560px] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-sm">出</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">出海通 AI 助手</h3>
                <p className="text-blue-200 text-xs">24小时在线 · 平均响应&lt;1分钟</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-stone-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex items-start gap-2.5',
                  msg.role === 'user' && 'flex-row-reverse'
                )}
              >
                {msg.role === 'assistant' ? (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">出</span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line',
                    msg.role === 'assistant'
                      ? 'bg-white border border-stone-200 rounded-tl-sm shadow-sm text-stone-700'
                      : 'bg-blue-600 text-white rounded-tr-sm shadow-sm'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="px-4 py-2.5 border-t border-stone-100 bg-white flex-shrink-0">
            <p className="text-xs text-stone-400 mb-2">快捷问题</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="px-2.5 py-1 text-xs bg-stone-100 hover:bg-blue-50 hover:text-blue-600 text-stone-600 rounded-full border border-stone-200 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-stone-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                placeholder="输入您的问题..."
                className="flex-1 px-4 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
