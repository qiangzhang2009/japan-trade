#!/usr/bin/env node
/**
 * ruflo — AI 全自主运营 Agent
 *
 * 工作方式：
 * 1. 读取当前项目状态（FINANCIAL_LOG.md, OPERATIONS_LOG.md, 网站数据）
 * 2. 向 DeepSeek 描述当前状态 + 任务，要求它做出决策
 * 3. 执行 DeepSeek 返回的指令（代码修改 / 内容发布 / 用户回复等）
 * 4. 将行动记录写入 OPERATIONS_LOG.md 和 FINANCIAL_LOG.md
 *
 * 预算规则：每轮 API 调用成本上限 ¥1，单次 cron 触发上限 ¥3
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ============ 安全护栏 ============

const BUDGET_LIMIT = 10; // ¥10 总预算
const MAX_CALL_COST = 1; // 每次 API 调用上限 ¥1
const SESSION_COST_LIMIT = 3; // 每次 cron 运行上限 ¥3

function getCurrentBalance() {
  const file = join(ROOT, 'FINANCIAL_LOG.md');
  if (!existsSync(file)) return BUDGET_LIMIT;
  const content = readFileSync(file, 'utf8');
  const match = content.match(/\*\*当前余额\*\*[^|]*\|\s*[^|]*\|\s*([^|]+)/);
  if (!match) return BUDGET_LIMIT;
  const val = parseFloat(match[1].replace(/[¥,\s]/g, ''));
  return isNaN(val) ? BUDGET_LIMIT : val;
}

function checkBudget(action) {
  const balance = getCurrentBalance();
  const estimatedCost = parseFloat(action.estimatedCost || '0');
  if (balance - estimatedCost < 0) {
    logDecision('REJECTED', `预算不足，拒绝行动: ${action.description}`, `余额: ¥${balance}, 预计花费: ¥${estimatedCost}`);
    return false;
  }
  return true;
}

function logDecision(type, description, detail) {
  const timestamp = new Date().toISOString();
  const entry = `\n[${timestamp}] [${type}] ${description}${detail ? '\n  └─ ' + detail : ''}`;
  const logFile = join(ROOT, 'logs', 'ruflo-agent.log');
  mkdirSync(dirname(logFile), { recursive: true });
  const existing = existsSync(logFile) ? readFileSync(logFile, 'utf8') : '';
  writeFileSync(logFile, existing + entry);
  console.log(entry);
}

// ============ DeepSeek API 调用 ============

async function callDeepSeek(systemPrompt, userPrompt, maxTokens = 2000) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    logDecision('ERROR', 'DEEPSEEK_API_KEY 未配置', '请在 GitHub Secrets 中设置 DEEPSEEK_API_KEY');
    throw new Error('DEEPSEEK_API_KEY not set');
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logDecision('ERROR', `DeepSeek API 错误: ${response.status}`, error);
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const usage = data.usage || {};
  const cost = ((usage.prompt_tokens || 0) / 1e6 * 0.1 + (usage.completion_tokens || 0) / 1e6 * 0.27).toFixed(4);
  logDecision('API_CALL', `DeepSeek 消耗约 ¥${cost}`, `tokens: ${usage.prompt_tokens}/${usage.completion_tokens}`);
  return data.choices[0].message.content;
}

// ============ 状态收集 ============

function readMarkdownFile(filename) {
  const file = join(ROOT, filename);
  if (!existsSync(file)) return null;
  return readFileSync(file, 'utf8');
}

function getProjectStats() {
  const stats = { opportunities: 0, newOpportunities: 0, users: 0, comments: 0 };

  try {
    const oppFile = join(ROOT, 'public/data/opportunities.json');
    if (existsSync(oppFile)) {
      const data = JSON.parse(readFileSync(oppFile, 'utf8'));
      stats.opportunities = Array.isArray(data) ? data.length : (data.opportunities?.length || 0);
    }
    const feedbackFile = join(ROOT, 'public/data/feedback.json');
    if (existsSync(feedbackFile)) {
      const data = JSON.parse(readFileSync(feedbackFile, 'utf8'));
      stats.comments = Array.isArray(data) ? data.length : 0;
    }
  } catch (e) {
    logDecision('WARN', '读取项目数据失败', String(e));
  }

  try {
    const lastCommit = execSync('git log -1 --format="%ai %s" 2>/dev/null', { cwd: ROOT }).toString().trim();
    stats.lastCommit = lastCommit;
  } catch {}

  return stats;
}

function buildContext() {
  const financial = readMarkdownFile('FINANCIAL_LOG.md') || '（文件不存在）';
  const operations = readMarkdownFile('OPERATIONS_LOG.md') || '（文件不存在）';
  const stats = getProjectStats();

  return {
    financial,
    operations,
    stats,
    timestamp: new Date().toISOString(),
    budget: getCurrentBalance(),
  };
}

// ============ 日志更新 ============

function appendOperationDay(dateStr, dayLabel, data) {
  const file = join(ROOT, 'OPERATIONS_LOG.md');
  let content = readMarkdownFile('OPERATIONS_LOG.md') || '';
  const dayEntry = `\n### ${dateStr}（${dayLabel}）

**今日行动**：
${data.actions.map(a => `- ${a}`).join('\n')}

**关键发现**：
${data.discoveries.map(d => `- ${d}`).join('\n')}

**数据变化**：
- UV：${data.metrics?.uv || '待获取'}
- 商机总数：${data.metrics?.opportunities || stats?.opportunities || '待获取'}
- 新注册用户：${data.metrics?.newUsers || '待获取'}
- 付费用户：${data.metrics?.paidUsers || '0'}

**明日计划**：
${data.tomorrowPlan || '-'}

`;

  // 在日志模板之后插入
  const templateEnd = content.indexOf('## 待解决问题');
  if (templateEnd !== -1) {
    content = content.slice(0, templateEnd) + dayEntry + content.slice(templateEnd);
  } else {
    content += dayEntry;
  }

  writeFileSync(file, content, 'utf8');
  logDecision('WRITE', `更新 OPERATIONS_LOG.md（${dateStr}）`);
}

function recordFinancial(amount, type, note) {
  const file = join(ROOT, 'FINANCIAL_LOG.md');
  let content = readMarkdownFile('FINANCIAL_LOG.md') || '';
  const today = new Date().toISOString().split('T')[0];

  if (type === 'income') {
    const tableEnd = content.indexOf('## 支出记录');
    if (tableEnd !== -1) {
      const newRow = `| ${today} | — | — | — | ${note} |\n`;
      content = content.slice(0, tableEnd) + `| ${today} | DeepSeek任务 | — | ¥${amount} | ${note} |\n` + content.slice(tableEnd);
    }
  } else {
    // Update current balance
    content = content.replace(/(\*\*当前余额\*\*[^|]*\|\s*[^|]*\|\s*)[^|]+/, (m, prefix) => {
      const current = parseFloat(getCurrentBalance().toString());
      const newBalance = type === 'expense' ? current - parseFloat(amount) : current + parseFloat(amount);
      return prefix + `¥${newBalance.toFixed(2)}`;
    });
  }

  writeFileSync(file, content, 'utf8');
  logDecision('FINANCIAL', `${type === 'income' ? '记录收入' : '记录支出'}: ¥${amount}`, note);
}

// ============ 指令执行引擎 ============

async function executeAction(action, context) {
  if (!checkBudget(action)) return;

  switch (action.type) {
    case 'update_log': {
      const { date, label, data } = action.params;
      appendOperationDay(date || new Date().toISOString().split('T')[0], label || '运营日', data);
      break;
    }
    case 'record_financial': {
      const { amount, type, note } = action.params;
      recordFinancial(amount, type, note);
      break;
    }
    case 'git_commit': {
      const { message } = action.params;
      try {
        execSync(`git add -A && git commit -m "${message}"`, { cwd: ROOT });
        execSync('git push', { cwd: ROOT });
        logDecision('GIT', `已提交并推送: ${message}`);
      } catch (e) {
        logDecision('GIT_ERROR', `Git 操作失败: ${e.message}`);
      }
      break;
    }
    case 'update_code': {
      // DeepSeek 返回代码变更时执行
      const { file, oldString, newString } = action.params;
      const filePath = join(ROOT, file);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf8');
        writeFileSync(filePath, content.replace(oldString, newString));
        logDecision('CODE', `修改 ${file}`);
      }
      break;
    }
    case 'write_file': {
      const { file, content } = action.params;
      const filePath = join(ROOT, file);
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, content);
      logDecision('FILE', `写入 ${file}`);
      break;
    }
    case 'api_call': {
      // 调用外部 API（如发送监控告警、触发 revalidate 等）
      const { url, method, body, note } = action.params;
      try {
        const res = await fetch(url, {
          method: method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });
        logDecision('API', `${note || url} → ${res.status}`);
      } catch (e) {
        logDecision('API_ERROR', `${url} → ${e.message}`);
      }
      break;
    }
    case 'decision': {
      // 纯记录型决策，不需要执行代码
      logDecision('DECISION', action.params.description, action.params.detail);
      break;
    }
    default:
      logDecision('UNKNOWN', `未知的 action type: ${action.type}`);
  }
}

// ============ Agent 主循环 ============

async function runAgentCycle(cycleName) {
  console.log(`\n========== ${cycleName} ==========`);
  logDecision('CYCLE_START', cycleName);

  const context = buildContext();
  console.log(`当前余额: ¥${context.budget}`);
  console.log(`商机数: ${context.stats.opportunities}`);

  const systemPrompt = `你是 ruflo，一个 AI 全自主运营 agent。你的任务是运营"出海通 AsiaBridge"（一个中日/东南亚经贸商机平台）。

核心约束：
1. 预算上限 ¥10，超支即终止
2. 当前余额：¥${context.budget}
3. 所有行动必须记录在 OPERATIONS_LOG.md 和 FINANCIAL_LOG.md
4. 不能修改 PROJECT_RUFLO_PRD.md（这是你的宪法）
5. 合规优先：不发布违规内容，不承诺无法履行的服务，不进行误导性营销
6. 极度务实：在 ¥10 预算下，每一分钱的行动都必须有明确的 ROI

你的决策框架：
- P0：活下去（确保数据采集正常，网站可用）
- P1：获取用户（SEO、内容营销、免费渠道）
- P2：转化收入（付费会员、广告、联盟）

每次运行，你必须：
1. 评估当前状态
2. 选择 1-3 个最高优先级的行动
3. 明确说出你将执行什么行动

如果余额 ≤ ¥2，立即进入"生存模式"：暂停所有非必要支出，只做能立即产生收入的事。`;

  const userPrompt = `当前项目状态：

## 财务状况（FINANCIAL_LOG.md）
${context.financial}

## 运营日志（OPERATIONS_LOG.md）
${context.operations}

## 项目统计
- 商机总数: ${context.stats.opportunities}
- 最后 git 提交: ${context.stats.lastCommit || '未知'}
- 当前时间: ${context.timestamp}

请以 ruflo 的身份，分析当前状态，选择 1-3 个最高价值的行动，输出你的决策。

输出格式（必须是合法的 JSON）：
{
  "analysis": "你对当前状态的分析（50字以内）",
  "topPriority": "最高优先级事项（10字以内）",
  "actions": [
    {
      "type": "update_log | record_financial | git_commit | update_code | write_file | api_call | decision",
      "description": "行动描述",
      "estimatedCost": "预计花费（人民币，不超过1元则写0）",
      "params": { ...该行动的具体参数... }
    }
  ],
  "dailySummary": {
    "date": "${new Date().toISOString().split('T')[0]}",
    "label": "Day X",
    "data": {
      "actions": ["行动1", "行动2"],
      "discoveries": ["发现1"],
      "metrics": { "uv": "", "opportunities": "${context.stats.opportunities}", "newUsers": "", "paidUsers": "" },
      "tomorrowPlan": "明天的计划"
    }
  }
}

注意：actions 数组中每个 action 的 params 必须符合该 type 的要求。
- update_log: { date, label, data: { actions[], discoveries[], metrics{}, tomorrowPlan } }
- record_financial: { amount, type: "income|expense", note }
- git_commit: { message }
- update_code: { file, oldString, newString }
- write_file: { file, content }
- api_call: { url, method, body, note }
- decision: { description, detail }

请直接输出 JSON，不要有 markdown 代码块标记。`;

  try {
    const response = await callDeepSeek(systemPrompt, userPrompt);

    // 解析 JSON 响应
    let decision;
    try {
      // 尝试直接解析
      decision = JSON.parse(response);
    } catch {
      // 尝试从响应中提取 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        decision = JSON.parse(jsonMatch[0]);
      } else {
        logDecision('ERROR', '无法解析 DeepSeek 响应', response.slice(0, 200));
        return;
      }
    }

    console.log(`\n分析：${decision.analysis}`);
    console.log(`最高优先级：${decision.topPriority}`);
    console.log(`计划行动数量：${decision.actions?.length || 0}`);

    // 执行 actions
    if (decision.actions && Array.isArray(decision.actions)) {
      for (const action of decision.actions) {
        if (checkBudget(action)) {
          await executeAction(action, context);
        }
      }
    }

    // 更新每日日志
    if (decision.dailySummary) {
      appendOperationDay(
        decision.dailySummary.date,
        decision.dailySummary.label,
        decision.dailySummary.data
      );
    }

    // 自动提交更改
    try {
      execSync('git add -A && git diff --cached --stat', { cwd: ROOT });
      const status = execSync('git status --porcelain', { cwd: ROOT }).toString();
      if (status.trim()) {
        const date = new Date().toISOString().split('T')[0];
        execSync(`git commit -m "ruflo(${cycleName}): auto-update logs and state"`, { cwd: ROOT });
        execSync('git push', { cwd: ROOT });
        logDecision('GIT', '自动提交并推送更改');
      }
    } catch (e) {
      logDecision('GIT', '无更改需要提交或推送失败');
    }

    logDecision('CYCLE_END', cycleName, `余额: ¥${getCurrentBalance()}`);

  } catch (e) {
    logDecision('FATAL', 'Agent 运行失败', String(e));
    throw e;
  }
}

// ============ 入口 ============

const cycleName = process.argv[2] || `Cycle-${new Date().toISOString()}`;

runAgentCycle(cycleName)
  .then(() => {
    console.log('\nruflo agent 运行完成');
    process.exit(0);
  })
  .catch((e) => {
    console.error('ruflo agent 错误:', e);
    process.exit(1);
  });
