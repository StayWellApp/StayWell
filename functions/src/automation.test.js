const admin = require('firebase-admin');
const functions = require('firebase-functions');
const fs = require('fs');
const path = require('path');
const os = require('os');
const Busboy = require('busboy');

// Mocks
jest.mock('firebase-admin', () => ({
    initializeApp: jest.fn(),
    storage: jest.fn(),
    firestore: jest.fn(),
}));

jest.mock('firebase-functions', () => ({
    https: {
        onRequest: jest.fn((handler) => handler),
    },
    logger: {
        log: jest.fn(),
        error: jest.fn(),
    },
    pubsub: {
        schedule: jest.fn(() => ({
            onRun: jest.fn(),
        })),
    },
}));

jest.mock('fs');
jest.mock('path');
jest.mock('os');

// Mock Busboy
const mockBusboyInstance = {
    on: jest.fn(),
    end: jest.fn(),
};
jest.mock('busboy', () => jest.fn(() => mockBusboyInstance));

// Mock CORS
jest.mock('cors', () => jest.fn(() => (req, res, next) => next()));

// Mock node-ical
jest.mock('node-ical', () => ({
    fromURL: jest.fn(),
}));

describe('uploadProof', () => {
    let automation;
    let req, res;
    let mockBucket, mockFile;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup Firestore Mocks
        const mockTaskDoc = {
            exists: true,
            data: () => ({ checklistItems: [{ photoURL: '' }] }),
        };
        const mockTaskRef = {
            get: jest.fn().mockResolvedValue(mockTaskDoc),
            update: jest.fn().mockResolvedValue({}),
        };
        const mockCollection = jest.fn(() => ({
            doc: jest.fn(() => mockTaskRef),
            where: jest.fn(() => ({ get: jest.fn() })),
        }));
        const mockFirestore = {
            collection: mockCollection,
            batch: jest.fn(() => ({ set: jest.fn(), commit: jest.fn() })),
        };
        // Add FieldValue mock
        mockFirestore.FieldValue = {
            serverTimestamp: jest.fn(),
        };
        admin.firestore.mockReturnValue(mockFirestore);
        admin.firestore.FieldValue = mockFirestore.FieldValue;

        // Setup Storage Mocks
        mockFile = {
            getSignedUrl: jest.fn().mockResolvedValue(['https://signed-url']),
            makePublic: jest.fn().mockResolvedValue(),
            publicUrl: jest.fn().mockReturnValue('https://public-url'),
        };
        mockBucket = {
            upload: jest.fn().mockResolvedValue(),
            file: jest.fn(() => mockFile),
        };
        admin.storage.mockReturnValue({
            bucket: jest.fn(() => mockBucket),
        });

        // Setup FS/OS mocks
        os.tmpdir.mockReturnValue('/tmp');
        path.join.mockImplementation((...args) => args.join('/'));

        // Mock WriteStream with event handling
        fs.createWriteStream.mockImplementation(() => {
            const handlers = {};
            return {
                on: jest.fn((evt, cb) => {
                    handlers[evt] = cb;
                }),
                end: jest.fn(() => {
                    if (handlers['finish']) handlers['finish']();
                }),
                write: jest.fn(),
                emit: jest.fn(),
                once: jest.fn(),
            };
        });

        fs.unlinkSync.mockImplementation(() => {});

        // Setup Request/Response
        req = {
            method: 'POST',
            headers: { 'content-type': 'multipart/form-data' },
            rawBody: Buffer.from('test'),
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        // Re-require automation to ensure mocks are used
        jest.isolateModules(() => {
            automation = require('./automation');
        });
    });

    it('should upload file and make it public', async () => {
        const handlers = {};
        mockBusboyInstance.on.mockImplementation((event, callback) => {
            handlers[event] = callback;
        });

        const responsePromise = new Promise((resolve) => {
            res.send.mockImplementation((data) => {
                resolve(data);
            });
        });

        automation.uploadProof(req, res);

        // Simulate Busboy parsing
        // 1. Emit fields
        if (handlers['field']) {
            handlers['field']('taskId', 'task1');
            handlers['field']('itemIndex', '0');
            handlers['field']('originalFilename', 'photo.jpg');
        }

        // 2. Emit file
        if (handlers['file']) {
            const fileStream = {
                pipe: jest.fn(),
                on: jest.fn((evt, cb) => {
                    if (evt === 'end') {
                        // Defer callback to ensure writeStream listeners are attached
                        setTimeout(cb, 0);
                    }
                }),
                resume: jest.fn(),
            };
            handlers['file']('file', fileStream, { filename: 'photo.jpg', mimeType: 'image/jpeg' });
        }

        // 3. Emit finish
        if (handlers['finish']) {
            await handlers['finish']();
        }

        await responsePromise;

        expect(mockBucket.file).toHaveBeenCalledWith('proofs/task1/0-photo.jpg');
        expect(mockBucket.upload).toHaveBeenCalledWith('/tmp/photo.jpg', expect.objectContaining({
            metadata: { contentType: 'image/jpeg' }
        }));

        expect(mockFile.makePublic).toHaveBeenCalled();
        expect(mockFile.publicUrl).toHaveBeenCalled();
        expect(mockFile.getSignedUrl).not.toHaveBeenCalled();
    });
});
