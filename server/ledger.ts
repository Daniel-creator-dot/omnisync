import { PoolClient } from 'pg';
import pool from './db';
import { ensureBooks } from './schema';

export function money(n: number) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function normalizeType(type: string) {
  const x = (type || '').toLowerCase().trim();
  if (['income', 'revenue', 'sales'].includes(x)) return 'revenue';
  if (x === 'assets' || x === 'asset') return 'asset';
  if (x.startsWith('liab')) return 'liability';
  if (['equity', 'capital'].includes(x)) return 'equity';
  if (['expense', 'expenses', 'cogs'].includes(x)) return 'expense';
  return x;
}

export function signedBalance(type: string, debit: number, credit: number) {
  const kind = normalizeType(type);
  if (kind === 'asset' || kind === 'expense') return money(debit - credit);
  return money(credit - debit);
}

export type AccountRow = {
  id: number;
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
};

export async function expenseLines(client: PoolClient) {
  await ensureBooks();
  const result = await client.query(`
    SELECT j.id AS journal_id,
      COALESCE(j.entry_date, j.date, j.created_at::date) AS date,
      j.description,
      j.reference,
      c.id AS account_id,
      c.code,
      c.name AS account_name,
      l.debit::float AS debit,
      l.credit::float AS credit,
      (l.debit - l.credit)::float AS amount
    FROM journal_lines l
    JOIN journal_entries j ON j.id = l.journal_entry_id
    JOIN chart_of_accounts c ON c.id = l.account_id
    WHERE lower(c.type) = 'expense'
    ORDER BY COALESCE(j.entry_date, j.date, j.created_at) DESC NULLS LAST, j.id DESC
  `);
  return result.rows;
}

export async function listJournals() {
  await ensureBooks();
  const result = await pool.query(`
    SELECT id,
      COALESCE(entry_date, date, created_at::date) AS date,
      description,
      reference,
      lines,
      amount,
      debit_account,
      credit_account
    FROM journal_entries
    ORDER BY COALESCE(entry_date, date, created_at::date) DESC NULLS LAST, id DESC
  `);
  return result.rows.map((row) => {
    let lines = row.lines;
    if (typeof lines === 'string') {
      try { lines = JSON.parse(lines); } catch { lines = []; }
    }
    if (!Array.isArray(lines) || lines.length === 0) {
      lines = [
        { accountName: row.debit_account, type: 'debit', amount: row.amount },
        { accountName: row.credit_account, type: 'credit', amount: row.amount },
      ].filter((line) => line.accountName);
    }
    return { ...row, lines };
  });
}

export async function loadAccounts(client: PoolClient): Promise<AccountRow[]> {
  await ensureBooks();
  const result = await client.query(`
    SELECT c.id, c.code, c.name, c.type,
      COALESCE(SUM(l.debit), 0)::float AS debit,
      COALESCE(SUM(l.credit), 0)::float AS credit
    FROM chart_of_accounts c
    LEFT JOIN journal_lines l ON l.account_id = c.id
    GROUP BY c.id
    ORDER BY c.code
  `);
  return result.rows.map((row) => {
    const type = normalizeType(row.type);
    const debit = Number(row.debit);
    const credit = Number(row.credit);
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      type,
      debit,
      credit,
      balance: signedBalance(type, debit, credit),
    };
  });
}

export function trialBalance(accounts: AccountRow[]) {
  let totalDebits = 0;
  let totalCredits = 0;
  const rows = accounts.map((account) => {
    let debit = 0;
    let credit = 0;
    if (account.type === 'asset' || account.type === 'expense') {
      if (account.balance >= 0) debit = account.balance;
      else credit = -account.balance;
    } else if (account.balance >= 0) credit = account.balance;
    else debit = -account.balance;
    debit = money(debit);
    credit = money(credit);
    totalDebits += debit;
    totalCredits += credit;
    return { ...account, debit, credit };
  });
  totalDebits = money(totalDebits);
  totalCredits = money(totalCredits);
  return {
    accounts: rows,
    totalDebits,
    totalCredits,
    isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
    difference: money(totalDebits - totalCredits),
  };
}

export function balanceSheet(accounts: AccountRow[]) {
  const ofType = (type: string) => accounts.filter((account) => account.type === type);
  const sum = (rows: AccountRow[]) => money(rows.reduce((total, row) => total + row.balance, 0));
  const assetAccounts = ofType('asset');
  const liabilityAccounts = ofType('liability');
  const equityAccounts = ofType('equity');
  const totalAssets = sum(assetAccounts);
  const totalLiabilities = sum(liabilityAccounts);
  const equityBeforeEarnings = sum(equityAccounts);
  const currentEarnings = money(sum(ofType('revenue')) - sum(ofType('expense')));
  const totalEquity = money(equityBeforeEarnings + currentEarnings);
  const difference = money(totalAssets - (totalLiabilities + totalEquity));
  return {
    assetAccounts,
    liabilityAccounts,
    equityAccounts,
    equityBeforeEarnings,
    currentEarnings,
    totalAssets,
    totalLiabilities,
    totalEquity,
    difference,
    inBalance: Math.abs(difference) < 0.01,
    equation: 'Total Assets = Total Liabilities + Total Equity',
  };
}

export function profitAndLoss(accounts: AccountRow[]) {
  const revenueAccounts = accounts.filter((account) => account.type === 'revenue');
  const expenseAccounts = accounts.filter((account) => account.type === 'expense');
  const revenue = money(revenueAccounts.reduce((total, row) => total + row.balance, 0));
  const operatingExpenses = money(expenseAccounts.reduce((total, row) => total + row.balance, 0));
  const payrollCosts = money(
    expenseAccounts
      .filter((account) => /payroll/i.test(account.name))
      .reduce((total, row) => total + row.balance, 0)
  );
  return {
    revenue,
    expensesByCategory: expenseAccounts.map((account) => ({
      category: `${account.code} ${account.name}`,
      total: account.balance,
    })),
    operatingExpenses,
    payrollCosts,
    totalExpenses: operatingExpenses,
    netIncome: money(revenue - operatingExpenses),
    revenueAccounts,
    expenseAccounts,
  };
}

type JournalLineInput = {
  accountId?: number | string;
  accountName?: string;
  type?: string;
  amount?: number | string;
  debit?: number | string;
  credit?: number | string;
};

export class JournalError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function normalizeLines(lines: JournalLineInput[]) {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new JournalError('A journal needs at least two lines');
  }
  let debits = 0;
  let credits = 0;
  const normalized = lines.map((line) => {
    const accountId = Number(line.accountId);
    if (!accountId) throw new JournalError('Every journal line needs an account');
    let type = line.type;
    let amount = Number(line.amount);
    if (!type) {
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);
      if (debit > 0 && credit > 0) throw new JournalError('A line cannot be both a debit and a credit');
      type = debit > 0 ? 'debit' : 'credit';
      amount = debit > 0 ? debit : credit;
    }
    if (type !== 'debit' && type !== 'credit') throw new JournalError('Each line must be a debit or a credit');
    if (!(amount > 0)) throw new JournalError('Each line amount must be greater than zero');
    amount = money(amount);
    if (type === 'debit') debits += amount;
    else credits += amount;
    return { accountId, accountName: line.accountName || '', type, amount };
  });
  debits = money(debits);
  credits = money(credits);
  if (Math.abs(debits - credits) >= 0.01) {
    throw new JournalError(`Journal rejected: debits ${debits.toFixed(2)} do not equal credits ${credits.toFixed(2)}`);
  }
  return { lines: normalized, total: debits };
}

export async function postJournal(
  client: PoolClient,
  entry: { date?: string; description?: string; reference?: string; lines: JournalLineInput[] }
) {
  const { lines, total } = normalizeLines(entry.lines);
  const ids = [...new Set(lines.map((line) => line.accountId))];
  const accounts = await client.query('SELECT id, code, name, type FROM chart_of_accounts WHERE id = ANY($1::int[])', [ids]);
  if (accounts.rows.length !== ids.length) {
    throw new JournalError('One or more accounts do not exist');
  }
  const byId = new Map(accounts.rows.map((row) => [row.id, row]));
  const named = lines.map((line) => ({
    ...line,
    accountName: line.accountName || byId.get(line.accountId)?.name || '',
  }));
  const firstDebit = named.find((line) => line.type === 'debit');
  const firstCredit = named.find((line) => line.type === 'credit');
  const postedOn = entry.date || new Date().toISOString().slice(0, 10);
  const inserted = await client.query(
    `INSERT INTO journal_entries (entry_date, date, description, debit_account, credit_account, amount, reference, lines)
     VALUES ($1, $1, $2, $3, $4, $5, $6, $7::jsonb)
     RETURNING id, COALESCE(entry_date, date) AS date, description, reference, lines, amount`,
    [
      postedOn,
      entry.description || '',
      firstDebit ? byId.get(firstDebit.accountId)?.code || firstDebit.accountName : 'multiple',
      firstCredit ? byId.get(firstCredit.accountId)?.code || firstCredit.accountName : 'multiple',
      total,
      entry.reference || '',
      JSON.stringify(named),
    ]
  );
  const journalId = inserted.rows[0].id;
  for (const line of named) {
    await client.query(
      `INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit)
       VALUES ($1, $2, $3, $4)`,
      [journalId, line.accountId, line.type === 'debit' ? line.amount : 0, line.type === 'credit' ? line.amount : 0]
    );
  }
  return inserted.rows[0];
}
