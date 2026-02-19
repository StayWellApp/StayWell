
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
const { reviewTask, respondToTaskOffer } = require('./tasks');

describe('reviewTask', () => {
  const taskId = 'test-task-id';
  const propertyManagerId = 'pm-123';
  const userId = 'pm-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw unauthenticated error if user is not logged in', async () => {
    const data = { taskId, approved: true };
    const context = { auth: null };

    await expect(reviewTask(data, context)).rejects.toMatchObject({
        code: 'unauthenticated',
        message: 'You must be logged in.'
    });
  });

  it('should throw not-found error if task does not exist', async () => {
    const data = { taskId, approved: true };
    const context = { auth: { uid: userId } };

    mockGet.mockResolvedValue({ exists: false });

    await expect(reviewTask(data, context)).rejects.toMatchObject({
        code: 'not-found',
        message: 'Task not found.'
    });
  });

  it('should throw permission-denied error if user is not the property manager', async () => {
    const data = { taskId, approved: true };
    const context = { auth: { uid: 'wrong-user' } };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ propertyManagerId: 'pm-123' })
    });

    await expect(reviewTask(data, context)).rejects.toMatchObject({
        code: 'permission-denied',
        message: 'You are not authorized to review this task.'
    });
  });

  it('should successfully approve a task', async () => {
    const data = { taskId, approved: true, comments: 'Good work' };
    const context = { auth: { uid: userId } };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ propertyManagerId: userId })
    });
    mockUpdate.mockResolvedValue({ success: true });

    const result = await reviewTask(data, context);

    expect(result).toEqual({ success: true, newStatus: 'Completed' });
    expect(mockCollection).toHaveBeenCalledWith('tasks');
    expect(mockDoc).toHaveBeenCalledWith(taskId);
    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'Completed',
      inspection: {
        approved: true,
        reviewedBy: userId,
        reviewedAt: 'mock-timestamp',
        comments: 'Good work',
      },
    });
  });

  it('should successfully reject a task with revisions', async () => {
    const data = { taskId, approved: false, comments: 'Fix the leaky faucet' };
    const context = { auth: { uid: userId } };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ propertyManagerId: userId, assignedTo: 'worker-123' })
    });
    mockUpdate.mockResolvedValue({ success: true });

    const result = await reviewTask(data, context);

    expect(result).toEqual({ success: true, newStatus: 'Requires Revisions' });
    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'Requires Revisions',
      inspection: {
        approved: false,
        reviewedBy: userId,
        reviewedAt: 'mock-timestamp',
        comments: 'Fix the leaky faucet',
      },
    });
  });

  it('should use empty string if comments are not provided', async () => {
    const data = { taskId, approved: true }; // no comments
    const context = { auth: { uid: userId } };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ propertyManagerId: userId })
    });
    mockUpdate.mockResolvedValue({ success: true });

    await reviewTask(data, context);

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      inspection: expect.objectContaining({
        comments: '',
      }),
    }));
  });
});

describe('respondToTaskOffer', () => {
  const taskId = 'test-task-id';
  const userId = 'worker-123';
  const admin = require('firebase-admin');

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
    const context = { auth: { uid: 'other-user' } };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        assignmentStatus: 'PendingPrimary',
        primaryAssignee: userId,
        fallbackAssignee: 'fallback-user',
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
        primaryAssignee: userId,
      })
    });

    await expect(respondToTaskOffer(data, context)).rejects.toMatchObject({
        code: 'invalid-argument',
        message: 'Response must be "accepted" or "rejected".'
    });
  });

  it('should successfully accept an offer', async () => {
    const data = { taskId, response: 'accepted' };
    const context = { auth: { uid: userId } };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        assignmentStatus: 'PendingPrimary',
        primaryAssignee: userId,
      })
    });
    mockUpdate.mockResolvedValue({ success: true });

    const result = await respondToTaskOffer(data, context);

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'Pending',
      assignmentStatus: 'Accepted',
      assignedTo: userId,
    });
  });

  it('should successfully reject an offer', async () => {
    const data = { taskId, response: 'rejected' };
    const context = { auth: { uid: userId } };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        assignmentStatus: 'PendingPrimary',
        primaryAssignee: userId,
      })
    });
    mockUpdate.mockResolvedValue({ success: true });

    const result = await respondToTaskOffer(data, context);

    expect(result).toEqual({ success: true });
    // Verify rejection count increment
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ rejectionCount: 1 }));
  });

  it('should update to PendingFallback if primary rejects and fallback exists', async () => {
    const data = { taskId, response: 'rejected' };
    const context = { auth: { uid: userId } };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        assignmentStatus: 'PendingPrimary',
        primaryAssignee: userId,
        fallbackAssignee: 'fallback-user',
      })
    });
    mockUpdate.mockResolvedValue({ success: true });

    const result = await respondToTaskOffer(data, context);

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith({ assignmentStatus: 'PendingFallback' });
  });

  it('should update to Unassigned if primary rejects and no fallback exists', async () => {
    const data = { taskId, response: 'rejected' };
    const context = { auth: { uid: userId } };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        assignmentStatus: 'PendingPrimary',
        primaryAssignee: userId,
        fallbackAssignee: null,
      })
    });
    mockUpdate.mockResolvedValue({ success: true });

    const result = await respondToTaskOffer(data, context);

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'Unassigned', assignmentStatus: 'Rejected' });
  });

  it('should update to Unassigned if fallback rejects', async () => {
    const fallbackUserId = 'fallback-user';
    const data = { taskId, response: 'rejected' };
    const context = { auth: { uid: fallbackUserId } };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        assignmentStatus: 'PendingFallback',
        primaryAssignee: userId,
        fallbackAssignee: fallbackUserId,
      })
    });
    mockUpdate.mockResolvedValue({ success: true });

    const result = await respondToTaskOffer(data, context);

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'Unassigned', assignmentStatus: 'Rejected' });
  });
});
