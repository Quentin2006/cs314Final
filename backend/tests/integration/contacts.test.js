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

describe('POST /api/contacts/search', () => {
  test('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/contacts/search')
      .send({ searchTerm: 'John' });

    expect(res.status).toBe(401);
  });

  test('returns 400 when searchTerm is missing', async () => {
    const { cookie } = await createAuthenticatedUser(app);

    const res = await request(app)
      .post('/api/contacts/search')
      .set('Cookie', cookie)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Search term is required');
  });

  test('finds users by firstName, lastName, or email', async () => {
    const { cookie } = await createAuthenticatedUser(app, {
      email: 'searcher@test.com',
      password: 'Pass123!',
    });

    // Create another user and set their name
    const { cookie: otherCookie } = await createAuthenticatedUser(app, {
      email: 'john.doe@test.com',
      password: 'Pass123!',
    });
    await request(app)
      .post('/api/auth/update-profile')
      .set('Cookie', otherCookie)
      .send({ firstName: 'John', lastName: 'Doe' });

    const res = await request(app)
      .post('/api/contacts/search')
      .set('Cookie', cookie)
      .send({ searchTerm: 'John' });

    expect(res.status).toBe(200);
    expect(res.body.contacts).toHaveLength(1);
    expect(res.body.contacts[0].firstName).toBe('John');
  });

  test('does not return the requesting user in results', async () => {
    const { cookie } = await createAuthenticatedUser(app, {
      email: 'self@test.com',
      password: 'Pass123!',
    });

    const res = await request(app)
      .post('/api/contacts/search')
      .set('Cookie', cookie)
      .send({ searchTerm: 'self@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.contacts).toHaveLength(0);
  });
});

describe('GET /api/contacts/all-contacts', () => {
  test('returns all users except self as {label, value} pairs', async () => {
    const { cookie } = await createAuthenticatedUser(app, {
      email: 'me@test.com',
      password: 'Pass123!',
    });
    await createAuthenticatedUser(app, {
      email: 'other@test.com',
      password: 'Pass123!',
    });

    const res = await request(app)
      .get('/api/contacts/all-contacts')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.contacts).toHaveLength(1);
    expect(res.body.contacts[0]).toHaveProperty('label');
    expect(res.body.contacts[0]).toHaveProperty('value');
  });
});

describe('GET /api/contacts/get-contacts-for-list', () => {
  test('returns contacts sorted by last message time', async () => {
    const { cookie: cookieA, user: userA } = await createAuthenticatedUser(app, {
      email: 'a@test.com',
      password: 'Pass123!',
    });
    const { user: userB } = await createAuthenticatedUser(app, {
      email: 'b@test.com',
      password: 'Pass123!',
    });

    // Insert a message directly via Mongoose
    const Message = (await import('../../src/models/Message.js')).default;
    await Message.create({
      sender: userA.id,
      recipient: userB.id,
      content: 'Hello B!',
    });

    const res = await request(app)
      .get('/api/contacts/get-contacts-for-list')
      .set('Cookie', cookieA);

    expect(res.status).toBe(200);
    expect(res.body.contacts).toHaveLength(1);
    expect(res.body.contacts[0].email).toBe('b@test.com');
    expect(res.body.contacts[0]).toHaveProperty('lastMessageTime');
  });
});

describe('DELETE /api/contacts/delete-dm/:dmId', () => {
  test('deletes all messages between two users', async () => {
    const { cookie: cookieA, user: userA } = await createAuthenticatedUser(app, {
      email: 'delA@test.com',
      password: 'Pass123!',
    });
    const { user: userB } = await createAuthenticatedUser(app, {
      email: 'delB@test.com',
      password: 'Pass123!',
    });

    // Insert messages
    const Message = (await import('../../src/models/Message.js')).default;
    await Message.create([
      { sender: userA.id, recipient: userB.id, content: 'msg1' },
      { sender: userB.id, recipient: userA.id, content: 'msg2' },
    ]);

    const res = await request(app)
      .delete(`/api/contacts/delete-dm/${userB.id}`)
      .set('Cookie', cookieA);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('DM deleted successfully');

    // Verify messages are gone
    const remaining = await Message.countDocuments({
      $or: [
        { sender: userA.id, recipient: userB.id },
        { sender: userB.id, recipient: userA.id },
      ],
    });
    expect(remaining).toBe(0);
  });
});
