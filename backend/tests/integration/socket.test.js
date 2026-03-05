import { createServer } from 'http';
import { io as ioClient } from 'socket.io-client';
import request from 'supertest';
import { getApp } from '../helpers/app.js';
import { setupSocket } from '../../src/socket/socket.js';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/db.js';
import { createAuthenticatedUser } from '../helpers/auth.js';

let app, httpServer, io, serverUrl;

beforeAll(async () => {
  await connectTestDB();
  app = getApp();
  httpServer = createServer(app);
  io = setupSocket(httpServer);

  await new Promise((resolve) => {
    httpServer.listen(0, () => {
      const port = httpServer.address().port;
      serverUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  io.close();
  await new Promise((resolve) => httpServer.close(resolve));
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

function connectSocket(cookieStr) {
  return ioClient(serverUrl, {
    extraHeaders: {
      cookie: cookieStr,
    },
    transports: ['websocket'],
    forceNew: true,
  });
}

describe('Socket.IO', () => {
  test('rejects connection when no JWT cookie is provided', (done) => {
    const socket = ioClient(serverUrl, {
      transports: ['websocket'],
      forceNew: true,
    });

    socket.on('connect_error', (err) => {
      expect(err.message).toMatch(/No cookies found|Authentication error/);
      socket.close();
      done();
    });

    socket.on('connect', () => {
      socket.close();
      done(new Error('Should not have connected'));
    });
  });

  test('rejects connection when JWT cookie is invalid', (done) => {
    const socket = ioClient(serverUrl, {
      extraHeaders: {
        cookie: 'jwt=invalid-token',
      },
      transports: ['websocket'],
      forceNew: true,
    });

    socket.on('connect_error', (err) => {
      expect(err.message).toMatch(/Authentication error/);
      socket.close();
      done();
    });

    socket.on('connect', () => {
      socket.close();
      done(new Error('Should not have connected'));
    });
  });

  test('accepts connection with valid JWT cookie', async () => {
    const { cookie } = await createAuthenticatedUser(app, {
      email: 'socket@test.com',
      password: 'Pass123!',
    });

    const socket = connectSocket(cookie);

    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        socket.close();
        resolve();
      });
      socket.on('connect_error', (err) => {
        socket.close();
        reject(new Error('Connection failed: ' + err.message));
      });
    });
  });

  test('sendMessage creates message and emits receiveMessage to sender', async () => {
    const { cookie: cookieA, user: userA } = await createAuthenticatedUser(app, {
      email: 'senderSock@test.com',
      password: 'Pass123!',
    });
    const { user: userB } = await createAuthenticatedUser(app, {
      email: 'recipSock@test.com',
      password: 'Pass123!',
    });

    const socketA = connectSocket(cookieA);

    await new Promise((resolve, reject) => {
      socketA.on('connect', () => resolve());
      socketA.on('connect_error', (err) => reject(err));
    });

    const received = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for receiveMessage'));
      }, 5000);

      socketA.on('receiveMessage', (msg) => {
        clearTimeout(timeout);
        resolve(msg);
      });

      socketA.emit('sendMessage', {
        sender: userA.id,
        recipient: userB.id,
        content: 'Hello from socket test!',
        messageType: 'text',
      });
    });

    expect(received.content).toBe('Hello from socket test!');
    expect(received.sender.email).toBe('senderSock@test.com');
    expect(received.recipient.email).toBe('recipSock@test.com');
    expect(received._id).toBeDefined();
    expect(received.createdAt).toBeDefined();

    socketA.close();
  });

  test('sendMessage delivers to recipient when both are connected', async () => {
    const { cookie: cookieA, user: userA } = await createAuthenticatedUser(app, {
      email: 'bothA@test.com',
      password: 'Pass123!',
    });
    const { cookie: cookieB, user: userB } = await createAuthenticatedUser(app, {
      email: 'bothB@test.com',
      password: 'Pass123!',
    });

    const socketA = connectSocket(cookieA);
    const socketB = connectSocket(cookieB);

    // Wait for both to connect
    await Promise.all([
      new Promise((resolve, reject) => {
        socketA.on('connect', resolve);
        socketA.on('connect_error', reject);
      }),
      new Promise((resolve, reject) => {
        socketB.on('connect', resolve);
        socketB.on('connect_error', reject);
      }),
    ]);

    // Listen on recipient
    const recipientReceived = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for receiveMessage on recipient'));
      }, 5000);

      socketB.on('receiveMessage', (msg) => {
        clearTimeout(timeout);
        resolve(msg);
      });
    });

    // Sender sends
    socketA.emit('sendMessage', {
      sender: userA.id,
      recipient: userB.id,
      content: 'Message for B!',
      messageType: 'text',
    });

    const msg = await recipientReceived;
    expect(msg.content).toBe('Message for B!');
    expect(msg.sender.email).toBe('bothA@test.com');

    socketA.close();
    socketB.close();
  });
});
