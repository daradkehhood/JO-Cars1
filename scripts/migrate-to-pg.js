const fs = require('fs');
const { Client } = require('pg');

const sqlitePath = require('path').join(__dirname, '..', 'prisma', 'dev.db');
const pgUrl = 'postgresql://postgres:662009@localhost:4000/jocars';

async function migrate() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(sqlitePath);
  const db = new SQL.Database(buffer);

  const pg = new Client({ connectionString: pgUrl });
  await pg.connect();
  console.log('Connected to both databases.');

  const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  const tables = tablesResult.length > 0 ? tablesResult[0].values.map(r => r[0]) : [];
  console.log(`Found ${tables.length} tables in SQLite`);

  const skipMeta = ['_prisma_migrations', 'sqlite_sequence'];

  for (const table of tables) {
    if (skipMeta.includes(table) || table.startsWith('_')) continue;

    try {
      const rows = db.exec(`SELECT * FROM "${table}"`);
      if (!rows || rows.length === 0 || rows[0].values.length === 0) continue;

      const cols = rows[0].columns;
      const data = rows[0].values;
      console.log(`${table}: ${data.length} rows, ${cols.length} cols`);

      let inserted = 0;
      for (const row of data) {
        const values = row.map(v => {
          if (v === null) return null;
          if (typeof v === 'object') return JSON.stringify(v);
          return v;
        });

        const colList = cols.map(c => `"${c}"`).join(', ');
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
        const sql = `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

        try {
          await pg.query(sql, values);
          inserted++;
        } catch (e) {
          // skip errors
        }
      }
      console.log(`  -> inserted ${inserted}/${data.length}`);
    } catch (e) {
      console.log(`  Skip ${table}: ${e.message.slice(0, 100)}`);
    }
  }

  console.log('\nMigration complete!');
  db.close();
  await pg.end();
}

migrate().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
