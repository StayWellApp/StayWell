const mockAdd = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn();

const mockFirestore = jest.fn(() => ({
  collection: mockCollection,
}));

// Setup chain: db.collection().doc().collection().add()
// We need to support:
// db.collection("users").doc(userId).collection("activity_logs").add(...)

mockCollection.mockReturnValue({
  doc: mockDoc,
  add: mockAdd, // For direct adds to collections if any
});

mockDoc.mockReturnValue({
  collection: mockCollection,
  // potentially other methods like set, update, delete if needed by other functions in the future
});

mockFirestore.FieldValue = {
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
};

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: mockFirestore,
}), { virtual: true });

jest.mock('firebase-functions', () => ({
  firestore: {
    document: jest.fn(() => ({
      onCreate: jest.fn((handler) => handler),
      onUpdate: jest.fn((handler) => handler),
      onDelete: jest.fn((handler) => handler),
    }))
  }
}), { virtual: true });

const { logUserCreation } = require('./activity-logs');

describe('logUserCreation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the default return values if they were changed in tests
    mockCollection.mockReturnValue({
        doc: mockDoc,
        add: mockAdd
    });
    mockDoc.mockReturnValue({
        collection: mockCollection
    });
  });

  it('should create activity log when new user is an owner', async () => {
    const userId = 'user-123';
    const snap = {
      data: () => ({ role: 'owner' })
    };
    const context = {
      params: { userId }
    };

    await logUserCreation(snap, context);

    // Verify the path: db.collection("users").doc(userId).collection("activity_logs").add(...)
    expect(mockCollection).toHaveBeenCalledWith('users');
    expect(mockDoc).toHaveBeenCalledWith(userId);
    expect(mockCollection).toHaveBeenCalledWith('activity_logs');

    expect(mockAdd).toHaveBeenCalledWith({
      timestamp: 'mock-timestamp',
      type: 'USER_CREATED',
      description: 'Client account created.',
      performedBy: userId,
    });
  });

  it('should not create activity log when new user is not an owner', async () => {
    const userId = 'user-456';
    const snap = {
      data: () => ({ role: 'staff' })
    };
    const context = {
      params: { userId }
    };

    const result = await logUserCreation(snap, context);

    expect(result).toBeNull();
    expect(mockAdd).not.toHaveBeenCalled();
  });
});
