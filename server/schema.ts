import pool from './db';

let ready: Promise<void> | null = null;

export function ensureBooks() {
  if (!ready) {
    ready = migrateBooks().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

async function relationExists(name: string, queryable: { query: typeof pool.query } = pool) {
  const result = await queryable.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [name]
  );
  return result.rows.length > 0;
}

async function columnSet(table: string, queryable: { query: typeof pool.query } = pool) {
  const result = await queryable.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  return new Set(result.rows.map((row) => row.column_name as string));
}

async function migrateBooks() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        parent_id INTEGER,
        balance NUMERIC(14,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        entry_date DATE,
        date DATE,
        description TEXT,
        reference VARCHAR(100),
        debit_account VARCHAR(255),
        credit_account VARCHAR(255),
        amount NUMERIC(14,2),
        lines JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS entry_date DATE`);
    await client.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS date DATE`);
    await client.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS description TEXT`);
    await client.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS reference VARCHAR(100)`);
    await client.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS debit_account VARCHAR(255)`);
    await client.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS credit_account VARCHAR(255)`);
    await client.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS amount NUMERIC(14,2)`);
    await client.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS lines JSONB DEFAULT '[]'`);
    await client.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`);
    await client.query(`UPDATE journal_entries SET entry_date = date WHERE entry_date IS NULL AND date IS NOT NULL`);
    await client.query(`UPDATE journal_entries SET date = entry_date WHERE date IS NULL AND entry_date IS NOT NULL`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS journal_lines (
        id SERIAL PRIMARY KEY,
        journal_entry_id INTEGER,
        account_id INTEGER,
        debit NUMERIC(14,2) DEFAULT 0,
        credit NUMERIC(14,2) DEFAULT 0
      )
    `);

    if (await relationExists('expenses', client)) {
      await client.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS account_id INTEGER`);
      await client.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)`);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER,
        amount NUMERIC(12,2) NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        method VARCHAR(50) DEFAULT 'check',
        reference VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        account_number VARCHAR(100),
        bank_name VARCHAR(255),
        currency VARCHAR(10) DEFAULT 'GH₵',
        balance NUMERIC(14,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bank_transfers (
        id SERIAL PRIMARY KEY,
        from_account_id INTEGER,
        to_account_id INTEGER,
        amount NUMERIC(12,2) NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query(`ALTER TABLE bank_transfers ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE`);
    await client.query(`ALTER TABLE bank_transfers ADD COLUMN IF NOT EXISTS description TEXT`);
    await client.query(`ALTER TABLE bank_transfers ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2)`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cashbook_entries (
        id SERIAL PRIMARY KEY,
        description TEXT,
        amount NUMERIC(14,2) NOT NULL,
        type VARCHAR(50),
        category VARCHAR(100),
        agent_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const chartCount = await client.query('SELECT COUNT(*)::int AS n FROM chart_of_accounts');
    const accountCols = (await relationExists('accounts', client)) ? await columnSet('accounts', client) : new Set<string>();
    if (chartCount.rows[0].n === 0 && accountCols.has('code') && accountCols.has('name') && accountCols.has('type')) {
      await client.query(`
        INSERT INTO chart_of_accounts (id, code, name, type, balance)
        SELECT DISTINCT ON (code) id, code, name, LOWER(type), ${accountCols.has('balance') ? 'COALESCE(balance, 0)' : '0'}
        FROM accounts
        WHERE code IS NOT NULL AND name IS NOT NULL AND type IS NOT NULL
        ORDER BY code, id
      `);
      const sequence = await client.query(`SELECT pg_get_serial_sequence('chart_of_accounts', 'id') AS seq`);
      if (sequence.rows[0]?.seq) {
        await client.query(
          `SELECT setval($1::regclass, GREATEST(COALESCE((SELECT MAX(id) FROM chart_of_accounts), 1), 1), true)`,
          [sequence.rows[0].seq]
        );
      }
    }

    if (accountCols.has('description') && accountCols.has('amount')) {
      const codeFilter = accountCols.has('code') ? 'AND code IS NULL' : '';
      const typeExpr = accountCols.has('type') ? 'type' : 'NULL';
      const category = accountCols.has('category') ? 'category' : 'NULL';
      const agent = accountCols.has('agent_id') ? 'agent_id' : 'NULL';
      const created = accountCols.has('created_at') ? 'created_at' : 'NOW()';
      await client.query(`
        INSERT INTO cashbook_entries (description, amount, type, category, agent_id, created_at)
        SELECT description, amount, ${typeExpr}, ${category}, ${agent}, COALESCE(${created}, NOW())
        FROM accounts
        WHERE amount IS NOT NULL
          ${codeFilter}
          AND NOT EXISTS (
            SELECT 1 FROM cashbook_entries c
            WHERE c.amount = accounts.amount
              AND c.description IS NOT DISTINCT FROM accounts.description
              AND c.type IS NOT DISTINCT FROM ${accountCols.has('type') ? 'accounts.type' : 'NULL'}
          )
      `);
    }

    const journalCols = await columnSet('journal_entries', client);
    if (journalCols.has('lines')) {
      const stored = await client.query(`SELECT id, lines FROM journal_entries WHERE lines IS NOT NULL`);
      for (const row of stored.rows) {
        const lines = Array.isArray(row.lines) ? row.lines : [];
        if (lines.length === 0) continue;
        const existing = await client.query('SELECT 1 FROM journal_lines WHERE journal_entry_id = $1 LIMIT 1', [row.id]);
        if (existing.rows.length > 0) continue;
        for (const line of lines) {
          const accountId = Number(line.accountId || line.account_id);
          if (!accountId) continue;
          const debit = line.type === 'credit' ? 0 : Number(line.debit || (line.type === 'debit' ? line.amount : 0) || 0);
          const credit = line.type === 'debit' ? 0 : Number(line.credit || (line.type === 'credit' ? line.amount : 0) || 0);
          if (debit === 0 && credit === 0) continue;
          await client.query(
            'INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit) VALUES ($1,$2,$3,$4)',
            [row.id, accountId, debit, credit]
          );
        }
      }
    }

    await linkJournalAccounts(client);
    await recognizeInvoices(client);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function accountKind(name: string) {
  const normalized = name.toLowerCase();
  if (/receivable|\bcash\b|bank|equipment|vehicle|furniture|inventory/.test(normalized)) return 'asset';
  if (/payable|loan|creditor/.test(normalized)) return 'liability';
  if (/capital|equity|retained|drawing/.test(normalized)) return 'equity';
  if (/sales|revenue|income/.test(normalized)) return 'revenue';
  return 'expense';
}

function preferredCode(name: string) {
  const normalized = name.toLowerCase();
  if (normalized === 'cash') return '1000';
  if (normalized.includes('receivable')) return '1100';
  if (normalized.includes('sales') || normalized.includes('revenue')) return '4000';
  if (/wage|salary/.test(normalized)) return '5100';
  return '';
}

async function linkJournalAccounts(client: { query: typeof pool.query }) {
  const chart = await client.query('SELECT id, code, name, type FROM chart_of_accounts');
  const byId = new Map(chart.rows.map((row) => [Number(row.id), row]));
  const byName = new Map(chart.rows.map((row) => [String(row.name).toLowerCase(), row]));
  const usedCodes = new Set(chart.rows.map((row) => row.code).filter(Boolean));

  const remember = (row: { id: number; code: string | null; name: string }) => {
    byId.set(Number(row.id), row);
    byName.set(String(row.name).toLowerCase(), row);
    if (row.code) usedCodes.add(row.code);
  };

  const resolve = async (line: { accountId?: number | string; accountName?: string }) => {
    const requested = Number(line.accountId);
    if (requested && byId.has(requested)) return requested;
    const name = String(line.accountName || '').trim();
    if (!name) return 0;
    const named = byName.get(name.toLowerCase());
    if (named) return Number(named.id);
    let code = preferredCode(name);
    if (code && usedCodes.has(code)) code = '';
    const inserted = requested && !byId.has(requested)
      ? await client.query(
        `INSERT INTO chart_of_accounts (id, code, name, type, balance)
         VALUES ($1, NULLIF($2, ''), $3, $4, 0) RETURNING id, code, name`,
        [requested, code, name, accountKind(name)]
      )
      : await client.query(
        `INSERT INTO chart_of_accounts (code, name, type, balance)
         VALUES (NULLIF($1, ''), $2, $3, 0) RETURNING id, code, name`,
        [code, name, accountKind(name)]
      );
    remember(inserted.rows[0]);
    return Number(inserted.rows[0].id);
  };

  const journals = await client.query('SELECT id, lines FROM journal_entries');
  for (const journal of journals.rows) {
    let lines = journal.lines;
    if (typeof lines === 'string') {
      try { lines = JSON.parse(lines); } catch { lines = []; }
    }
    if (!Array.isArray(lines) || lines.length === 0) continue;
    const resolved: { accountId: number; debit: number; credit: number }[] = [];
    for (const line of lines) {
      const accountId = await resolve(line);
      if (!accountId) continue;
      const amount = Number(line.amount || 0);
      const debit = line.type === 'credit' ? 0 : Number(line.debit || (line.type === 'debit' ? amount : 0) || 0);
      const credit = line.type === 'debit' ? 0 : Number(line.credit || (line.type === 'credit' ? amount : 0) || 0);
      if (debit === 0 && credit === 0) continue;
      resolved.push({ accountId, debit, credit });
    }
    if (resolved.length === 0) continue;
    await client.query('DELETE FROM journal_lines WHERE journal_entry_id = $1', [journal.id]);
    for (const line of resolved) {
      await client.query(
        'INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit) VALUES ($1,$2,$3,$4)',
        [journal.id, line.accountId, line.debit, line.credit]
      );
    }
  }

  const sequence = await client.query(`SELECT pg_get_serial_sequence('chart_of_accounts', 'id') AS seq`);
  if (sequence.rows[0]?.seq) {
    await client.query(
      `SELECT setval($1::regclass, GREATEST(COALESCE((SELECT MAX(id) FROM chart_of_accounts), 1), 1), true)`,
      [sequence.rows[0].seq]
    );
  }
}

async function accountByName(client: { query: typeof pool.query }, name: string, code: string, type: string) {
  const found = await client.query(
    `SELECT id, name FROM chart_of_accounts
     WHERE lower(name) = lower($1) OR code = $2
     ORDER BY CASE WHEN lower(name) = lower($1) THEN 0 ELSE 1 END
     LIMIT 1`,
    [name, code]
  );
  if (found.rows[0]) return found.rows[0];
  const created = await client.query(
    `INSERT INTO chart_of_accounts (code, name, type, balance) VALUES ($1,$2,$3,0) RETURNING id, name`,
    [code, name, type]
  );
  return created.rows[0];
}

export async function controlAccounts(client: { query: typeof pool.query }) {
  return {
    cash: await accountByName(client, 'Cash', '1000', 'asset'),
    receivable: await accountByName(client, 'Accounts Receivable', '1100', 'asset'),
    sales: await accountByName(client, 'Sales', '4000', 'revenue'),
  };
}

async function recognizeInvoices(client: { query: typeof pool.query }) {
  if (!(await relationExists('invoices', client))) return;
  const invoices = await client.query(
    'SELECT id, invoice_number, client_name, amount, issue_date FROM invoices'
  );
  if (invoices.rows.length === 0) return;
  const books = await controlAccounts(client);
  const salesNamed = await client.query(
    `SELECT id, name FROM chart_of_accounts WHERE name ~* 'sales' ORDER BY id LIMIT 1`
  );
  const sales = salesNamed.rows[0] || books.sales;
  for (const invoice of invoices.rows) {
    const amount = Math.round(Number(invoice.amount || 0) * 100) / 100;
    if (!(amount > 0)) continue;
    const reference = `SALE-${invoice.invoice_number || invoice.id}`;
    const existing = await client.query('SELECT 1 FROM journal_entries WHERE reference = $1 LIMIT 1', [reference]);
    if (existing.rows.length > 0) continue;
    const description = `Invoice ${invoice.invoice_number || invoice.id} — ${invoice.client_name || 'Customer'}`;
    const postedOn = invoice.issue_date || new Date().toISOString().slice(0, 10);
    const lines = [
      { accountId: books.receivable.id, accountName: books.receivable.name, type: 'debit', amount },
      { accountId: sales.id, accountName: sales.name, type: 'credit', amount },
    ];
    const inserted = await client.query(
      `INSERT INTO journal_entries (entry_date, date, description, debit_account, credit_account, amount, reference, lines)
       VALUES ($1, $1, $2, $3, $4, $5, $6, $7::jsonb) RETURNING id`,
      [postedOn, description, '1100', sales.name, amount, reference, JSON.stringify(lines)]
    );
    await client.query(
      'INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit) VALUES ($1,$2,$3,0), ($1,$4,0,$3)',
      [inserted.rows[0].id, books.receivable.id, amount, sales.id]
    );
  }
}

export async function bankTable(): Promise<'bank_accounts' | 'banks'> {
  await ensureBooks();
  const hasAccounts = await relationExists('bank_accounts');
  const hasBanks = await relationExists('banks');
  if (hasBanks && !hasAccounts) return 'banks';
  if (hasAccounts && hasBanks) {
    const [accounts, banks] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS n FROM bank_accounts'),
      pool.query('SELECT COUNT(*)::int AS n FROM banks'),
    ]);
    if (Number(accounts.rows[0].n) === 0 && Number(banks.rows[0].n) > 0) return 'banks';
  }
  return 'bank_accounts';
}
