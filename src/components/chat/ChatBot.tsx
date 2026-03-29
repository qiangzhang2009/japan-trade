'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

const QUICK_REPLIES = [
  '最新商机有哪些？',
  '中日贸易数据查询',
  '如何升级专业版？',
  '有哪些数据来源？',
];

const SUGGESTED_RESPONSES: Record<string, { zh: string; ja: string }> = {
  '最新商机有哪些？': {
    zh: '我们目前收录了6条精选商机，涵盖精密制造、化妆品原料、新能源、医疗器械等行业。其中最受关注的包括中国精密机械零部件企业对日出口合作（预算5000万人民币）和日本高端化妆品原料寻求中国独家代理商。',
    ja: '現在、6件の厳選ビジネス情報を收录しています。精密機器部品の中国側から日本向け輸出協力（予算5000万元）と日本高級化粧品原料の中国独占代理店募集が最も注目されています。',
  },
  '中日贸易数据查询': {
    zh: '您可以访问「贸易数据」页面查看最新海关进出口统计。目前热门的贸易品类包括：集成电路（HS 8542，趋势↑12.1%）、锂离子蓄电池（HS 8507，趋势↑23.5%）和自动数据处理设备（HS 8471）。专业版用户可访问完整API。',
    ja: '「貿易データ」ページで最新の税関貿易統計を確認できます。現在熱い貿易品種は：集積回路（HS 8542、傾向↑12.1%）、リチウムイオン蓄電池（HS 8507、傾向↑23.5%）、自動データ処理装置（HS 8471）です。プロフェッショナル版ユーザーは完全なAPIにアクセスできます。',
  },
  '如何升级专业版？': {
    zh: '升级专业版非常简单！点击「会员服务」页面，选择专业版（¥299/月），完成支付后权益即时生效。支持支付宝、微信和信用卡付款。如需企业发票，请联系 contact@china-japan-trade.com。',
    ja: 'プロフェッショナル版へのアップグレードは非常に簡単です！「メンバーサービス」ページでプロフェッショナル版（¥299/月）を選択し、お支払い完了後すぐにご權益が付与されます。支付宝、微信、クレジットカートがお使えます。',
  },
  '有哪些数据来源？': {
    zh: '我们的数据来源包括：日本贸易振兴机构（JETRO）、中国商务部、日本经济产业省、中国海关总署、日经新闻、朝日新闻等权威机构。数据每日自动更新。',
    ja: '当プラットフォームのデータソースは：日本貿易振興機構（JETRO）、中国商務部、日本経済産業省、中国税関総署、日経新聞、朝日新聞などの権威ある機関を含みます。データは毎日自動更新されています。',
  },
};

const INTRO_MESSAGE: ChatMessage = {
  id: 'intro',
  role: 'assistant',
  content: '您好！我是中日经贸通AI助手 🤖\n\n我可以帮您：\n• 查询最新商机和贸易动态\n• 了解中日贸易数据趋势\n• 解答会员服务相关问题\n• 推荐适合您的合作机会\n\n请随时向我提问！',
  timestamp: new Date().toISOString(),
};

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-bold">中</span>
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
        zh: `感谢您的提问！关于"${text}"，我已记录您的问题。\n\n您的问题已转交人工客服，我们将在24小时内通过邮件回复您。\n\n如需即时帮助，您也可以发送邮件至 contact@china-japan-trade.com`,
        ja: `ご質問ありがとうございます！「${text}」について承りました。\n\nご質問は人工客服に転送され、24時間以内にメールで回答いたします。\n\n即時ヘルプが必要な場合は contact@china-japan-trade.com までメールをお送りください。`,
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
                <span className="text-white font-bold text-sm">中</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">中日经贸通 AI 助手</h3>
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
                    <span className="text-white text-xs font-bold">中</span>
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
