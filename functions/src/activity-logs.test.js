
const mockAdd = jest.fn();
const mockCollection = jest.fn();

// We need to return an object that has .doc().collection().add() structure for createActivityLog
// db.collection("users").doc(clientId).collection("activity_logs").add(...)

const mockActivityLogsCollection = {
    add: mockAdd
};
const mockUserDoc = {
    collection: jest.fn((name) => {
        if (name === 'activity_logs') return mockActivityLogsCollection;
        return { add: jest.fn() };
    })
};
mockCollection.mockImplementation((name) => {
    if (name === 'users') {
        return {
            doc: jest.fn(() => mockUserDoc)
        };
    }
    return {
        doc: jest.fn(() => ({ collection: jest.fn(() => ({ add: jest.fn() })) }))
    };
});

const mockDb = {
  collection: mockCollection,
};

const mockFirestore = jest.fn(() => mockDb);
mockFirestore.FieldValue = {
  serverTimestamp: jest.fn(() => 'mock-timestamp')
};

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: mockFirestore
}), { virtual: true });

jest.mock('firebase-functions', () => ({
  firestore: {
    document: jest.fn(() => ({
      onDelete: jest.fn((handler) => handler),
      onCreate: jest.fn((handler) => handler),
      onUpdate: jest.fn((handler) => handler),
    }))
  }
}), { virtual: true });

// Require the file under test
const activityLogs = require('./activity-logs');

describe('logPropertyDeletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log property deletion when ownerId exists', async () => {
    const snap = {
      data: () => ({
        ownerId: 'owner-123',
        propertyName: 'Test Property'
      })
    };
    const context = {};

    await activityLogs.logPropertyDeletion(snap, context);

    expect(mockCollection).toHaveBeenCalledWith('users');
    expect(mockUserDoc.collection).toHaveBeenCalledWith('activity_logs');
    expect(mockAdd).toHaveBeenCalledWith({
        timestamp: 'mock-timestamp',
        type: 'PROPERTY_DELETED',
        description: 'Property deleted: "Test Property".',
        performedBy: 'owner-123',
    });
  });

  it('should not log property deletion when ownerId is missing', async () => {
    const snap = {
      data: () => ({
        propertyName: 'Orphan Property'
        // No ownerId
      })
    };
    const context = {};

    await activityLogs.logPropertyDeletion(snap, context);

    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('should handle unnamed property correctly', async () => {
     const snap = {
      data: () => ({
        ownerId: 'owner-456',
        // No propertyName
      })
    };
    const context = {};

    await activityLogs.logPropertyDeletion(snap, context);

    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
        description: 'Property deleted: "Unnamed Property".'
    }));
  });
});
