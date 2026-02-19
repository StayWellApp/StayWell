
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

const mockLoggerLog = jest.fn();
const mockLoggerError = jest.fn();

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
    log: mockLoggerLog,
    error: mockLoggerError,
  }
}), { virtual: true });

const mockAuthCreateUser = jest.fn();
const mockAuthGetUser = jest.fn();
const mockAuthCreateCustomToken = jest.fn();

jest.mock('firebase-admin', () => {
    const originalAdmin = jest.requireActual('firebase-admin');
    return {
        ...originalAdmin,
        initializeApp: jest.fn(),
        firestore: Object.assign(mockFirestore, {
            FieldValue: {
                serverTimestamp: jest.fn(() => 'mock-timestamp'),
            }
        }),
        auth: jest.fn(() => ({
            createUser: mockAuthCreateUser,
            getUser: mockAuthGetUser,
            createCustomToken: mockAuthCreateCustomToken,
        })),
    };
}, { virtual: true });


const { createClient } = require('./admin');

describe('createClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log without PII when sending welcome email', async () => {
    const data = {
      companyName: 'Test Company',
      email: 'test@example.com',
      plan: 'basic',
    };
    const context = {
      auth: {
        token: {
          superAdmin: true,
        }
      }
    };

    mockAuthCreateUser.mockResolvedValue({ uid: 'new-user-id' });
    mockSet.mockResolvedValue({});

    await createClient(data, context);

    // Verify PII is NOT logged
    expect(mockLoggerLog).not.toHaveBeenCalledWith(expect.stringContaining('test@example.com'));
    // Verify safe message IS logged
    expect(mockLoggerLog).toHaveBeenCalledWith(expect.stringContaining('Sending welcome email to company Test Company'));
  });
});
