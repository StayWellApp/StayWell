const { fetchSafeUrl, isPrivateIP } = require('./utils');
const dns = require('dns');

// Mock fetch
global.fetch = jest.fn();

// Mock dns
jest.mock('dns');

describe('utils', () => {
    describe('isPrivateIP', () => {
        it('should return true for private IPv4', () => {
            expect(isPrivateIP('127.0.0.1')).toBe(true);
            expect(isPrivateIP('10.0.0.1')).toBe(true);
            expect(isPrivateIP('192.168.1.1')).toBe(true);
            expect(isPrivateIP('172.16.0.1')).toBe(true); // 172.16.0.0/12
            expect(isPrivateIP('172.31.255.255')).toBe(true);
            expect(isPrivateIP('169.254.1.1')).toBe(true);
            expect(isPrivateIP('0.0.0.0')).toBe(true);
            expect(isPrivateIP('0.0.0.1')).toBe(true);
        });

        it('should return false for public IPv4', () => {
            expect(isPrivateIP('8.8.8.8')).toBe(false);
            expect(isPrivateIP('1.1.1.1')).toBe(false);
            expect(isPrivateIP('172.32.0.1')).toBe(false); // Outside private range
            expect(isPrivateIP('11.0.0.1')).toBe(false);
        });

        it('should return true for private IPv6', () => {
            expect(isPrivateIP('::1')).toBe(true);
            expect(isPrivateIP('fc00::1')).toBe(true);
            expect(isPrivateIP('fe80::1')).toBe(true);
            expect(isPrivateIP('::')).toBe(true);
            expect(isPrivateIP('0:0:0:0:0:0:0:0')).toBe(true);
        });
    });

    describe('fetchSafeUrl', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should throw on invalid protocol', async () => {
            await expect(fetchSafeUrl('ftp://example.com')).rejects.toThrow('Invalid protocol');
        });

        it('should throw on localhost', async () => {
            await expect(fetchSafeUrl('http://localhost:3000')).rejects.toThrow('Access to localhost is denied');
        });

        it('should throw if DNS resolves to private IP', async () => {
            dns.lookup.mockImplementation((hostname, options, callback) => {
                callback(null, [{ address: '127.0.0.1', family: 4 }]);
            });
            await expect(fetchSafeUrl('http://example.com')).rejects.toThrow('Access denied to private IP');
        });

        it('should fetch if DNS resolves to public IP', async () => {
            dns.lookup.mockImplementation((hostname, options, callback) => {
                callback(null, [{ address: '8.8.8.8', family: 4 }]);
            });
            global.fetch.mockResolvedValue({
                ok: true,
                text: jest.fn().mockResolvedValue('content'),
            });

            const result = await fetchSafeUrl('http://example.com');
            expect(result).toBe('content');
            expect(global.fetch).toHaveBeenCalledWith('http://example.com');
        });

        it('should handle fetch failure', async () => {
            dns.lookup.mockImplementation((hostname, options, callback) => {
                callback(null, [{ address: '8.8.8.8', family: 4 }]);
            });
            global.fetch.mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });

            await expect(fetchSafeUrl('http://example.com')).rejects.toThrow('Failed to fetch');
        });
    });
});
