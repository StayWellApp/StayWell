const mockAdd = jest.fn();
const mockSet = jest.fn();
const mockDoc = jest.fn(() => ({
  set: mockSet,
}));
const mockCollection = jest.fn(() => ({
  add: mockAdd,
  doc: mockDoc,
}));

const mockFirestore = jest.fn(() => ({
  collection: mockCollection,
}));
mockFirestore.FieldValue = {
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
};

const mockCreateCustomToken = jest.fn();
const mockCreateUser = jest.fn();
const mockGetUser = jest.fn();

const mockAuth = jest.fn(() => ({
  createCustomToken: mockCreateCustomToken,
  createUser: mockCreateUser,
  getUser: mockGetUser,
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

// We must require admin AFTER mocking
const { createImpersonationToken, logAdminAction, createClient, createReauthenticationToken } = require('./admin');

describe('admin functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createImpersonationToken', () => {
    it('should throw permission-denied if not super admin', async () => {
      const context = { auth: { token: { superAdmin: false } } };
      await expect(createImpersonationToken({}, context)).rejects.toMatchObject({
        code: 'permission-denied'
      });
    });

    it('should throw permission-denied if unauthenticated', async () => {
      const context = {};
      await expect(createImpersonationToken({}, context)).rejects.toMatchObject({
        code: 'permission-denied'
      });
    });

    it('should return token if super admin', async () => {
      const context = { auth: { token: { superAdmin: true } } };
      const data = { uid: 'user123' };
      mockCreateCustomToken.mockResolvedValue('custom-token');

      const result = await createImpersonationToken(data, context);
      expect(result).toEqual({ token: 'custom-token' });
      expect(mockCreateCustomToken).toHaveBeenCalledWith('user123');
    });
  });

  describe('logAdminAction', () => {
    it('should throw permission-denied if not super admin', async () => {
      const context = { auth: { token: { superAdmin: false } } };
      await expect(logAdminAction({}, context)).rejects.toMatchObject({
        code: 'permission-denied'
      });
    });

    it('should log action if super admin', async () => {
      const context = { auth: { token: { superAdmin: true, email: 'admin@test.com' } } };
      const data = { message: 'test action' };

      const result = await logAdminAction(data, context);
      expect(result).toEqual({ success: true });
      expect(mockCollection).toHaveBeenCalledWith('auditLog');
      expect(mockAdd).toHaveBeenCalledWith({
        timestamp: 'mock-timestamp',
        adminEmail: 'admin@test.com',
        action: 'test action',
      });
    });
  });

  describe('createClient', () => {
    it('should throw permission-denied if not super admin', async () => {
      const context = { auth: { token: { superAdmin: false } } };
      await expect(createClient({}, context)).rejects.toMatchObject({
        code: 'permission-denied'
      });
    });

    it('should create client if super admin', async () => {
      const context = { auth: { token: { superAdmin: true } } };
      const data = { companyName: 'Test Co', email: 'test@co.com', plan: 'basic' };
      mockCreateUser.mockResolvedValue({ uid: 'new-user-id' });

      const result = await createClient(data, context);
      expect(result).toEqual({ success: true, uid: 'new-user-id' });
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'test@co.com',
        emailVerified: false,
        displayName: 'Test Co',
      });
      expect(mockCollection).toHaveBeenCalledWith('users');
      expect(mockDoc).toHaveBeenCalledWith('new-user-id');
      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        companyName: 'Test Co',
        email: 'test@co.com',
        role: 'owner',
      }));
    });
  });

  describe('createReauthenticationToken', () => {
    it('should throw unauthenticated if no auth context', async () => {
      const context = {};
      await expect(createReauthenticationToken({}, context)).rejects.toMatchObject({
        code: 'unauthenticated'
      });
    });

    it('should return token if authenticated and target is super admin', async () => {
      const context = { auth: { uid: 'caller-id' } };
      const data = { adminUid: 'admin-id' };
      mockGetUser.mockResolvedValue({ customClaims: { superAdmin: true } });
      mockCreateCustomToken.mockResolvedValue('reauth-token');

      const result = await createReauthenticationToken(data, context);
      expect(result).toEqual({ token: 'reauth-token' });
      expect(mockGetUser).toHaveBeenCalledWith('admin-id');
      expect(mockCreateCustomToken).toHaveBeenCalledWith('admin-id');
    });

     it('should throw permission-denied (masked as not-found due to catch block) if target is not super admin', async () => {
      const context = { auth: { uid: 'caller-id' } };
      const data = { adminUid: 'regular-user-id' };
      mockGetUser.mockResolvedValue({ customClaims: {} });

      // Note: The current implementation catches the permission-denied error and re-throws it as not-found.
      // This is likely a bug in the original code, but we preserve it for now to match behavior.
      await expect(createReauthenticationToken(data, context)).rejects.toMatchObject({
        code: 'not-found'
      });
    });
  });
});
