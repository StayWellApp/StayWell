
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
const { reviewTask } = require('./tasks');

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
