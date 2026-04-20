const mockAdd = jest.fn();
const mockGet = jest.fn();
const mockWhere = jest.fn();
const mockDoc = jest.fn(() => ({
    get: mockGet,
    set: jest.fn(),
}));
const mockCollection = jest.fn(() => ({
    where: mockWhere,
    get: mockGet,
    add: mockAdd,
    doc: mockDoc,
}));

const mockFirestore = jest.fn(() => ({
    collection: mockCollection,
    batch: jest.fn(() => ({
        set: jest.fn(),
        commit: jest.fn(),
    })),
}));

mockFirestore.FieldValue = {
    serverTimestamp: jest.fn(() => 'mock-timestamp'),
    increment: jest.fn((n) => n)
};

// Set up the chain for where() calls
mockWhere.mockImplementation(() => ({
    where: mockWhere,
    get: mockGet,
}));

jest.mock('firebase-functions', () => ({
    logger: {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
    },
    https: {
        onRequest: jest.fn(),
    },
    pubsub: {
        schedule: jest.fn(() => ({
            onRun: jest.fn(),
        })),
    },
}), { virtual: true });

jest.mock('firebase-admin', () => ({
    initializeApp: jest.fn(),
    firestore: mockFirestore,
    storage: jest.fn(() => ({
        bucket: jest.fn(() => ({
            upload: jest.fn(),
            file: jest.fn(() => ({
                getSignedUrl: jest.fn(),
            })),
        })),
    })),
    FieldValue: {
        serverTimestamp: jest.fn(() => 'mock-timestamp'),
        increment: jest.fn((n) => n)
    }
}), { virtual: true });

jest.mock('node-ical', () => ({
    fromURL: jest.fn()
}), { virtual: true });

jest.mock('busboy', () => jest.fn(() => ({
    on: jest.fn(),
    end: jest.fn()
})), { virtual: true });

// Require the function under test AFTER mocking
const { checkForDoubleBooking } = require('./automation');

describe('checkForDoubleBooking', () => {
    const propertyId = 'prop-123';
    const ownerId = 'owner-123';
    const newBooking = {
        propertyId,
        propertyName: 'Test Property',
        ownerId,
        guestName: 'New Guest',
        startDate: '2023-01-10',
        endDate: '2023-01-15',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset where() implementation
        mockWhere.mockImplementation(() => ({
            where: mockWhere,
            get: mockGet,
        }));
    });

    it('should not detect conflict if no existing bookings found', async () => {
        mockGet.mockResolvedValue({
            empty: true,
            forEach: jest.fn(),
        });

        await checkForDoubleBooking(newBooking);

        expect(mockCollection).toHaveBeenCalledWith('bookings');
        expect(mockWhere).toHaveBeenCalledWith('propertyId', '==', propertyId);
        expect(mockWhere).toHaveBeenCalledWith('endDate', '>', newBooking.startDate);
        expect(mockAdd).not.toHaveBeenCalled();
    });

    it('should not detect conflict if existing booking does not overlap (ends before start)', async () => {
        // Query: endDate > newBooking.startDate
        // This case would be filtered out by the query itself, but let's test if we get something that somehow passed query
        // but ends up being filtered by client-side logic (e.g. strict inequality vs inclusive).

        // Let's test a booking that starts after new booking ends.
        // New: Jan 10 - Jan 15
        // Existing: Jan 15 - Jan 20
        // Query: endDate (20) > startDate (10) -> True.
        // Filter: booking.startDate (15) < newBooking.endDate (15) -> False.

        const existingBooking = {
            propertyId,
            startDate: '2023-01-15',
            endDate: '2023-01-20',
            guestName: 'Existing Guest'
        };

        const mockSnapshot = {
            empty: false,
            forEach: (cb) => {
                cb({ id: 'existing-1', data: () => existingBooking });
            }
        };
        mockGet.mockResolvedValue(mockSnapshot);

        await checkForDoubleBooking(newBooking);
        expect(mockAdd).not.toHaveBeenCalled();
    });

    it('should detect conflict if existing booking overlaps at start', async () => {
        // New: Jan 10 - Jan 15
        // Existing: Jan 12 - Jan 17

        const existingBooking = {
            propertyId,
            startDate: '2023-01-12',
            endDate: '2023-01-17',
            guestName: 'Existing Guest'
        };

        const mockSnapshot = {
            empty: false,
            forEach: (cb) => {
                cb({ id: 'existing-1', data: () => existingBooking });
            }
        };
        mockGet.mockResolvedValue(mockSnapshot);

        await checkForDoubleBooking(newBooking);

        expect(mockAdd).toHaveBeenCalledTimes(1);
        expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
            type: "DOUBLE_BOOKING",
            conflictingBookingIds: expect.arrayContaining(['existing-1'])
        }));
    });

    it('should detect conflict if existing booking overlaps at end', async () => {
        // New: Jan 10 - Jan 15
        // Existing: Jan 08 - Jan 12

        const existingBooking = {
            propertyId,
            startDate: '2023-01-08',
            endDate: '2023-01-12',
            guestName: 'Existing Guest'
        };

        const mockSnapshot = {
            empty: false,
            forEach: (cb) => {
                cb({ id: 'existing-1', data: () => existingBooking });
            }
        };
        mockGet.mockResolvedValue(mockSnapshot);

        await checkForDoubleBooking(newBooking);
        expect(mockAdd).toHaveBeenCalledTimes(1);
    });

    it('should detect conflict if existing booking is inside new booking', async () => {
        // New: Jan 10 - Jan 15
        // Existing: Jan 12 - Jan 13

        const existingBooking = {
            propertyId,
            startDate: '2023-01-12',
            endDate: '2023-01-13',
            guestName: 'Existing Guest'
        };

        const mockSnapshot = {
            empty: false,
            forEach: (cb) => {
                cb({ id: 'existing-1', data: () => existingBooking });
            }
        };
        mockGet.mockResolvedValue(mockSnapshot);

        await checkForDoubleBooking(newBooking);
        expect(mockAdd).toHaveBeenCalledTimes(1);
    });

    it('should detect conflict if new booking is inside existing booking', async () => {
        // New: Jan 10 - Jan 15
        // Existing: Jan 01 - Jan 20

        const existingBooking = {
            propertyId,
            startDate: '2023-01-01',
            endDate: '2023-01-20',
            guestName: 'Existing Guest'
        };

        const mockSnapshot = {
            empty: false,
            forEach: (cb) => {
                cb({ id: 'existing-1', data: () => existingBooking });
            }
        };
        mockGet.mockResolvedValue(mockSnapshot);

        await checkForDoubleBooking(newBooking);
        expect(mockAdd).toHaveBeenCalledTimes(1);
    });

    it('should ignore self when existingBookingId is provided', async () => {
        // New: Jan 10 - Jan 15 (updating existing-1)
        // Existing: Jan 10 - Jan 15 (id: existing-1)

        const existingBooking = {
            propertyId,
            startDate: '2023-01-10',
            endDate: '2023-01-15',
            guestName: 'Me'
        };

        const mockSnapshot = {
            empty: false,
            forEach: (cb) => {
                cb({ id: 'existing-1', data: () => existingBooking });
            }
        };
        mockGet.mockResolvedValue(mockSnapshot);

        await checkForDoubleBooking(newBooking, 'existing-1');
        expect(mockAdd).not.toHaveBeenCalled();
    });

    it('should detect conflict with multiple bookings and report correct one', async () => {
        // existingBooking1 would be filtered out by the query (endDate < newBooking.startDate)
        // so we only mock what the query would returns: candidates that end after new start date.

        // Candidate 1: Ends after start, but starts after end. (No overlap)
        const existingBooking1 = {
            propertyId,
            startDate: '2023-01-15',
            endDate: '2023-01-20',
            guestName: 'Guest 1'
        };
        // Candidate 2: Ends after start, starts before end. (Overlap)
        const existingBooking2 = {
            propertyId,
            startDate: '2023-01-12',
            endDate: '2023-01-14',
            guestName: 'Guest 2'
        };

        const mockSnapshot = {
            empty: false,
            forEach: (cb) => {
                cb({ id: 'existing-1', data: () => existingBooking1 });
                cb({ id: 'existing-2', data: () => existingBooking2 });
            }
        };
        mockGet.mockResolvedValue(mockSnapshot);

        await checkForDoubleBooking(newBooking);

        expect(mockAdd).toHaveBeenCalledTimes(1);
        expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('Guest 2'),
            conflictingBookingIds: expect.arrayContaining(['existing-2'])
        }));
    });
});
