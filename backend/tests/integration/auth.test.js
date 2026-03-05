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

describe('POST /api/auth/signup', () => {
  test('creates a new user and returns 201 with jwt cookie', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'new@test.com', password: 'Password123!' });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      email: 'new@test.com',
      firstName: '',
      lastName: '',
      profileSetup: false,
    });
    expect(res.body.user.id).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith('jwt='))).toBe(true);
  });

  test('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ password: 'Password123!' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Missing email or password');
  });

  test('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Missing email or password');
  });

  test('returns 409 when email already exists', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dup@test.com', password: 'Password123!' });

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dup@test.com', password: 'Password123!' });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('The email is already in use');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'login@test.com', password: 'Password123!' });
  });

  test('logs in an existing user and returns 200 with jwt cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: 'login@test.com',
      profileSetup: false,
    });
    const cookies = res.headers['set-cookie'];
    expect(cookies.some((c) => c.startsWith('jwt='))).toBe(true);
  });

  test('returns 404 when email does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'Password123!' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('No user found with the given email');
  });

  test('returns 400 when password is wrong', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'WrongPass!' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid password');
  });

  test('returns 400 when email or password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Missing email or password');
  });
});

describe('POST /api/auth/logout', () => {
  test('clears the jwt cookie and returns 200', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out');
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.includes('jwt='))).toBe(true);
  });
});

describe('GET /api/auth/userinfo', () => {
  test('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/auth/userinfo');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Not authenticated');
  });

  test('returns user info for authenticated user', async () => {
    const { cookie } = await createAuthenticatedUser(app, {
      email: 'info@test.com',
      password: 'Password123!',
    });

    const res = await request(app)
      .get('/api/auth/userinfo')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      email: 'info@test.com',
      firstName: '',
      lastName: '',
      profileSetup: false,
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.password).toBeUndefined();
  });
});

describe('POST /api/auth/update-profile', () => {
  test('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/auth/update-profile')
      .send({ firstName: 'John', lastName: 'Doe' });

    expect(res.status).toBe(401);
  });

  test('updates profile and sets profileSetup to true', async () => {
    const { cookie } = await createAuthenticatedUser(app, {
      email: 'profile@test.com',
      password: 'Password123!',
    });

    const res = await request(app)
      .post('/api/auth/update-profile')
      .set('Cookie', cookie)
      .send({ firstName: 'John', lastName: 'Doe', color: '#ff0000' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      email: 'profile@test.com',
      firstName: 'John',
      lastName: 'Doe',
      color: '#ff0000',
      profileSetup: true,
    });
  });

  test('returns 400 when firstName or lastName is missing', async () => {
    const { cookie } = await createAuthenticatedUser(app, {
      email: 'profile2@test.com',
      password: 'Password123!',
    });

    const res = await request(app)
      .post('/api/auth/update-profile')
      .set('Cookie', cookie)
      .send({ firstName: 'John' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('First name and last name are required');
  });
});
