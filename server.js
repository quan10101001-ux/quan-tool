const net = require('net');

const VPS_HOST = 'quan-tool-production.up.railway.app';
const VPS_TUNNEL_PORT = 7000;
const REDIS_PORT = parseInt(process.argv[2]) || 6379;

console.log(`[info] Redis local port: ${REDIS_PORT}`);
console.log(`[info] Tunnel server: ${VPS_HOST}:${VPS_TUNNEL_PORT}`);

function connect() {
  console.log('[client] Connecting to VPS...');

  const tunnel = net.connect(VPS_TUNNEL_PORT, VPS_HOST);
  const local = net.connect(REDIS_PORT, '127.0.0.1');

  tunnel.pipe(local);
  local.pipe(tunnel);

  tunnel.on('connect', () => console.log('[client] Tunnel established — ready'));

  const cleanup = () => {
    tunnel.destroy();
    local.destroy();
    console.log('[client] Disconnected, reconnecting in 3s...');
    setTimeout(connect, 3000);
  };

  tunnel.on('error', cleanup);
  tunnel.on('close', cleanup);
  local.on('error', () => tunnel.destroy());
  local.on('close', () => tunnel.destroy());
}

connect();
