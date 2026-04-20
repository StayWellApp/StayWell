const dns = require('dns');
const { URL } = require('url');
const net = require('net');

/**
 * Checks if an IP address is private or reserved.
 * @param {string} ip The IP address to check.
 * @returns {boolean} True if the IP is private/reserved, false otherwise.
 */
const isPrivateIP = (ip) => {
    if (!net.isIP(ip)) return false;

    // IPv4 private ranges
    // 10.0.0.0/8
    // 172.16.0.0/12
    // 192.168.0.0/16
    // 127.0.0.0/8 (Loopback)
    // 169.254.0.0/16 (Link-local)
    if (net.isIPv4(ip)) {
        const parts = ip.split('.').map(Number);
        if (parts[0] === 0) return true; // 0.0.0.0/8
        if (parts[0] === 10) return true;
        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
        if (parts[0] === 192 && parts[1] === 168) return true;
        if (parts[0] === 127) return true;
        if (parts[0] === 169 && parts[1] === 254) return true;
        return false;
    }

    // IPv6 private ranges
    // fc00::/7 (Unique Local Address)
    // ::1/128 (Loopback)
    // fe80::/10 (Link-local)
    // ::/128 (Unspecified)
    if (net.isIPv6(ip)) {
        // Normalize IPv6 check is complex, but basic checks:
        const normalized = ip.toLowerCase();
        if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;
        if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
        if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
        if (normalized.startsWith('fe80:')) return true;

        // Check for IPv4 mapped IPv6 addresses (::ffff:127.0.0.1)
        if (normalized.startsWith('::ffff:')) {
            const ipv4Part = ip.substring(7);
            return isPrivateIP(ipv4Part);
        }

        return false;
    }

    return false;
};

/**
 * Fetches content from a URL securely, preventing SSRF.
 * @param {string} urlString The URL to fetch.
 * @returns {Promise<string>} The response text.
 */
const fetchSafeUrl = async (urlString) => {
    let url;
    try {
        url = new URL(urlString);
    } catch (e) {
        throw new Error(`Invalid URL: ${urlString}`);
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error(`Invalid protocol: ${url.protocol}`);
    }

    // Resolve hostname to IP
    const hostname = url.hostname;

    // Explicit localhost check
    if (hostname === 'localhost') {
         throw new Error('Access to localhost is denied.');
    }

    return new Promise((resolve, reject) => {
        dns.lookup(hostname, { all: true }, async (err, addresses) => {
            if (err) return reject(new Error(`DNS lookup failed for ${hostname}: ${err.message}`));

            // Check all resolved addresses
            for (const addr of addresses) {
                if (isPrivateIP(addr.address)) {
                    return reject(new Error(`Access denied to private IP: ${addr.address}`));
                }
            }

            // If we reach here, all IPs are public (safe-ish).
            // Fetch content.
            try {
                // Note: There is still a TOCTOU race condition (DNS Rebinding) here.
                // Fixing it completely requires a custom HTTP agent which is complex.
                // This validation blocks the majority of SSRF attempts.
                const response = await fetch(urlString);
                if (!response.ok) {
                    return reject(new Error(`Failed to fetch ${urlString}: ${response.status} ${response.statusText}`));
                }
                const text = await response.text();
                resolve(text);
            } catch (fetchErr) {
                reject(fetchErr);
            }
        });
    });
};

module.exports = {
    isPrivateIP,
    fetchSafeUrl
};
