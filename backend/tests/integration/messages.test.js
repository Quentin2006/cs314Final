import request from 'supertest';
import { getApp } from '../helpers/app.js';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/db.js';
import { createAuthenticatedUser } from '../helpers/auth.js';

let app;

beforeAll(async () => {
  await connectTestDB();
  app = getApp();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe('POST /api/messages/get-messages', () => {
  test('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/messages/get-messages')
      .send({ id: 'some-id' });

    expect(res.status).toBe(401);
  });

  test('returns messages between two users sorted ascending', async () => {
    const { cookie: cookieA, user: userA } = await createAuthenticatedUser(app, {
      email: 'msgA@test.com',
      password: 'Pass123!',
    });
    const { user: userB } = await createAuthenticatedUser(app, {
      email: 'msgB@test.com',
      password: 'Pass123!',
    });

    // Insert messages sequentially so createdAt timestamps are distinct
    const Message = (await import('../../src/models/Message.js')).default;
    await Message.create({ sender: userA.id, recipient: userB.id, content: 'First' });
    await Message.create({ sender: userB.id, recipient: userA.id, content: 'Second' });
    await Message.create({ sender: userA.id, recipient: userB.id, content: 'Third' });

    const res = await request(app)
      .post('/api/messages/get-messages')
      .set('Cookie', cookieA)
      .send({ id: userB.id });

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(3);
    expect(res.body.messages[0].content).toBe('First');
    expect(res.body.messages[2].content).toBe('Third');
  });

  test('returns 400 when contact id is missing', async () => {
    const { cookie } = await createAuthenticatedUser(app);

    const res = await request(app)
      .post('/api/messages/get-messages')
      .set('Cookie', cookie)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Missing one or both user IDs');
  });
});
