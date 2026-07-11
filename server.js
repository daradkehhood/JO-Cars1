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
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
};

function log(level, msg, extra) {
  const ts = new Date().toISOString();
  const line = extra ? `[${ts}] [${level}] ${msg} ${extra}` : `[${ts}] [${level}] ${msg}`;
  if (level === 'ERROR') console.error(line);
  else console.log(line);
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    req.setTimeout(30000, () => {
      if (!res.headersSent) { res.writeHead(504); res.end('Gateway Timeout'); }
    });

    const parsedUrl = parse(req.url, true);

    if (parsedUrl.pathname.startsWith('/uploads/')) {
      const filePath = path.join(uploadsDir, path.basename(parsedUrl.pathname));
      try {
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).toLowerCase();
          res.writeHead(200, {
            'Content-Type': mimeTypes[ext] || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000',
          });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      } catch (e) { /* ignore */ }
      res.writeHead(404); res.end(); return;
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
    socket.setTimeout(60000);
    socket.setKeepAlive(true, 30000);
    socket.on('timeout', () => socket.destroy());
  });

  httpServer.keepAliveTimeout = 65000;
  httpServer.headersTimeout = 70000;

  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 20000,
    pingInterval: 10000,
    maxHttpBufferSize: 1e6,
    transports: ['websocket', 'polling'],
  });

  const connectedSockets = new Map();

  io.on('connection', (socket) => {
    connectedSockets.set(socket.id, Date.now());

    socket.on('join-conversation', (id) => { if (id) socket.join(`conversation:${id}`); });
    socket.on('leave-conversation', (id) => { if (id) socket.leave(`conversation:${id}`); });
    socket.on('new-message', (data) => {
      if (data?.conversationId) socket.to(`conversation:${data.conversationId}`).emit('message-received', data);
    });
    socket.on('typing', (data) => {
      if (data?.conversationId && data?.userId) socket.to(`conversation:${data.conversationId}`).emit('user-typing', { userId: data.userId });
    });
    socket.on('stop-typing', (data) => {
      if (data?.conversationId) socket.to(`conversation:${data.conversationId}`).emit('user-stop-typing', {});
    });
    socket.on('disconnect', () => { connectedSockets.delete(socket.id); });
    socket.on('error', () => { connectedSockets.delete(socket.id); });
  });

  setInterval(() => {
    const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    log('INFO', `sockets=${connectedSockets.size} mem=${mem}MB`);
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
