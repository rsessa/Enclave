/**
 * Enclave Cryptography Module
 * Handles ephemeral, in-memory AES-GCM encryption for tab contents.
 */

// Generate a strict ephemeral key on app startup. It is stored ONLY in memory.
let ephemeralKey: CryptoKey | null = null;

export async function initCrypto() {
    if (!ephemeralKey) {
        ephemeralKey = await window.crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256,
            },
            false, // non-extractable
            ['encrypt', 'decrypt']
        );
    }
}

export async function encryptContent(text: string): Promise<{ ciphertext: string; iv: string }> {
    if (!ephemeralKey) await initCrypto();

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(text);

    const encryptedBuf = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        ephemeralKey!,
        encodedData
    );

    // Convert to Base64 to store in JS memory structures
    const ciphertextB64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuf)));
    const ivB64 = btoa(String.fromCharCode(...iv));

    return { ciphertext: ciphertextB64, iv: ivB64 };
}

export async function decryptContent(ciphertextB64: string, ivB64: string): Promise<string> {
    if (!ephemeralKey) await initCrypto();

    const encryptedBuf = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));

    const decryptedBuf = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        ephemeralKey!,
        encryptedBuf
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuf);
}
