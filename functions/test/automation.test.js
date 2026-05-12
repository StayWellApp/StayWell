const path = require('path');

describe('uploadProof Vulnerability', () => {
    let automation;
    let mockBucket;
    let mockFirestore;
    let mockBusboyInstance;
    let req, res;

    beforeEach(() => {
        jest.resetModules(); // Reset cache to allow re-mocking

        // 1. Setup Mock Objects
        mockBucket = {
            upload: jest.fn().mockResolvedValue([]),
            file: jest.fn().mockReturnValue({
                getSignedUrl: jest.fn().mockResolvedValue(['http://mock-url']),
            }),
        };

        mockFirestore = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({ checklistItems: [] }),
            }),
            update: jest.fn().mockResolvedValue({}),
            batch: jest.fn().mockReturnValue({
                set: jest.fn(),
                commit: jest.fn(),
            }),
        };

        mockBusboyInstance = {
            on: jest.fn(),
            end: jest.fn(),
        };

        // 2. Define Mocks using doMock
        jest.doMock('firebase-admin', () => ({
            initializeApp: jest.fn(),
            firestore: Object.assign(jest.fn(() => mockFirestore), {
                FieldValue: {
                    serverTimestamp: jest.fn(),
                }
            }),
            storage: jest.fn(() => ({
                bucket: jest.fn().mockReturnValue(mockBucket),
            })),
        }), { virtual: true });

        jest.doMock('firebase-functions', () => ({
            https: {
                onRequest: jest.fn((handler) => handler),
            },
            logger: {
                log: jest.fn(),
                error: jest.fn(),
            },
            pubsub: {
                schedule: jest.fn().mockReturnThis(),
                onRun: jest.fn(),
            }
        }), { virtual: true });

        jest.doMock('busboy', () => jest.fn(() => mockBusboyInstance), { virtual: true });
        jest.doMock('cors', () => jest.fn(() => (req, res, next) => next()), { virtual: true });
        jest.doMock('node-ical', () => ({}), { virtual: true });

        jest.mock('fs');
        jest.mock('os');

        fs = require('fs');
        os = require('os');

        // Mock fs implementation
        fs.createWriteStream.mockReturnValue({
            on: jest.fn((event, cb) => {
                if (event === 'finish') cb();
                return this;
            }),
            end: jest.fn(),
            write: jest.fn(),
        });
        fs.unlinkSync.mockImplementation(() => {});
        os.tmpdir.mockReturnValue('/tmp');

        // 3. Require the module under test
        automation = require('../src/automation');

        // 4. Setup request/response
        req = {
            method: 'POST',
            headers: { 'content-type': 'multipart/form-data; boundary=boundary' },
            rawBody: Buffer.from(''),
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
    });

    const runBusboySequence = async (fields, fileData) => {
        // Execute the function
        automation.uploadProof(req, res);

        // 1. 'field' events
        const fieldCalls = mockBusboyInstance.on.mock.calls.filter(call => call[0] === 'field');
        if (fieldCalls.length === 0) throw new Error("No 'field' listener registered");
        const fieldCallback = fieldCalls[0][1];

        for (const [key, value] of Object.entries(fields)) {
            fieldCallback(key, value);
        }

        // 2. 'file' event
        const fileCalls = mockBusboyInstance.on.mock.calls.filter(call => call[0] === 'file');
        if (fileCalls.length === 0) throw new Error("No 'file' listener registered");
        const fileCallback = fileCalls[0][1];

        const fileStream = {
            pipe: jest.fn(),
            on: jest.fn((event, cb) => {
                if (event === 'end') cb();
            }),
            resume: jest.fn(),
        };
        fileCallback('file', fileStream, fileData);

        // 3. 'finish' event
        const finishCalls = mockBusboyInstance.on.mock.calls.filter(call => call[0] === 'finish');
        if (finishCalls.length === 0) throw new Error("No 'finish' listener registered");
        const finishCallback = finishCalls[0][1];

        await finishCallback();
    };

    test('should reject path traversal in taskId', async () => {
        const fields = {
            taskId: '../evil',
            itemIndex: '0',
            originalFilename: 'file.txt'
        };
        const fileData = { filename: 'temp.txt', mimeType: 'text/plain' };

        await runBusboySequence(fields, fileData);

        // Verify response is error
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ error: "Processing failed on server." }));
        expect(mockBucket.upload).not.toHaveBeenCalled();
    });

    test('should sanitize path traversal in originalFilename', async () => {
        const fields = {
            taskId: 'task123',
            itemIndex: '0',
            originalFilename: '../../file.txt'
        };
        const fileData = { filename: 'temp.txt', mimeType: 'text/plain' };

        await runBusboySequence(fields, fileData);

        // Verify bucket.upload called with sanitized path
        const expectedDestination = `proofs/task123/0-file.txt`;
        expect(mockBucket.upload).toHaveBeenCalledWith(
            expect.stringContaining('temp.txt'),
            expect.objectContaining({
                destination: expectedDestination
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should accept valid inputs', async () => {
        const fields = {
            taskId: 'task-123_ABC',
            itemIndex: '1',
            originalFilename: 'photo.jpg'
        };
        const fileData = { filename: 'temp.jpg', mimeType: 'image/jpeg' };

        await runBusboySequence(fields, fileData);

        const expectedDestination = `proofs/task-123_ABC/1-photo.jpg`;
        expect(mockBucket.upload).toHaveBeenCalledWith(
            expect.stringContaining('temp.jpg'),
            expect.objectContaining({
                destination: expectedDestination
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should reject invalid itemIndex', async () => {
        const fields = {
            taskId: 'task123',
            itemIndex: 'abc', // Invalid
            originalFilename: 'file.txt'
        };
        const fileData = { filename: 'temp.txt', mimeType: 'text/plain' };

        await runBusboySequence(fields, fileData);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(mockBucket.upload).not.toHaveBeenCalled();
    });
});
