
const mockCreateCustomToken = jest.fn();
const mockGetUser = jest.fn();

const mockAuth = jest.fn(() => ({
  createCustomToken: mockCreateCustomToken,
  getUser: mockGetUser,
  createUser: jest.fn(),
}));

const mockFirestore = jest.fn(() => ({
  collection: jest.fn(() => ({
    add: jest.fn(),
    doc: jest.fn(() => ({
      set: jest.fn(),
    })),
  })),
}));
mockFirestore.FieldValue = {
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
};

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

// We must require admin AFTER mocking
const { createReauthenticationToken } = require('./admin');

describe('createReauthenticationToken', () => {
  const adminUid = 'admin-user-id';
  const attackerUid = 'attacker-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw unauthenticated error if user is not logged in', async () => {
    const data = { adminUid };
    const context = { auth: null };

    await expect(createReauthenticationToken(data, context)).rejects.toMatchObject({
        code: 'unauthenticated',
        message: 'User must be authenticated.'
    });
  });

  it('should fail if attacker requests token for super admin (VULNERABILITY FIX)', async () => {
    const data = { adminUid };
    const context = { auth: { uid: attackerUid, token: { superAdmin: false } } };

    // Even if attacker tries, it should fail before getting user
    await expect(createReauthenticationToken(data, context)).rejects.toMatchObject({
        code: 'permission-denied',
        message: 'You can only request a reauthentication token for yourself.'
    });

    // Ensure we didn't fetch user or create token
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockCreateCustomToken).not.toHaveBeenCalled();
  });

  it('should succeed if super admin requests token for themselves', async () => {
    const data = { adminUid };
    const context = { auth: { uid: adminUid, token: { superAdmin: true } } };

    mockGetUser.mockResolvedValue({
      uid: adminUid,
      customClaims: { superAdmin: true }
    });
    mockCreateCustomToken.mockResolvedValue('mock-custom-token');

    const result = await createReauthenticationToken(data, context);
    expect(result).toEqual({ token: 'mock-custom-token' });

    expect(mockGetUser).toHaveBeenCalledWith(adminUid);
    expect(mockCreateCustomToken).toHaveBeenCalledWith(adminUid);
  });

  it('should fail if target user is not a super admin', async () => {
    const regularUserId = 'regular-user-id';
    const data = { adminUid: regularUserId };
    // Assuming context uid matches target for this test case, otherwise the first check would fail
    const context = { auth: { uid: regularUserId } };

    mockGetUser.mockResolvedValue({
      uid: regularUserId,
      customClaims: {}
    });

    // The current implementation masks permission-denied as not-found in catch block
    // We expect not-found because the permission check throws inside try block
    await expect(createReauthenticationToken(data, context)).rejects.toMatchObject({
        code: 'not-found',
        message: 'The specified admin user does not exist.'
    });
  });
});
