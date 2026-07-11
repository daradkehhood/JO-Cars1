const { DatabaseSync } = require('node:sqlite');
const sqlite = new DatabaseSync('C:/Users/zi-jo.com/OneDrive/Documents/Cars JO/prisma/dev.db', { readOnly: true });

const row = sqlite.prepare('SELECT * FROM brands LIMIT 1').get();
for (const [k, v] of Object.entries(row)) {
  console.log(`${k}: ${typeof v} = ${v} (constructor: ${v?.constructor?.name})`);
}

const row2 = sqlite.prepare('SELECT * FROM users LIMIT 1').get();
for (const [k, v] of Object.entries(row2)) {
  console.log(`users.${k}: ${typeof v} = ${v} (constructor: ${v?.constructor?.name})`);
}

sqlite.close();
