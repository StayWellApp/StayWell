const admin = require('firebase-admin');
const functions = require('firebase-functions');
const fs = require('fs');
const path = require('path');

// Mock cors
jest.mock('cors', () => {
    return jest.fn(() => (req, res, next) => next());
});

const automation = require('./automation');

// Mock dependencies
jest.mock('firebase-admin', () => {
    const mockUpload = jest.fn().mockResolvedValue([]);
    const mockFile = jest.fn(() => ({
        getSignedUrl: jest.fn().mockResolvedValue(['http://mock-url']),
    }));
    const mockBucket = jest.fn(() => ({
        upload: mockUpload,
        file: mockFile,
    }));

    const mockUpdate = jest.fn().mockResolvedValue({});
    const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ checklistItems: [{}] }),
    });
    const mockDoc = jest.fn(() => ({
        get: mockGet,
        update: mockUpdate,
    }));
    const mockCollection = jest.fn(() => ({
        doc: mockDoc,
    }));

    return {
        storage: jest.fn(() => ({ bucket: mockBucket })),
        firestore: jest.fn(() => ({ collection: mockCollection })),
        initializeApp: jest.fn(),
    };
});

jest.mock('firebase-functions', () => ({
    https: {
        onRequest: (handler) => handler,
    },
    pubsub: {
        schedule: jest.fn(() => ({
            onRun: jest.fn(),
        })),
    },
    logger: {
        error: jest.fn(),
        log: jest.fn(),
    },
}));

jest.mock('fs', () => {
    return {
        createWriteStream: jest.fn(() => ({
            on: jest.fn((event, cb) => {
                if (event === 'finish') cb();
                return this;
            }),
            end: jest.fn(),
            write: jest.fn(),
        })),
        unlinkSync: jest.fn(),
        promises: {
            unlink: jest.fn().mockResolvedValue(),
        },
    };
});

jest.mock('busboy', () => {
    return jest.fn(() => {
        const handlers = {};
        return {
            on: (event, handler) => {
                handlers[event] = handler;
            },
            end: (buffer) => {
                // Simulate file upload
                if (handlers['file']) {
                    const fileStream = {
                        pipe: jest.fn(),
                        on: (event, cb) => {
                            if (event === 'end') cb();
                        },
                    };
                    handlers['file']('file', fileStream, { filename: 'test.jpg', mimeType: 'image/jpeg' });
                }
                // Simulate fields
                if (handlers['field']) {
                    handlers['field']('taskId', 'task-123');
                    handlers['field']('itemIndex', '0');
                    handlers['field']('originalFilename', 'test.jpg');
                }
                // Simulate finish
                if (handlers['finish']) {
                    handlers['finish']();
                }
            },
        };
    });
});

describe('uploadProof', () => {
    it('should use fs.unlinkSync (before optimization) or fs.promises.unlink (after)', async () => {
        const req = {
            method: 'POST',
            headers: { 'content-type': 'multipart/form-data' },
            rawBody: Buffer.from(''),
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await automation.uploadProof(req, res);

        // Check if unlinkSync was called (current behavior)
        // OR if fs.promises.unlink was called (desired behavior)

        // Wait for async operations to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(fs.unlinkSync).not.toHaveBeenCalled();
        expect(fs.promises.unlink).toHaveBeenCalled();
    });
});
