import jwt from 'jsonwebtoken';
import { verifyToken } from '../../../src/middleware/auth.js';

jest.mock('jsonwebtoken');

describe('verifyToken middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { cookies: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns 401 when no jwt cookie is present', () => {
    req.cookies = {};

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when jwt token is invalid or expired', () => {
    req.cookies = { jwt: 'bad-token' };
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('sets req.userId and calls next() for valid token', () => {
    req.cookies = { jwt: 'valid-token' };
    jwt.verify.mockReturnValue({ userId: 'user-123' });

    verifyToken(req, res, next);

    expect(req.userId).toBe('user-123');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
