const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');
const next = require('next');
const { Server } = require('socket.io');

const dev = false;
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const uploadsDir = path.join(__dirname, 'public', 'uploads');
const mimeTypes = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.jfif': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.avif': 'image/avif',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.webm': 'audio/webm',
  '.js': 'application/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.ico': 'image/x-icon',
};

// CDN cache durations by file type
const cacheDurations = {
  image: 'public, max-age=31536000, immutable',    // 1 year - images don't change
  font: 'public, max-age=31536000, immutable',     // 1 year - fonts don't change
  js: 'public, max-age=86400, stale-while-revalidate=604800',  // 1 day + 7 day stale
  css: 'public, max-age=86400, stale-while-revalidate=604800', // 1 day + 7 day stale
  svg: 'public, max-age=604800',                    // 1 week
  video: 'public, max-age=31536000, immutable',    // 1 year
  default: 'public, max-age=3600',                  // 1 hour
};

function getCacheDuration(ext) {
  const extLower = ext.toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.jfif', '.ico'].includes(extLower)) return cacheDurations.image;
  if (['.woff2', '.woff', '.ttf'].includes(extLower)) return cacheDurations.font;
  if (['.mp4', '.webm', '.mov'].includes(extLower)) return cacheDurations.video;
  if (extLower === '.js') return cacheDurations.js;
  if (extLower === '.css') return cacheDurations.css;
  if (extLower === '.svg') return cacheDurations.svg;
  return cacheDurations.default;
}

function log(level, msg, extra) {
  const ts = new Date().toISOString();
  const line = extra ? `[${ts}] [${level}] ${msg} ${extra}` : `[${ts}] [${level}] ${msg}`;
  if (level === 'ERROR') console.error(line);
  else console.log(line);
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Run prisma db push on startup to ensure all tables exist.
// --accept-data-loss lets us add the new @@unique([bookingId]) on conversations
// safely (existing rows have NULL bookingId, which is allowed by Postgres
// unique constraints, so nothing is actually dropped). Without this flag, the
// non-interactive prompt errors out and blocks startup intermittently.
const { execSync } = require('child_process');
try {
  log('INFO', 'Running safe prisma db push check...');
  execSync('./node_modules/.bin/prisma db push --skip-generate', { stdio: 'inherit', timeout: 30000 });
  log('INFO', 'Prisma db sync completed safely');
} catch (e) {
  log('WARN', 'Prisma db push check failed (non-fatal, database remains intact)', e.message);
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // لا نفرض مهلة 504 على طلبات المستند الأوّلي:
    // عندما يفتح مستخدم موبايل إعلان سيارة /cars/[id] على شبكة خلوية بطيئة،
    // كانـ req.setTimeout(60000) يُرجع 504 قبل أن تكتمل استجابة Next.js،
    // فلا تصل الاستجابة للمتصفّح ويُظهر صفحة "لا يوجد اتصال بالإنترنت" الأصلية.
    // بدون هذا الفرض، تُترك المهلة للسلوك الافتراضي لـ Node.js/Next.js
    // (أطول بكثير وأكثر رحابة بالشبكات الخلوية).
    // أنظر git log لمحاولات سابقة عكسية على نفس المشكلة.

    const parsedUrl = parse(req.url, true);

    if (parsedUrl.pathname.startsWith('/uploads/')) {
      const safeName = path.basename(parsedUrl.pathname);
      if (safeName.includes('..') || safeName.includes('\\') || safeName.includes('%')) {
        res.writeHead(400); res.end(); return;
      }
      const filePath = path.join(uploadsDir, safeName);
      const resolvedPath = path.resolve(filePath);
      const uploadsDirResolved = path.resolve(uploadsDir);
      if (!resolvedPath.startsWith(uploadsDirResolved)) {
        res.writeHead(403); res.end(); return;
      }
      try {
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).toLowerCase();
          if (!mimeTypes[ext]) {
            res.writeHead(403); res.end(); return;
          }
          res.writeHead(200, {
            'Content-Type': mimeTypes[ext] || 'application/octet-stream',
            'Cache-Control': getCacheDuration(ext),
            'Accept-Ranges': 'bytes',
          });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      } catch (e) { /* ignore */ }
      res.writeHead(404); res.end(); return;
    }

    // Serve public static files with proper caching
    const publicDir = path.join(__dirname, 'public');
    const publicPath = parsedUrl.pathname;

    if (publicPath.startsWith('/_next/static/') || publicPath.startsWith('/_next/image/')) {
      // Next.js static assets — serve directly with long cache
      const staticExt = path.extname(publicPath);
      if (staticExt) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }

    // Add gzip hint for client
    if (req.headers['accept-encoding']?.includes('gzip')) {
      // Node.js http server handles gzip for us via compression middleware
    }

    handle(req, res, parsedUrl).catch((err) => {
      log('ERROR', 'Request error', `${req.url} - ${err.message}`);
      if (!res.headersSent) { res.writeHead(500); res.end('Internal Server Error'); }
    });
  });

  httpServer.on('error', (err) => {
    log('ERROR', 'HTTP server error', err.message);
  });

  httpServer.on('connection', (socket) => {
    // مهلة 4 دقائق (240 ثانية) بدل 2 — شبكات الجوّال الخلوية البطيئة قد
    // تستغرق وقتًا لإرسال مستند /cars/[id] وحزم JS. تدمير socket مبكّر
    // أثناء نقل المستند يجعل المتصفّح يعرض صفحة "لا يوجد اتصال" الأصلية.
    socket.setTimeout(240000);
    socket.setKeepAlive(true, 30000);
    // لا تُدمّر socket نشطًا — الحارس below يحمي الاستجابة الجارية.
    socket.on('timeout', () => {
      if (!socket.writableEnded) socket.destroy();
    });
  });

  // keepAlive/headers فوق 75/85 ثانية ليصفح Connection: keep-alive يبقى
  // حيًّا على الشبكة الخلوية، فلا يضطر المتصفّح لإعادة المصافحة TLS
  // لكل طلب (إعادة المصافحة مكلفة جدًّا على 3G/4G ضعيف).
  httpServer.keepAliveTimeout = 75000;
  httpServer.headersTimeout = 85000;

  const io = new Server(httpServer, {
    cors: { 
      origin: process.env.NEXT_PUBLIC_APP_URL || 'https://jo-cars-production.up.railway.app',
      methods: ['GET', 'POST'] 
    },
    // Mobile-friendly: looser ping timeouts + longer polling window keep
    // slow / unstable cellular connections alive instead of dropping them.
    pingTimeout: 30000,
    pingInterval: 15000,
    maxHttpBufferSize: 1e6,
    transports: ['websocket', 'polling'],
  });

  const onlineUsers = new Map();
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET;

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token || !JWT_SECRET) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, { socketId: socket.id, joinedAt: Date.now() });
    io.emit('user-online', { userId });

    socket.on('join-conversation', (id) => {
      if (id && typeof id === 'string' && id.length < 100) socket.join(`conversation:${id}`);
    });
    socket.on('leave-conversation', (id) => {
      if (id && typeof id === 'string' && id.length < 100) socket.leave(`conversation:${id}`);
    });
    socket.on('new-message', (data) => {
      if (data?.conversationId && typeof data.conversationId === 'string') {
        socket.to(`conversation:${data.conversationId}`).emit('message-received', data);
      }
    });
    socket.on('typing', (data) => {
      if (data?.conversationId && data?.userId) {
        socket.to(`conversation:${data.conversationId}`).emit('user-typing', { userId: data.userId });
      }
    });
    socket.on('stop-typing', (data) => {
      if (data?.conversationId) {
        socket.to(`conversation:${data.conversationId}`).emit('user-stop-typing', {});
      }
    });
    socket.on('check-online', (targetUserId) => {
      if (targetUserId && typeof targetUserId === 'string') {
        socket.emit('user-status', { userId: targetUserId, online: onlineUsers.has(targetUserId) });
      }
    });
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user-offline', { userId });
    });
    socket.on('error', () => {
      onlineUsers.delete(userId);
      io.emit('user-offline', { userId });
    });
  });

  setInterval(() => {
    const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    log('INFO', `online=${onlineUsers.size} mem=${mem}MB`);
    if (mem > 500 && global.gc) global.gc();
  }, 60000);

  httpServer.listen(port, hostname, () => {
    log('INFO', `Ready on http://${hostname}:${port} [production]`);
  });

  process.on('SIGTERM', () => {
    io.close();
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000);
  });
});
