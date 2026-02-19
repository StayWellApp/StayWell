
const { describe, it, expect, beforeEach } = require('@jest/globals');

describe('syncIcalFeeds', () => {
  let mockSet, mockFromURL, mockDoc, mockLogger, automation;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockSet = jest.fn();
    mockLogger = {
        log: jest.fn(),
        error: jest.fn((...args) => console.error('LOGGER ERROR:', ...args)),
        warn: jest.fn(),
        info: jest.fn()
    };

    mockFromURL = jest.fn(async (url) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          'event-1': {
            type: 'VEVENT',
            uid: `booking-${Math.random()}@airbnb.com`,
            start: new Date(),
            end: new Date(),
            summary: 'Test Guest'
          }
        };
    });

    const mockProperties = [];
    for (let i = 0; i < 10; i++) {
      mockProperties.push({
        id: `prop-${i}`,
        data: () => ({
          propertyName: `Property ${i}`,
          ownerId: `owner-${i}`,
          iCalUrl: `http://example.com/ical/${i}`
        })
      });
    }

    mockDoc = jest.fn(() => ({
        set: mockSet,
        update: jest.fn(),
        get: jest.fn().mockResolvedValue({ exists: false })
    }));

    const mockCollection = jest.fn((name) => {
        if (name === 'properties') {
          return {
            get: jest.fn().mockResolvedValue({
              empty: false,
              docs: mockProperties
            })
          };
        }
        if (name === 'bookings') {
          return {
            where: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue({ empty: true, forEach: () => {} }),
            doc: mockDoc,
            add: jest.fn()
          };
        }
        return {
          doc: mockDoc,
          add: jest.fn()
        };
    });

    const mockFirestore = {
      collection: mockCollection,
      batch: jest.fn(() => ({
        set: jest.fn(),
        commit: jest.fn()
      })),
    };

    // Not strictly needed here if we access it via admin.firestore.FieldValue
    // mockFirestore.FieldValue = {
    //   serverTimestamp: jest.fn(() => 'mock-timestamp')
    // };

    const firestoreFn = () => mockFirestore;
    firestoreFn.FieldValue = {
        serverTimestamp: jest.fn(() => 'mock-timestamp')
    };

    jest.doMock('firebase-admin', () => ({
      firestore: firestoreFn,
      storage: () => ({ bucket: () => ({}) }),
      auth: () => ({})
    }), { virtual: true });

    jest.doMock('firebase-functions', () => ({
      https: { onRequest: jest.fn() },
      pubsub: {
        schedule: jest.fn(() => ({
          onRun: jest.fn((handler) => handler)
        }))
      },
      logger: mockLogger
    }), { virtual: true });

    jest.doMock('node-ical', () => ({
      fromURL: mockFromURL
    }), { virtual: true });

    automation = require('./automation');
  });

  it('should process all property iCal feeds concurrently', async () => {
    await automation.syncIcalFeeds({});

    expect(mockLogger.error).not.toHaveBeenCalled();
    expect(mockFromURL).toHaveBeenCalledTimes(10);
    expect(mockSet).toHaveBeenCalledTimes(10);
  });
});
