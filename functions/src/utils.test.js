const functions = require("firebase-functions");

jest.mock('firebase-functions', () => ({
  https: {
    HttpsError: class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    }
  }
}), { virtual: true });

const { requireAuth } = require('./utils');

describe('requireAuth', () => {
  it('should return userId if authenticated', () => {
    const context = { auth: { uid: 'user-123' } };
    expect(requireAuth(context)).toBe('user-123');
  });

  it('should throw unauthenticated error if auth is missing', () => {
    const context = {};
    expect(() => requireAuth(context)).toThrow('You must be logged in.');
    try {
      requireAuth(context);
    } catch (e) {
      expect(e.code).toBe('unauthenticated');
    }
  });

  it('should throw unauthenticated error if uid is missing', () => {
    const context = { auth: {} };
    expect(() => requireAuth(context)).toThrow('You must be logged in.');
    try {
      requireAuth(context);
    } catch (e) {
      expect(e.code).toBe('unauthenticated');
    }
  });
});
