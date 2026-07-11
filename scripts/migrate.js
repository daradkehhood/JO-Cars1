const { DatabaseSync } = require('node:sqlite');
const { PrismaClient } = require('@prisma/client');

const sqlite = new DatabaseSync('C:/Users/zi-jo.com/OneDrive/Documents/Cars JO/prisma/dev.db', { readOnly: true });
const pg = new PrismaClient();

const booleanFields = new Set([
  'isActive', 'isNegotiable', 'hasWarranty', 'hasServiceHistory', 'isDamaged',
  'isPaintOriginal', 'isNew', 'featured', 'read', 'isCover', 'aiProcessed',
  'isPinned', 'isLocked', 'isStaff', 'emailVerified', 'phoneVerified',
  'whatsappNotifications', 'canPost', 'published', 'notify', 'autoRenew',
  'maintenance', 'homeShowFeatured', 'homeShowCities', 'homeShowBrands',
  'homeShowStats', 'isCompleted', 'isNotified',
]);

const dateFields = new Set([
  'createdAt', 'updatedAt', 'expiresAt', 'soldAt', 'deletedAt',
  'lastLoginAt', 'banUntil', 'featuredUntil', 'publishedAt',
  'eventDate', 'startDate', 'endDate', 'dueDate', 'completedAt',
  'forumBannedCommentUntil', 'forumBannedTopicUntil', 'carCommentBannedUntil',
  'lastPostAt', 'reportedPostCreatedAt', 'reportedCommentCreatedAt',
  'closedAt', 'lastOdometer',
]);

function convertValue(col, v) {
  if (v === null || v === undefined) return null;
  if (booleanFields.has(col)) return v === 1 || v === true;
  if (dateFields.has(col)) {
    if (typeof v === 'number' && v > 0) return new Date(v);
    return v;
  }
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

async function migrate() {
  console.log('Connected');
  
  const order = [
    'brands', 'car_models', 'provinces', 'cities', 'users',
    'badges', 'plans', 'site_settings', 'articles',
    'cars', 'car_images', 'car_logs', 'car_history', 'car_tags', 'car_tag_assignments',
    'favorites', 'notifications', 'conversations', 'messages',
    'plates', 'wanted_ads', 'wanted_offers',
    'auctions', 'bids', 'forum_categories', 'forum_topics', 'forum_posts', 'forum_post_reports',
    'price_alerts', 'used_parts', 'maintenance_services',
    'car_comments', 'car_comment_reports', 'car_reminders', 'car_viewers',
    'premium_requests', 'user_ratings', 'comparison_items',
    'tickets', 'ticket_messages', 'audit_logs',
  ];

  const allTables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%' AND name NOT LIKE 'sqlite%'").all().map(r => r.name);
  const tables = [...new Set([...order, ...allTables])];

  for (const table of tables) {
    try {
      const rows = sqlite.prepare(`SELECT * FROM "${table}"`).all();
      if (rows.length === 0) continue;
      const cols = Object.keys(rows[0]);
      let inserted = 0;

      for (const row of rows) {
        const processedCols = [];
        const processedVals = [];
        for (const c of cols) {
          processedCols.push(c);
          processedVals.push(convertValue(c, row[c]));
        }
        const colList = processedCols.map(c => `"${c}"`).join(', ');
        const placeholders = processedCols.map((_, i) => `$${i + 1}`).join(', ');
        const sql = `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        try {
          await pg.$executeRawUnsafe(sql, ...processedVals);
          inserted++;
        } catch (e) {
          // skip individual rows
        }
      }
      console.log(`${table}: ${inserted}/${rows.length}`);
    } catch (e) {
      console.log(`Skip ${table}: ${e.message.slice(0, 80)}`);
    }
  }
  console.log('\nDone!');
  sqlite.close();
  await pg.$disconnect();
}

migrate().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
