const net = require('net');

const TUNNEL_PORT = 7000;
const PUBLIC_PORT = 6379;

const clients = [];
let tunnelSocket = null;

net.createServer(sock => {
  tunnelSocket = sock;
  console.log('[tunnel] Local machine connected');

  sock.on('error', err => console.log('[tunnel] error:', err.message));
  sock.on('close', () => {
    tunnelSocket = null;
    console.log('[tunnel] disconnected');
  });
}).listen(TUNNEL_PORT, () => console.log(`[tunnel] Waiting on port ${TUNNEL_PORT}`));

net.createServer(sock => {
  if (!tunnelSocket) {
    console.log('[public] No tunnel, dropping connection');
    return sock.destroy();
  }

  console.log('[public] Client connected, piping to tunnel');
  sock.pipe(tunnelSocket);
  tunnelSocket.pipe(sock);

  sock.on('error', () => sock.destroy());
  sock.on('close', () => tunnelSocket && tunnelSocket.unpipe());
}).listen(PUBLIC_PORT, () => console.log(`[public] Redis available on port ${PUBLIC_PORT}`));
