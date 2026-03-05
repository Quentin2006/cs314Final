import request from 'supertest';

/**
 * Creates a test user via the signup endpoint and returns
 * the jwt cookie string for authenticated requests.
 */
export async function createAuthenticatedUser(
  app,
  { email = 'test@example.com', password = 'TestPass123!' } = {}
) {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email, password });

  const cookies = res.headers['set-cookie'];
  const jwtCookie = cookies?.find((c) => c.startsWith('jwt='));

  return {
    cookie: jwtCookie,
    user: res.body.user,
    statusCode: res.statusCode,
  };
}

/**
 * Logs in an existing user and returns the jwt cookie.
 */
export async function loginUser(
  app,
  { email = 'test@example.com', password = 'TestPass123!' } = {}
) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  const cookies = res.headers['set-cookie'];
  const jwtCookie = cookies?.find((c) => c.startsWith('jwt='));

  return {
    cookie: jwtCookie,
    user: res.body.user,
    statusCode: res.statusCode,
  };
}
