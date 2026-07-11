const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'server-crash.log');
let restartCount = 0;
const MAX_RESTARTS = 50;
const RESTART_DELAY = 3000;
let lastCrash = 0;

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}\n`;
  console.log(line.trim());
  fs.appendFileSync(LOG_FILE, line);
}

function startServer() {
  const now = Date.now();
  if (now - lastCrash < 10000) {
    restartCount++;
  } else {
    restartCount = 0;
  }
  lastCrash = now;

  if (restartCount >= MAX_RESTARTS) {
    log(`FATAL: Too many rapid restarts (${restartCount}). Waiting 60 seconds...`);
    restartCount = 0;
    setTimeout(startServer, 60000);
    return;
  }

  log(`Starting server (restart #${restartCount})...`);

  const child = spawn('node', ['--max-old-space-size=512', 'server.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=512' },
  });

  child.on('exit', (code, signal) => {
    log(`Server exited: code=${code} signal=${signal}`);
    if (signal !== 'SIGTERM' && signal !== 'SIGKILL') {
      log(`Restarting in ${RESTART_DELAY / 1000}s...`);
      setTimeout(startServer, RESTART_DELAY);
    }
  });

  child.on('error', (err) => {
    log(`Server spawn error: ${err.message}`);
    setTimeout(startServer, RESTART_DELAY);
  });

  process.on('SIGTERM', () => { child.kill('SIGTERM'); });
  process.on('SIGINT', () => { child.kill('SIGTERM'); });
}

log('=== Watchdog started ===');
startServer();
