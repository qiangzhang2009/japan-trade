import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const revalidate = 30;

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

function parseFinancialLog(content: string): FinancialData {
  const lines = content.split('\n');
  const data: Partial<FinancialData> = {
    incomeRecords: [],
    expenseRecords: [],
    monthlySummary: [],
    alertLog: [],
  };

  let section = '';
  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('**初始资金**') || trimmed.startsWith('初始资金')) {
      const match = trimmed.match(/[¥$]?\s*([\d.]+)/);
      if (match) data.initialFund = match[1];
    }
    if (trimmed.startsWith('**当前余额**') || trimmed.startsWith('当前余额')) {
      const match = trimmed.match(/[¥$]?\s*([\d.]+)/);
      if (match) data.currentBalance = match[1];
    }
    if (trimmed.startsWith('累计收入') || trimmed.startsWith('**累计收入**')) {
      const match = trimmed.match(/[¥$]?\s*([\d.]+)/);
      if (match) data.cumulativeIncome = match[1];
    }
    if (trimmed.startsWith('累计支出') || trimmed.startsWith('**累计支出**')) {
      const match = trimmed.match(/[¥$]?\s*([\d.]+)/);
      if (match) data.cumulativeExpense = match[1];
    }
    if (trimmed.startsWith('盈亏状态')) data.balanceStatus = trimmed.split(':')[1]?.trim() || '';
    if (trimmed.startsWith('告警等级')) data.alertLevel = trimmed.split(':')[1]?.trim() || '';

    if (trimmed.startsWith('## 收入记录') || trimmed.startsWith('## 支出记录') || trimmed.startsWith('## 月度摘要')) {
      section = trimmed;
      continue;
    }

    if (trimmed.startsWith('|') && !trimmed.includes('---') && trimmed !== '|') {
      const cells = trimmed.split('|').filter(c => c.trim() && !c.trim().match(/^[-|:]+$/));
      if (cells.length >= 2) {
        if (section.includes('收入记录')) {
          data.incomeRecords!.push({
            date: cells[0]?.trim() || '',
            source: cells[1]?.trim() || '',
            type: cells[2]?.trim() || '',
            amount: cells[3]?.trim() || '',
            note: cells[4]?.trim() || '',
          });
        } else if (section.includes('支出记录')) {
          data.expenseRecords!.push({
            date: cells[0]?.trim() || '',
            purpose: cells[1]?.trim() || '',
            amount: cells[2]?.trim() || '',
            remaining: cells[3]?.trim() || '',
            note: cells[4]?.trim() || '',
          });
        } else if (section.includes('月度摘要')) {
          data.monthlySummary!.push({
            month: cells[0]?.trim() || '',
            income: cells[1]?.trim() || '',
            expense: cells[2]?.trim() || '',
            netIncome: cells[3]?.trim() || '',
            balance: cells[4]?.trim() || '',
          });
        }
      }
    }
  }

  return data as FinancialData;
}

function parseOperationsLog(content: string): OperationsData {
  const data: OperationsData = {
    currentPhase: '',
    phaseGoal: '',
    weeklyFocus: '',
    logs: [],
    pendingIssues: [],
    solvedIssues: [],
    experiments: [],
  };

  const sections = content.split(/^## /m);
  for (const section of sections) {
    const lines = section.split('\n');
    const heading = lines[0]?.trim() || '';

    if (heading.startsWith('当前运营阶段')) {
      const match = section.match(/\*\*阶段\*\*[：:]\s*(.+)/);
      if (match) data.currentPhase = match[1];
      const goalMatch = section.match(/\*\*目标\*\*[：:]\s*(.+)/);
      if (goalMatch) data.phaseGoal = goalMatch[1];
      const focusMatch = section.match(/\*\*本周重点\*\*[：:]\s*(.+)/);
      if (focusMatch) data.weeklyFocus = focusMatch[1];
    }

    if (heading.startsWith('待解决问题')) {
      for (const line of lines) {
        const match = line.match(/-\s*\[\s*\]\s*(.+)/);
        if (match) data.pendingIssues.push(match[1]);
      }
    }

    if (heading.startsWith('已解决问题')) {
      let tableSection = '';
      for (const line of lines.slice(1)) {
        if (line.trim().startsWith('|') && !line.trim().includes('---')) {
          const cells = line.split('|').filter(c => c.trim() && !c.trim().match(/^[-|:]+$/));
          if (cells.length >= 3) {
            data.solvedIssues.push({
              date: cells[0]?.trim() || '',
              problem: cells[1]?.trim() || '',
              solution: cells[2]?.trim() || '',
              result: cells[3]?.trim() || '',
            });
          }
        }
      }
    }

    if (heading.startsWith('增长实验记录')) {
      for (const line of lines.slice(1)) {
        if (line.trim().startsWith('|') && !line.trim().includes('---')) {
          const cells = line.split('|').filter(c => c.trim() && !c.trim().match(/^[-|:]+$/));
          if (cells.length >= 5) {
            data.experiments.push({
              name: cells[0]?.trim() || '',
              startDate: cells[1]?.trim() || '',
              status: cells[2]?.trim() || '',
              result: cells[3]?.trim() || '',
              conclusion: cells[4]?.trim() || '',
            });
          }
        }
      }
    }

    const dayMatch = heading.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dayMatch && lines.length > 1) {
      const logEntry: OperationsData['logs'][0] = {
        date: dayMatch[1],
        dayLabel: heading.replace(dayMatch[1], '').replace(/（|）/g, '').trim(),
        actions: [],
        discoveries: [],
        metrics: { uv: '', opportunities: '', newUsers: '', paidUsers: '' },
        tomorrowPlan: '',
      };

      for (const line of lines.slice(1)) {
        const trimmed = line.trim();
        if (trimmed.startsWith('**今日行动**')) {
          const items = line.replace('**今日行动**', '').replace(/^[-：:]+/, '').trim();
          if (items) logEntry.actions.push(items);
        }
        if (trimmed.startsWith('**关键发现**')) {
          const items = line.replace('**关键发现**', '').replace(/^[-：:]+/, '').trim();
          if (items) logEntry.discoveries.push(items);
        }
        if (trimmed.startsWith('UV')) {
          const m = trimmed.match(/UV[：:]\s*(\S+)/);
          if (m) logEntry.metrics.uv = m[1];
        }
        if (trimmed.startsWith('商机总数')) {
          const m = trimmed.match(/商机总数[：:]\s*(\S+)/);
          if (m) logEntry.metrics.opportunities = m[1];
        }
        if (trimmed.startsWith('新注册用户')) {
          const m = trimmed.match(/新注册用户[：:]\s*(\S+)/);
          if (m) logEntry.metrics.newUsers = m[1];
        }
        if (trimmed.startsWith('付费用户')) {
          const m = trimmed.match(/付费用户[：:]\s*(\S+)/);
          if (m) logEntry.metrics.paidUsers = m[1];
        }
        if (trimmed.startsWith('**明日计划**')) {
          const items = line.replace('**明日计划**', '').replace(/^[-：:]+/, '').trim();
          if (items) logEntry.tomorrowPlan = items;
        }
      }

      if (logEntry.actions.length > 0 || logEntry.discoveries.length > 0 || logEntry.tomorrowPlan) {
        data.logs.push(logEntry);
      }
    }
  }

  data.logs.sort((a, b) => b.date.localeCompare(a.date));

  return data;
}

function getProjectAge(): string {
  const startDate = new Date('2026-05-11');
  const now = new Date();
  const diffMs = now.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (diffDays === 0) return `${diffHours}小时`;
  return `${diffDays}天${diffHours}小时`;
}

export async function GET() {
  try {
    const rootDir = path.join(process.cwd());
    const financialPath = path.join(rootDir, 'FINANCIAL_LOG.md');
    const operationsPath = path.join(rootDir, 'OPERATIONS_LOG.md');

    let financial: FinancialData | null = null;
    let operations: OperationsData | null = null;

    try {
      const financialContent = await fs.readFile(financialPath, 'utf8');
      financial = parseFinancialLog(financialContent);
    } catch {
      financial = null;
    }

    try {
      const operationsContent = await fs.readFile(operationsPath, 'utf8');
      operations = parseOperationsLog(operationsContent);
    } catch {
      operations = null;
    }

    const data: MonitorData = {
      financial,
      operations,
      lastUpdated: new Date().toISOString(),
      projectAge: getProjectAge(),
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read log files', details: String(error) },
      { status: 500 }
    );
  }
}
