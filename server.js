const net = require('net');

const TUNNEL_PORT = 7000;
const PUBLIC_PORT = 6379;

const tunnelQueue = [];
const clientQueue = [];

function tryPair() {
  while (tunnelQueue.length && clientQueue.length) {
    const tunnel = tunnelQueue.shift();
    const client = clientQueue.shift();

    tunnel.pipe(client);
    client.pipe(tunnel);

    tunnel.on('error', () => client.destroy());
    client.on('error', () => tunnel.destroy());
    tunnel.on('close', () => client.destroy());
    client.on('close', () => tunnel.destroy());

    console.log('[pair] Paired tunnel with client');
  }
}

net.createServer(sock => {
  console.log('[tunnel] New tunnel slot ready');
  tunnelQueue.push(sock);

  sock.on('close', () => {
    const i = tunnelQueue.indexOf(sock);
    if (i !== -1) tunnelQueue.splice(i, 1);
  });

  sock.on('error', () => {
    const i = tunnelQueue.indexOf(sock);
    if (i !== -1) tunnelQueue.splice(i, 1);
  });

  tryPair();
}).listen(TUNNEL_PORT, () => console.log(`[tunnel] Waiting on port ${TUNNEL_PORT}`));

net.createServer(sock => {
  console.log('[public] Client connected');
  clientQueue.push(sock);

  sock.on('close', () => {
    const i = clientQueue.indexOf(sock);
    if (i !== -1) clientQueue.splice(i, 1);
  });

  sock.on('error', () => {
    const i = clientQueue.indexOf(sock);
    if (i !== -1) clientQueue.splice(i, 1);
  });

  tryPair();
}).listen(PUBLIC_PORT, () => console.log(`[public] Redis available on port ${PUBLIC_PORT}`));
