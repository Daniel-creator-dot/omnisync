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

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
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
