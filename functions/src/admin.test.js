const mockCreateCustomToken = jest.fn();
const mockAuth = jest.fn(() => ({
  createCustomToken: mockCreateCustomToken,
}));

const mockFirestore = jest.fn(() => ({
  collection: jest.fn(),
}));

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: mockFirestore,
  auth: mockAuth,
}), { virtual: true });

jest.mock('firebase-functions', () => ({
  https: {
    onCall: jest.fn((handler) => handler),
    HttpsError: class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    }
  },
  logger: {
    log: jest.fn(),
    error: jest.fn(),
  }
}), { virtual: true });

const { createImpersonationToken } = require('./admin');

describe('createImpersonationToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw permission-denied if user is not authenticated', async () => {
    const data = { uid: 'test-uid' };
    const context = { auth: null };

    await expect(createImpersonationToken(data, context)).rejects.toMatchObject({
      code: 'permission-denied',
      message: 'This function can only be called by a super admin.'
    });
  });

  it('should throw permission-denied if user is not a super admin', async () => {
    const data = { uid: 'test-uid' };
    const context = { auth: { token: { superAdmin: false } } };

    await expect(createImpersonationToken(data, context)).rejects.toMatchObject({
      code: 'permission-denied',
      message: 'This function can only be called by a super admin.'
    });
  });

  it('should throw invalid-argument if uid is missing', async () => {
    const data = {};
    const context = { auth: { token: { superAdmin: true } } };

    await expect(createImpersonationToken(data, context)).rejects.toMatchObject({
      code: 'invalid-argument',
      message: "The function must be called with a 'uid' argument."
    });
  });

  it('should return a custom token if called by super admin with valid uid', async () => {
    const data = { uid: 'test-uid' };
    const context = { auth: { token: { superAdmin: true } } };
    const expectedToken = 'mock-custom-token';

    mockCreateCustomToken.mockResolvedValue(expectedToken);

    const result = await createImpersonationToken(data, context);

    expect(result).toEqual({ token: expectedToken });
    expect(mockCreateCustomToken).toHaveBeenCalledWith('test-uid');
  });

  it('should throw internal error if createCustomToken fails', async () => {
    const data = { uid: 'test-uid' };
    const context = { auth: { token: { superAdmin: true } } };

    mockCreateCustomToken.mockRejectedValue(new Error('Auth error'));

    await expect(createImpersonationToken(data, context)).rejects.toMatchObject({
      code: 'internal',
      message: 'An internal error occurred.'
    });
  });
});
