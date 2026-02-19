
const mockBusboy = jest.fn();
jest.mock('busboy', () => mockBusboy);

// Mock Firestore
const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockDoc = jest.fn(() => ({
  get: mockGet,
  update: mockUpdate,
}));
const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  add: jest.fn(),
}));

const mockFirestore = jest.fn(() => ({
  collection: mockCollection,
  batch: jest.fn(() => ({
      set: jest.fn(),
      commit: jest.fn()
  }))
}));
mockFirestore.FieldValue = {
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
  increment: jest.fn((n) => n)
};

const mockStorageBucket = {
    upload: jest.fn().mockResolvedValue([]),
    file: jest.fn(() => ({
        getSignedUrl: jest.fn().mockResolvedValue(['http://mock-url'])
    }))
};

const mockStorage = jest.fn(() => ({
    bucket: jest.fn(() => mockStorageBucket)
}));

const mockVerifyIdToken = jest.fn();

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: mockFirestore,
  storage: mockStorage,
  auth: jest.fn(() => ({
      verifyIdToken: mockVerifyIdToken
  })),
  FieldValue: {
    serverTimestamp: jest.fn(() => 'mock-timestamp'),
    increment: jest.fn((n) => n)
  }
}), { virtual: true });

jest.mock('firebase-functions', () => ({
  https: {
    onRequest: jest.fn((handler) => handler),
  },
  logger: {
      log: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn()
  },
  pubsub: {
      schedule: jest.fn(() => ({
          onRun: jest.fn()
      }))
  }
}), { virtual: true });

jest.mock('path', () => ({
    join: jest.fn((...args) => args.join('/'))
}));
jest.mock('os', () => ({
    tmpdir: jest.fn(() => '/tmp')
}));
jest.mock('fs', () => ({
    createWriteStream: jest.fn(() => ({
        on: jest.fn((event, cb) => {
            if (event === 'finish') cb(); // Auto finish
        }),
        end: jest.fn(),
        write: jest.fn()
    })),
    unlinkSync: jest.fn(),
    existsSync: jest.fn(() => true)
}));

// Mock cors
jest.mock('cors', () => jest.fn(() => (req, res, next) => next()));

const { uploadProof } = require('./automation');

describe('uploadProof', () => {
  let req, res;
  let busboyHandlers = {};

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      method: 'POST',
      headers: {},
      rawBody: Buffer.from('')
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    busboyHandlers = {};

    // Mock busboy instance
    const busboyInstance = {
        on: jest.fn((event, cb) => {
            busboyHandlers[event] = cb;
        }),
        end: jest.fn()
    };
    mockBusboy.mockReturnValue(busboyInstance);
  });

  test('should return 403 if no auth header', async () => {
    req.headers = {};
    await uploadProof(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockBusboy).not.toHaveBeenCalled();
  });

  test('should return 403 if invalid token', async () => {
    req.headers = { authorization: 'Bearer invalid-token' };
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

    await uploadProof(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockBusboy).not.toHaveBeenCalled();
  });

  test('should return 403 if user is not assigned to task', async () => {
    req.headers = { authorization: 'Bearer valid-token' };
    mockVerifyIdToken.mockResolvedValue({ uid: 'user1' });

    await uploadProof(req, res);

    expect(mockBusboy).toHaveBeenCalled();

    // Simulate busboy events
    // 1. Fields
    busboyHandlers['field']('taskId', 'task-123');
    busboyHandlers['field']('itemIndex', '0');
    busboyHandlers['field']('originalFilename', 'proof.jpg');

    // 2. File
    const mockFileStream = {
        pipe: jest.fn(),
        on: jest.fn((event, cb) => {
            if (event === 'end') cb();
        })
    };
    busboyHandlers['file']('file', mockFileStream, { filename: 'proof.jpg', mimeType: 'image/jpeg' });

    // Mock task fetch
    mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
            assignedTo: 'user2', // Different user
            ownerId: 'owner1'
        })
    });

    // 3. Finish
    await busboyHandlers['finish']();

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ error: "You are not authorized to upload proofs for this task." }));
  });

  test('should succeed if user is assigned to task', async () => {
    req.headers = { authorization: 'Bearer valid-token' };
    mockVerifyIdToken.mockResolvedValue({ uid: 'user1' });

    await uploadProof(req, res);

    // Simulate busboy events
    busboyHandlers['field']('taskId', 'task-123');
    busboyHandlers['field']('itemIndex', '0');
    busboyHandlers['field']('originalFilename', 'proof.jpg');

    const mockFileStream = {
        pipe: jest.fn(),
        on: jest.fn((event, cb) => {
            if (event === 'end') cb();
        })
    };
    busboyHandlers['file']('file', mockFileStream, { filename: 'proof.jpg', mimeType: 'image/jpeg' });

    // Mock task fetch
    mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
            assignedTo: 'user1', // Same user
            checklistItems: [{}]
        })
    });

    // Finish
    await busboyHandlers['finish']();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockStorageBucket.upload).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockGet).toHaveBeenCalledTimes(2); // Initial check + re-fetch before update
  });
});
