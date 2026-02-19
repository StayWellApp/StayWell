
const mockRequest = (body, headers = {}, method = 'POST') => ({
    body,
    headers,
    method
});

// Removed mockResponse helper to define mocks explicitly in tests for better tracking

// Mocks
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockDoc = jest.fn(() => ({
    get: mockGet,
    set: mockSet,
}));

// Mock Query for chaining .where().where()
const mockQuery = {
    get: jest.fn(() => ({ empty: true, forEach: jest.fn() }))
};
// We need 'where' to return mockQuery itself (or similar) to allow chaining
mockQuery.where = jest.fn().mockReturnValue(mockQuery);

const mockCollection = jest.fn(() => ({
    doc: mockDoc,
    where: jest.fn().mockReturnValue(mockQuery) // First .where() returns mockQuery
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
};

const mockAuth = {
    verifyIdToken: jest.fn()
};

const mockBucket = {
    upload: jest.fn(),
    file: jest.fn(() => ({
        getSignedUrl: jest.fn().mockResolvedValue(['mock-url'])
    }))
};

jest.mock('firebase-admin', () => ({
    initializeApp: jest.fn(),
    firestore: mockFirestore,
    auth: () => mockAuth,
    storage: () => ({ bucket: () => mockBucket })
}), { virtual: true });

jest.mock('firebase-functions', () => ({
    https: {
        onRequest: jest.fn((handler) => handler)
    },
    logger: {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn()
    },
    pubsub: {
        schedule: jest.fn(() => ({ onRun: jest.fn() }))
    }
}), { virtual: true });

jest.mock('cors', () => jest.fn(() => (req, res, next) => next()));
jest.mock('busboy', () => jest.fn());
jest.mock('node-ical', () => ({ fromURL: jest.fn() }));

// Import the function to test
const { addManualBooking } = require('./automation');

describe('addManualBooking', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if no authorization header is present', async () => {
        const req = mockRequest({
            propertyId: 'prop1',
            startDate: '2023-01-01',
            endDate: '2023-01-05',
            guestName: 'John Doe'
        });

        const status = jest.fn();
        const send = jest.fn();
        const res = { status, send };
        status.mockReturnValue(res);

        const responsePromise = new Promise(resolve => {
            send.mockImplementation((body) => {
                resolve(body);
                return res;
            });
        });

        // Mock property to avoid 500 if logic proceeds
        mockGet.mockResolvedValue({
            exists: true,
            data: () => ({ propertyName: 'Prop 1', ownerId: 'user1', rules: [] })
        });

        // Currently logic proceeds -> 200 (vulnerability)
        // After fix -> 401
        // We assert 401 to fail now and pass later
        addManualBooking(req, res);
        await responsePromise;

        expect(status).toHaveBeenCalledWith(401);
        expect(send).toHaveBeenCalledWith(expect.objectContaining({ error: "Unauthorized" }));
    });

    it('should return 403 if user is not authorized (not owner)', async () => {
        const req = mockRequest({
            propertyId: 'prop1',
            startDate: '2023-01-01',
            endDate: '2023-01-05',
            guestName: 'John Doe'
        }, {
            authorization: 'Bearer valid-token'
        });

        const status = jest.fn();
        const send = jest.fn();
        const res = { status, send };
        status.mockReturnValue(res);

        const responsePromise = new Promise(resolve => {
            send.mockImplementation((body) => {
                resolve(body);
                return res;
            });
        });

        mockAuth.verifyIdToken.mockResolvedValue({ uid: 'user2' });
        mockGet.mockResolvedValue({
            exists: true,
            data: () => ({ propertyName: 'Prop 1', ownerId: 'user1', rules: [] })
        });

        // Currently logic proceeds -> 200 (vulnerability)
        // After fix -> 403
        addManualBooking(req, res);
        await responsePromise;

        expect(status).toHaveBeenCalledWith(403);
        expect(send).toHaveBeenCalledWith(expect.objectContaining({ error: "Forbidden" }));
    });

    it('should return 200 and create booking if user is authorized (owner)', async () => {
        const req = mockRequest({
            propertyId: 'prop1',
            startDate: '2023-01-01',
            endDate: '2023-01-05',
            guestName: 'John Doe'
        }, {
            authorization: 'Bearer valid-token'
        });

        const status = jest.fn();
        const send = jest.fn();
        const res = { status, send };
        status.mockReturnValue(res);

        const responsePromise = new Promise(resolve => {
            send.mockImplementation((body) => {
                resolve(body);
                return res;
            });
        });

        mockAuth.verifyIdToken.mockResolvedValue({ uid: 'user1' });
        mockGet.mockResolvedValue({
            exists: true,
            data: () => ({ propertyName: 'Prop 1', ownerId: 'user1', rules: [] })
        });

        addManualBooking(req, res);
        await responsePromise;

        expect(status).toHaveBeenCalledWith(200);
        expect(mockSet).toHaveBeenCalled();
        expect(send).toHaveBeenCalledWith(expect.objectContaining({ status: "success" }));
    });
});
