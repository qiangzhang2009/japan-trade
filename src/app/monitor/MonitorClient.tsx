'use client';

import { useEffect, useState } from 'react';
import SiteLayout from '@/components/layout/SiteLayout';

interface FinancialData {
  initialFund: string;
  currentBalance: string;
  cumulativeIncome: string;
  cumulativeExpense: string;
  balanceStatus: string;
  alertLevel: string;
  incomeRecords: Array<{
    date: string;
    source: string;
    type: string;
    amount: string;
    note: string;
  }>;
  expenseRecords: Array<{
    date: string;
    purpose: string;
    amount: string;
    remaining: string;
    note: string;
  }>;
  monthlySummary: Array<{
    month: string;
    income: string;
    expense: string;
    netIncome: string;
    balance: string;
  }>;
  alertLog: Array<{
    date: string;
    level: string;
    condition: string;
    response: string;
  }>;
}

interface OperationsData {
  currentPhase: string;
  phaseGoal: string;
  weeklyFocus: string;
  logs: Array<{
    date: string;
    dayLabel: string;
    actions: string[];
    discoveries: string[];
    metrics: {
      uv: string;
      opportunities: string;
      newUsers: string;
      paidUsers: string;
    };
    tomorrowPlan: string;
  }>;
  pendingIssues: string[];
  solvedIssues: Array<{
    date: string;
    problem: string;
    solution: string;
    result: string;
  }>;
  experiments: Array<{
    name: string;
    startDate: string;
    status: string;
    result: string;
    conclusion: string;
  }>;
}

interface MonitorData {
  financial: FinancialData | null;
  operations: OperationsData | null;
  lastUpdated: string;
  projectAge: string;
}

function AlertBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; color: string; dot: string }> = {
    '正常': { label: '正常', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
    '高风险': { label: '高风险', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
    '危险': { label: '危险', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-400' },
    '终止': { label: '终止', color: 'bg-stone-100 text-stone-600 border-stone-200', dot: 'bg-stone-400' },
  };
  const style = map[level] || map['正常'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${style.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${level === '正常' ? 'animate-pulse' : ''}`} />
      {style.label}
    </span>
  );
}

function MoneyFlow({ amount }: { amount: string }) {
  const val = parseFloat(amount || '0');
  const isPositive = val > 0;
  const isZero = val === 0;
  return (
    <span className={`font-black tabular-nums ${isZero ? 'text-stone-400' : isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
      {isZero ? '¥0' : isPositive ? `+¥${val.toFixed(2)}` : `-¥${Math.abs(val).toFixed(2)}`}
    </span>
  );
}

function SectionCard({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2.5">
        {icon && <span className="text-stone-400">{icon}</span>}
        <h2 className="font-bold text-stone-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function MonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  async function fetchData() {
    try {
      const res = await fetch('/api/monitor', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
      setLastFetch(new Date());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SiteLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-500 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              PROJECT RUFLO · 运营观察窗
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              ruflo 运营中心
            </h1>
            <p className="text-stone-500 mt-1 text-sm">
              项目已运行 <span className="font-bold text-blue-600">{data?.projectAge ?? '—'}</span>
              {lastFetch && (
                <span className="ml-3 text-stone-400">
                  · 数据更新于 {lastFetch.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-stone-400">加载中…</span>
            </div>
          </div>
        )}

        {error && !data && (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-stone-700 mb-2">无法加载监控数据</h3>
            <p className="text-sm text-stone-500 mb-4">{error}</p>
            <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-500 transition-colors">
              重试
            </button>
          </div>
        )}

        {/* Empty state — ruflo hasn't started yet */}
        {data && !loading && !data.operations && !data.financial && (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-6">
              <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-stone-900 mb-3">ruflo 尚未开始工作</h3>
            <p className="text-stone-500 max-w-md mx-auto leading-relaxed">
              ruflo 还没有创建运营日志或财务记录。请稍候，它正在读取 PROJECT_RUFLO_PRD.md 并制定行动计划。
            </p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              页面每 15 秒自动刷新
            </div>
          </div>
        )}

        {data && (data.operations || data.financial) && (
          <div className="space-y-6">

            {/* Financial overview cards */}
            {data.financial && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                    <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">启动资金</div>
                    <div className="text-2xl font-black text-stone-900">¥{data.financial.initialFund || '10'}</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                    <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">当前余额</div>
                    <div className="text-2xl font-black text-blue-600">
                      ¥{parseFloat(data.financial.currentBalance || '10').toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                    <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">累计收入</div>
                    <div className="text-2xl font-black text-emerald-600">+¥{parseFloat(data.financial.cumulativeIncome || '0').toFixed(2)}</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                    <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">累计支出</div>
                    <div className="text-2xl font-black text-red-500">-¥{parseFloat(data.financial.cumulativeExpense || '0').toFixed(2)}</div>
                  </div>
                </div>

                {/* Alert banner */}
                <div className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center gap-3 ${
                  data.financial.alertLevel === '正常'
                    ? 'bg-emerald-50 border-emerald-200'
                    : data.financial.alertLevel === '高风险'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      data.financial.alertLevel === '正常'
                        ? 'bg-emerald-100 text-emerald-600'
                        : data.financial.alertLevel === '高风险'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {data.financial.alertLevel === '正常' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm text-stone-900">财务状态</span>
                        <AlertBadge level={data.financial.alertLevel} />
                      </div>
                      <p className="text-sm text-stone-500">
                        {data.financial.alertLevel === '正常'
                          ? `余额充足，可支撑 ${Math.floor(parseFloat(data.financial.currentBalance || '0') / 5)} 个月运营`
                          : data.financial.alertLevel === '高风险'
                          ? '余额紧张，建议 ruflo 暂停非必要支出'
                          : '实验即将终止'}
                      </p>
                    </div>
                  </div>
                  <div className="sm:border-l sm:border-stone-200 sm:pl-4 flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-stone-400">盈亏</div>
                      <MoneyFlow amount={
                        String((parseFloat(data.financial.cumulativeIncome || '0') - parseFloat(data.financial.cumulativeExpense || '0')).toFixed(2))
                      } />
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-stone-400">状态</div>
                      <div className="text-sm font-bold text-stone-700">{data.financial.balanceStatus || '持平'}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Operations overview */}
            {data.operations && (
              <div className="space-y-6">

                {/* Phase indicator */}
                {data.operations.currentPhase && (
                  <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-0.5 bg-blue-500/30 border border-blue-400/30 text-blue-300 text-xs font-bold rounded-full">
                            当前阶段
                          </span>
                          <span className="text-white font-black text-lg">{data.operations.currentPhase}</span>
                        </div>
                        {data.operations.phaseGoal && (
                          <p className="text-blue-300 text-sm mb-2">
                            <span className="text-blue-400 font-semibold">目标：</span>{data.operations.phaseGoal}
                          </p>
                        )}
                        {data.operations.weeklyFocus && (
                          <p className="text-blue-300 text-sm">
                            <span className="text-blue-400 font-semibold">本周重点：</span>{data.operations.weeklyFocus}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col sm:items-end gap-1">
                        <div className="text-xs text-blue-400">实验进度</div>
                        <div className="flex items-center gap-2">
                          {data.operations.logs.length > 0 && (
                            <>
                              <div className="text-3xl font-black text-white">{data.operations.logs.length}</div>
                              <div className="text-xs text-blue-300">天记录</div>
                            </>
                          )}
                          {data.operations.experiments.length > 0 && (
                            <>
                              <div className="text-3xl font-black text-amber-400">{data.operations.experiments.length}</div>
                              <div className="text-xs text-amber-300">个实验</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Daily logs */}
                  <div className="lg:col-span-2 space-y-4">
                    {data.operations.logs.length > 0 ? (
                      data.operations.logs.map((log, idx) => (
                        <div key={log.date} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                          <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                                idx === 0 ? 'bg-blue-600 text-white' : 'bg-stone-200 text-stone-600'
                              }`}>
                                {data.operations!.logs.length - idx}
                              </span>
                              <span className="font-bold text-stone-900">{log.date}</span>
                              {idx === 0 && (
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full">最新</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-stone-400">
                              {log.metrics.uv && <span>UV: <strong className="text-stone-600">{log.metrics.uv}</strong></span>}
                              {log.metrics.paidUsers && <span>付费: <strong className="text-emerald-600">{log.metrics.paidUsers}</strong></span>}
                            </div>
                          </div>
                          <div className="p-5 space-y-4">
                            {log.actions.length > 0 && (
                              <div>
                                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">今日行动</h4>
                                <ul className="space-y-1.5">
                                  {log.actions.map((a, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                      {a}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {log.discoveries.length > 0 && (
                              <div>
                                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">关键发现</h4>
                                <ul className="space-y-1.5">
                                  {log.discoveries.map((d, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                      {d}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {log.tomorrowPlan && (
                              <div>
                                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">明日计划</h4>
                                <p className="text-sm text-stone-600 bg-stone-50 rounded-lg px-3 py-2">{log.tomorrowPlan}</p>
                              </div>
                            )}
                            {log.metrics.opportunities && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
                                {log.metrics.uv && (
                                  <div className="text-center p-2.5 bg-stone-50 rounded-xl">
                                    <div className="text-lg font-black text-stone-900">{log.metrics.uv}</div>
                                    <div className="text-xs text-stone-400">UV</div>
                                  </div>
                                )}
                                {log.metrics.opportunities && (
                                  <div className="text-center p-2.5 bg-stone-50 rounded-xl">
                                    <div className="text-lg font-black text-stone-900">{log.metrics.opportunities}</div>
                                    <div className="text-xs text-stone-400">商机总数</div>
                                  </div>
                                )}
                                {log.metrics.newUsers && (
                                  <div className="text-center p-2.5 bg-stone-50 rounded-xl">
                                    <div className="text-lg font-black text-stone-900">{log.metrics.newUsers}</div>
                                    <div className="text-xs text-stone-400">新注册</div>
                                  </div>
                                )}
                                {log.metrics.paidUsers && (
                                  <div className="text-center p-2.5 bg-emerald-50 rounded-xl">
                                    <div className="text-lg font-black text-emerald-600">{log.metrics.paidUsers}</div>
                                    <div className="text-xs text-emerald-500">付费用户</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <p className="text-stone-500 text-sm">暂无每日运营记录</p>
                        <p className="text-stone-400 text-xs mt-1">ruflo 尚未更新 OPERATIONS_LOG.md</p>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">

                    {/* Pending issues */}
                    <SectionCard
                      title="待解决问题"
                      icon={
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      }
                    >
                      {data.operations.pendingIssues.length > 0 ? (
                        <ul className="space-y-2">
                          {data.operations.pendingIssues.map((issue, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                              <span className="w-5 h-5 rounded bg-amber-100 text-amber-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">?</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-stone-400 text-center py-4">暂无待解决问题</p>
                      )}
                    </SectionCard>

                    {/* Solved issues */}
                    {data.operations.solvedIssues.length > 0 && (
                      <SectionCard
                        title="已解决问题"
                        icon={
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                      >
                        <ul className="space-y-3">
                          {data.operations.solvedIssues.map((item, i) => (
                            <li key={i} className="text-sm">
                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                                <div>
                                  <span className="font-semibold text-stone-700">{item.problem}</span>
                                  <p className="text-stone-400 text-xs mt-0.5">{item.solution}</p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </SectionCard>
                    )}

                    {/* Experiments */}
                    {data.operations.experiments.length > 0 && (
                      <SectionCard
                        title="增长实验"
                        icon={
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        }
                      >
                        <ul className="space-y-3">
                          {data.operations.experiments.map((exp, i) => (
                            <li key={i} className="text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-stone-700">{exp.name}</span>
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                                  exp.status === '成功' ? 'bg-emerald-100 text-emerald-700' :
                                  exp.status === '失败' ? 'bg-red-100 text-red-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>{exp.status}</span>
                              </div>
                              <p className="text-stone-400 text-xs">{exp.startDate}</p>
                              {exp.result && <p className="text-stone-500 text-xs mt-1">{exp.result}</p>}
                              {exp.conclusion && <p className="text-amber-600 text-xs mt-1 italic">{exp.conclusion}</p>}
                            </li>
                          ))}
                        </ul>
                      </SectionCard>
                    )}

                    {/* Financial transaction history */}
                    {data.financial && (data.financial.incomeRecords.length > 0 || data.financial.expenseRecords.length > 0) && (
                      <SectionCard
                        title="财务流水"
                        icon={
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                      >
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {[...data.financial.incomeRecords, ...data.financial.expenseRecords]
                            .sort((a, b) => b.date.localeCompare(a.date))
                            .slice(0, 10)
                            .map((record: any, i: number) => {
                              const isIncome = 'source' in record;
                              return (
                                <div key={i} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                                      isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                      {isIncome ? '+' : '-'}
                                    </span>
                                    <div>
                                      <div className="font-medium text-stone-700">{isIncome ? record.source : record.purpose}</div>
                                      <div className="text-xs text-stone-400">{record.date}</div>
                                    </div>
                                  </div>
                                  <span className={`font-bold ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {isIncome ? `+¥${record.amount}` : `-¥${record.amount}`}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </SectionCard>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer hint */}
        <div className="mt-10 text-center">
          <p className="text-xs text-stone-400">
            数据来源：FINANCIAL_LOG.md + OPERATIONS_LOG.md · 每 15 秒自动刷新
            {data?.lastUpdated && (
              <span> · 最后解析时间：{new Date(data.lastUpdated).toLocaleTimeString('zh-CN')}</span>
            )}
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
