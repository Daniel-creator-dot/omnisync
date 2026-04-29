
const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: process.env.PROD_DB_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function updateCurrency() {
  try {
    await pool.query("UPDATE company_settings SET currency = 'GH₵' WHERE id = 1");
    console.log('Successfully updated production currency to GH₵');
  } catch (err) {
    console.error('Update failed:', err);
  } finally {
    await pool.end();
  }
}

updateCurrency();
