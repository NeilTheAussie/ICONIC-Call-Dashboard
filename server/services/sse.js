// Server-Sent Events manager
const clients = new Map(); // userId -> response

function addClient(userId, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write('\n');

  clients.set(userId, res);

  // Send heartbeat every 30s
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  res.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(userId);
  });
}

function broadcast(event, data, excludeUserId) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [userId, res] of clients) {
    if (userId !== excludeUserId) {
      res.write(msg);
    }
  }
}

function sendToUser(userId, event, data) {
  const res = clients.get(userId);
  if (res) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

function getConnectedCount() {
  return clients.size;
}

module.exports = { addClient, broadcast, sendToUser, getConnectedCount };
