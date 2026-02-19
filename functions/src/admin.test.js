const mockSet = jest.fn();
const mockDoc = jest.fn(() => ({
  set: mockSet,
}));
const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  add: jest.fn(),
}));

const mockFirestore = jest.fn(() => ({
  collection: mockCollection,
}));
mockFirestore.FieldValue = {
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
};

const mockCreateUser = jest.fn();
const mockAuth = jest.fn(() => ({
  createUser: mockCreateUser,
  createCustomToken: jest.fn(),
  getUser: jest.fn(),
}));

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

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: mockFirestore,
  auth: mockAuth,
}), { virtual: true });

const { createClient } = require('./admin');

describe('createClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw permission-denied if user is not authenticated', async () => {
    const context = {};
    await expect(createClient({}, context)).rejects.toMatchObject({
      code: 'permission-denied',
      message: 'This function can only be called by a super admin.'
    });
  });

  it('should throw permission-denied if user is not a super admin', async () => {
    const context = { auth: { token: { superAdmin: false } } };
    await expect(createClient({}, context)).rejects.toMatchObject({
      code: 'permission-denied',
      message: 'This function can only be called by a super admin.'
    });
  });

  it('should throw invalid-argument if required fields are missing', async () => {
    const context = { auth: { token: { superAdmin: true } } };
    const data = { companyName: 'Acme' }; // Missing email and plan
    await expect(createClient(data, context)).rejects.toMatchObject({
      code: 'invalid-argument',
      message: 'Missing required fields.'
    });
  });

  it('should successfully create a client', async () => {
    const context = { auth: { token: { superAdmin: true } } };
    const data = {
      companyName: 'Acme Inc',
      email: 'admin@acme.com',
      plan: 'pro',
      planExpiration: '2025-01-01'
    };

    mockCreateUser.mockResolvedValue({ uid: 'new-user-id' });
    mockSet.mockResolvedValue({});

    const result = await createClient(data, context);

    expect(mockCreateUser).toHaveBeenCalledWith({
      email: data.email,
      emailVerified: false,
      displayName: data.companyName,
    });

    expect(mockCollection).toHaveBeenCalledWith('users');
    expect(mockDoc).toHaveBeenCalledWith('new-user-id');
    expect(mockSet).toHaveBeenCalledWith({
      companyName: data.companyName,
      email: data.email,
      role: 'owner',
      createdAt: 'mock-timestamp',
      subscription: {
        plan: data.plan,
        status: 'active',
        expiresAt: new Date(data.planExpiration),
      },
    });

    expect(result).toEqual({ success: true, uid: 'new-user-id' });
  });

  it('should handle internal errors', async () => {
    const context = { auth: { token: { superAdmin: true } } };
    const data = {
      companyName: 'Acme Inc',
      email: 'admin@acme.com',
      plan: 'pro',
    };

    mockCreateUser.mockRejectedValue(new Error('Firebase Auth Error'));

    await expect(createClient(data, context)).rejects.toMatchObject({
      code: 'internal',
      message: 'An internal error occurred.'
    });
  });
});
