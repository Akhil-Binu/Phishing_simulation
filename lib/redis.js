const { createClient } = require('redis');

let clientPromise;

function getClient() {
  if (!clientPromise) {
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: { connectTimeout: 5000 }
    });
    // A broken connection must not leave getClient() stuck returning a
    // dead promise forever — drop it so the next call reconnects fresh.
    client.on('error', (err) => {
      console.error('Redis client error', err);
      clientPromise = null;
    });
    clientPromise = client.connect().then(() => client).catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

module.exports = { getClient };
