
const mockCreateUser = jest.fn();
const mockSet = jest.fn();
const mockDoc = jest.fn(() => ({
  set: mockSet,
}));
const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  add: jest.fn(), // for logAdminAction
}));

const mockFirestore = jest.fn(() => ({
  collection: mockCollection,
}));
mockFirestore.FieldValue = {
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
};

const mockAuth = jest.fn(() => ({
  createUser: mockCreateUser,
  createCustomToken: jest.fn(),
  getUser: jest.fn(),
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

// Require the module after mocking
const { createClient } = require('./admin');

describe('createClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw permission-denied if user is not a super admin', async () => {
    const data = { companyName: 'Acme', email: 'test@acme.com', plan: 'pro' };
    const context = { auth: { token: { superAdmin: false } } };

    await expect(createClient(data, context)).rejects.toMatchObject({
      code: 'permission-denied',
      message: 'This function can only be called by a super admin.'
    });
  });

  it('should throw permission-denied if user is unauthenticated', async () => {
    const data = { companyName: 'Acme', email: 'test@acme.com', plan: 'pro' };
    const context = { auth: null }; // Unauthenticated

    await expect(createClient(data, context)).rejects.toMatchObject({
      code: 'permission-denied',
      message: 'This function can only be called by a super admin.'
    });
  });

  it('should throw invalid-argument if required fields are missing', async () => {
    const context = { auth: { token: { superAdmin: true } } };

    // Missing companyName
    await expect(createClient({ email: 'test@acme.com', plan: 'pro' }, context))
      .rejects.toMatchObject({
        code: 'invalid-argument',
        message: 'Missing required fields.'
      });

    // Missing email
    await expect(createClient({ companyName: 'Acme', plan: 'pro' }, context))
      .rejects.toMatchObject({
        code: 'invalid-argument',
        message: 'Missing required fields.'
      });

    // Missing plan
    await expect(createClient({ companyName: 'Acme', email: 'test@acme.com' }, context))
      .rejects.toMatchObject({
        code: 'invalid-argument',
        message: 'Missing required fields.'
      });
  });

  it('should successfully create a client', async () => {
    const data = {
      companyName: 'Acme',
      email: 'test@acme.com',
      plan: 'pro',
      planExpiration: '2025-12-31'
    };
    const context = { auth: { token: { superAdmin: true } } };
    const mockUserRecord = { uid: 'new-user-uid' };

    mockCreateUser.mockResolvedValue(mockUserRecord);
    mockSet.mockResolvedValue({ success: true });

    const result = await createClient(data, context);

    expect(result).toEqual({ success: true, uid: 'new-user-uid' });

    expect(mockCreateUser).toHaveBeenCalledWith({
      email: data.email,
      emailVerified: false,
      displayName: data.companyName,
    });

    expect(mockCollection).toHaveBeenCalledWith('users');
    expect(mockDoc).toHaveBeenCalledWith('new-user-uid');

    // Check if set was called with correct data
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
      companyName: 'Acme',
      email: 'test@acme.com',
      role: 'owner',
      subscription: expect.objectContaining({
        plan: 'pro',
        status: 'active',
      })
    }));
  });

  it('should handle internal errors gracefully', async () => {
    const data = { companyName: 'Acme', email: 'test@acme.com', plan: 'pro' };
    const context = { auth: { token: { superAdmin: true } } };

    mockCreateUser.mockRejectedValue(new Error('Auth error'));

    await expect(createClient(data, context)).rejects.toMatchObject({
      code: 'internal',
      message: 'An internal error occurred.'
    });
  });
});
