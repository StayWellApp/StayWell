
const mockUpdate = jest.fn();
const mockGet = jest.fn();
const mockDoc = jest.fn(() => ({
  get: mockGet,
  update: mockUpdate,
}));
const mockCollection = jest.fn(() => ({
  doc: mockDoc,
}));

const mockFirestore = jest.fn(() => ({
  collection: mockCollection,
}));
mockFirestore.FieldValue = {
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
  increment: jest.fn((n) => n)
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
  }
}), { virtual: true });

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: mockFirestore,
  FieldValue: {
    serverTimestamp: jest.fn(() => 'mock-timestamp'),
    increment: jest.fn((n) => n)
  }
}), { virtual: true });

// We must require tasks AFTER mocking because it uses them at the top level
const { respondToTaskOffer } = require('./tasks');

describe('respondToTaskOffer', () => {
  const taskId = 'test-task-id';
  const userId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw unauthenticated error if user is not logged in', async () => {
    const data = { taskId, response: 'accepted' };
    const context = { auth: null };

    await expect(respondToTaskOffer(data, context)).rejects.toMatchObject({
        code: 'unauthenticated',
        message: 'You must be logged in.'
    });
  });

  it('should throw not-found error if task does not exist', async () => {
    const data = { taskId, response: 'accepted' };
    const context = { auth: { uid: userId } };

    mockGet.mockResolvedValue({ exists: false });

    await expect(respondToTaskOffer(data, context)).rejects.toMatchObject({
        code: 'not-found',
        message: 'Task not found.'
    });
  });

  it('should throw permission-denied error if user is not authorized', async () => {
    const data = { taskId, response: 'accepted' };
    const context = { auth: { uid: 'wrong-user' } };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        assignmentStatus: 'PendingPrimary',
        primaryAssignee: userId,
        fallbackAssignee: 'fallback-user'
      })
    });

    await expect(respondToTaskOffer(data, context)).rejects.toMatchObject({
        code: 'permission-denied',
        message: 'You are not authorized to respond to this offer.'
    });
  });

  it('should throw invalid-argument error if response is invalid', async () => {
    const data = { taskId, response: 'maybe' };
    const context = { auth: { uid: userId } };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        assignmentStatus: 'PendingPrimary',
        primaryAssignee: userId
      })
    });

    await expect(respondToTaskOffer(data, context)).rejects.toMatchObject({
        code: 'invalid-argument',
        message: 'Response must be "accepted" or "rejected".'
    });
  });

  it('should successfully accept a task', async () => {
    const data = { taskId, response: 'accepted' };
    const context = { auth: { uid: userId } };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        assignmentStatus: 'PendingPrimary',
        primaryAssignee: userId
      })
    });
    mockUpdate.mockResolvedValue({ success: true });

    const result = await respondToTaskOffer(data, context);

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'Pending',
      assignmentStatus: 'Accepted',
      assignedTo: userId,
    });
  });

  it('should successfully reject a task as primary assignee with fallback', async () => {
    const data = { taskId, response: 'rejected' };
    const context = { auth: { uid: userId } };
    const fallbackUserId = 'fallback-user';

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        assignmentStatus: 'PendingPrimary',
        primaryAssignee: userId,
        fallbackAssignee: fallbackUserId
      })
    });
    mockUpdate.mockResolvedValue({ success: true });

    const result = await respondToTaskOffer(data, context);

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenNthCalledWith(1, { rejectionCount: 1 });
    expect(mockUpdate).toHaveBeenNthCalledWith(2, { assignmentStatus: 'PendingFallback' });
  });

  it('should successfully reject a task as primary assignee without fallback', async () => {
    const data = { taskId, response: 'rejected' };
    const context = { auth: { uid: userId } };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        assignmentStatus: 'PendingPrimary',
        primaryAssignee: userId,
        // no fallbackAssignee
      })
    });
    mockUpdate.mockResolvedValue({ success: true });

    const result = await respondToTaskOffer(data, context);

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenNthCalledWith(1, { rejectionCount: 1 });
    expect(mockUpdate).toHaveBeenNthCalledWith(2, { status: 'Unassigned', assignmentStatus: 'Rejected' });
  });

  it('should successfully reject a task as fallback assignee', async () => {
    const data = { taskId, response: 'rejected' };
    const fallbackUserId = 'fallback-user';
    const context = { auth: { uid: fallbackUserId } };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        assignmentStatus: 'PendingFallback',
        primaryAssignee: userId,
        fallbackAssignee: fallbackUserId
      })
    });
    mockUpdate.mockResolvedValue({ success: true });

    const result = await respondToTaskOffer(data, context);

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenNthCalledWith(1, { rejectionCount: 1 });
    expect(mockUpdate).toHaveBeenNthCalledWith(2, { status: 'Unassigned', assignmentStatus: 'Rejected' });
  });
});
