import { Pool } from 'pg';

const livePool = new Pool({
  connectionString: 'postgresql://postgres.sxmrhbtujlkdqeigyoix:Daniel@24419000@aws-0-eu-west-1.pooler.supabase.com:5432/postgres',
});

async function check() {
  try {
    const tables = await livePool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    console.log('\n=== TABLES ===');
    console.log(tables.rows.map((r: any) => r.table_name));

    const keyTables = ['users', 'employees', 'invoices', 'expenses', 'accounts', 'company_settings', 'sms_config', 'password_reset_otps', 'audit_logs', 'exit_management', 'assets', 'job_postings', 'payments'];
    
    for (const t of keyTables) {
      const cols = await livePool.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
        [t]
      );
      if (cols.rows.length > 0) {
        console.log(`\n=== ${t.toUpperCase()} (${cols.rows.length} columns) ===`);
        console.log(cols.rows.map((c: any) => `  ${c.column_name} (${c.data_type})`).join('\n'));
      } else {
        console.log(`\n❌ TABLE MISSING: ${t}`);
      }
    }
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await livePool.end();
  }
}

check();
