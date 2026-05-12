
const mockBatchSet = jest.fn();
const mockBatchCommit = jest.fn();

const mockBatch = jest.fn(() => ({
  set: mockBatchSet,
  commit: mockBatchCommit,
}));

const mockPropertyGet = jest.fn();
const mockRulesGet = jest.fn();

// Mock doc function to return an object with an ID
const mockDocFn = jest.fn((id) => ({
    id: id || 'mock-doc-id',
    get: jest.fn(),
    set: jest.fn(),
}));

const mockCollection = jest.fn((name) => {
    if (name === 'properties') {
        return { doc: jest.fn(() => ({ get: mockPropertyGet })) };
    }
    if (name === 'automationRules') {
        return { doc: jest.fn(() => ({ get: mockRulesGet })) };
    }
    return {
        doc: mockDocFn,
        add: jest.fn(),
        where: jest.fn(() => ({ get: jest.fn() }))
    };
});

const mockFirestore = jest.fn(() => ({
  collection: mockCollection,
  batch: mockBatch,
}));

mockFirestore.FieldValue = {
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
  increment: jest.fn((n) => n)
};

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: mockFirestore,
  storage: jest.fn(() => ({ bucket: jest.fn() })),
}), { virtual: true });

jest.mock('firebase-functions', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
  https: {
    onRequest: jest.fn(),
    onCall: jest.fn(),
  },
  pubsub: {
    schedule: jest.fn(() => ({ onRun: jest.fn() })),
  }
}), { virtual: true });

jest.mock('node-ical', () => ({ fromURL: jest.fn() }), { virtual: true });
jest.mock('busboy', () => jest.fn(), { virtual: true });
jest.mock('cors', () => jest.fn(() => (req, res, next) => next && next()), { virtual: true });

// Require the module after mocks
const { triggerAutomationForBooking } = require('./automation');
const functions = require('firebase-functions');

describe('triggerAutomationForBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log error and return if propertyId or checkoutDate is missing', async () => {
    await triggerAutomationForBooking({});
    expect(functions.logger.error).toHaveBeenCalledWith(expect.stringContaining('Missing propertyId or checkoutDate'));
    expect(mockPropertyGet).not.toHaveBeenCalled();
  });

  it('should log error if property does not exist', async () => {
    mockPropertyGet.mockResolvedValue({ exists: false });
    mockRulesGet.mockResolvedValue({ exists: false });

    await triggerAutomationForBooking({ propertyId: 'p1', checkoutDate: '2023-10-01' });

    expect(functions.logger.error).toHaveBeenCalledWith(expect.stringContaining('not found'));
  });

  it('should log info if no automation rules found (doc missing)', async () => {
    mockPropertyGet.mockResolvedValue({ exists: true, data: () => ({ propertyName: 'Test Prop' }) });
    mockRulesGet.mockResolvedValue({ exists: false });

    await triggerAutomationForBooking({ propertyId: 'p1', checkoutDate: '2023-10-01' });

    expect(functions.logger.info).toHaveBeenCalledWith(expect.stringContaining('No automation rules found'));
  });

  it('should log info if no automation rules found (empty rules)', async () => {
    mockPropertyGet.mockResolvedValue({ exists: true, data: () => ({ propertyName: 'Test Prop' }) });
    mockRulesGet.mockResolvedValue({ exists: true, data: () => ({ rules: null }) });

    await triggerAutomationForBooking({ propertyId: 'p1', checkoutDate: '2023-10-01' });

    expect(functions.logger.info).toHaveBeenCalledWith(expect.stringContaining('No automation rules found'));
  });

  it('should create tasks and notifications for valid rules', async () => {
    const propertyData = { propertyName: 'Test Prop', ownerId: 'owner1' };
    const rulesData = {
      rules: [
        {
          ruleName: 'Cleaning',
          taskType: 'Cleaning',
          timeline: { daysAfterCheckout: 1 },
          defaultAssignee: 'cleaner1',
        }
      ]
    };

    mockPropertyGet.mockResolvedValue({ exists: true, data: () => propertyData });
    mockRulesGet.mockResolvedValue({ exists: true, data: () => rulesData });

    await triggerAutomationForBooking({ propertyId: 'p1', checkoutDate: '2023-10-01', guestName: 'Guest' });

    expect(mockBatchSet).toHaveBeenCalledTimes(2); // 1 task + 1 notification

    // Check Task Creation
    const taskCall = mockBatchSet.mock.calls.find(call => call[1].taskType === 'Cleaning');
    expect(taskCall).toBeDefined();
    const taskData = taskCall[1];
    expect(taskData).toMatchObject({
        taskName: 'Cleaning for Guest',
        taskType: 'Cleaning',
        propertyId: 'p1',
        scheduledDate: '2023-10-02', // 1 day after checkout
        primaryAssignee: 'cleaner1',
        propertyName: 'Test Prop',
        ownerId: 'owner1'
    });

    // Check Notification Creation
    const notifCall = mockBatchSet.mock.calls.find(call => call[1].type === 'NEW_TASK_OFFER');
    expect(notifCall).toBeDefined();
    const notifData = notifCall[1];
    expect(notifData).toMatchObject({
        userId: 'cleaner1',
        type: 'NEW_TASK_OFFER',
        message: expect.stringContaining('Cleaning for Guest')
    });

    expect(mockBatchCommit).toHaveBeenCalled();
    expect(functions.logger.log).toHaveBeenCalledWith(expect.stringContaining('Automation successful'));
  });

  it('should handle multiple rules', async () => {
    const propertyData = { propertyName: 'Test Prop', ownerId: 'owner1' };
    const rulesData = {
      rules: [
        {
          ruleName: 'Cleaning',
          taskType: 'Cleaning',
          timeline: { daysAfterCheckout: 0 },
        },
        {
            ruleName: 'Inspection',
            taskType: 'Inspection',
            timeline: { daysAfterCheckout: 1 },
        }
      ]
    };

    mockPropertyGet.mockResolvedValue({ exists: true, data: () => propertyData });
    mockRulesGet.mockResolvedValue({ exists: true, data: () => rulesData });

    await triggerAutomationForBooking({ propertyId: 'p1', checkoutDate: '2023-10-01', guestName: 'Guest' });

    expect(mockBatchSet).toHaveBeenCalledTimes(2); // 2 tasks, no notifications (no assignees)
    expect(mockBatchCommit).toHaveBeenCalled();
  });
});
