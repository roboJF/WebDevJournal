const cryptoAPI = window.crypto;

if(!cryptoAPI || !cryptoAPI.subtle){
    throw new Error('Crypto API is not available in this environment.');
}

export async function generateEncryptionKey() {

    return await cryptoAPI.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );

}

function generateIV() {
    return cryptoAPI.getRandomValues(new Uint8Array(12));
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });

    return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

export async function encryptData(data, key) {
    const iv = generateIV();
    const encodedData = new TextEncoder().encode(data);
    const encryptedData = await cryptoAPI.subtle.encrypt(
        {
            name: "AES-GCM",
            iv,
        },
        key,
        encodedData
    );

    return {
        version: 1,
        algorithm: "AES-GCM",
        iv: arrayBufferToBase64(iv),
        ciphertext: arrayBufferToBase64(encryptedData)
    };
}

export async function decryptData(encryptedObject, key) {
  if (!encryptedObject || 
    encryptedObject.version !== 1 ||
    encryptedObject.algorithm !== 'AES-GCM' ||
    !encryptedObject.iv ||
    !encryptedObject.ciphertext) {
    throw new Error('Invalid encrypted data format.');
  }

  const iv = new Uint8Array(
    base64ToArrayBuffer(encryptedObject.iv)
  );

  const ciphertext = base64ToArrayBuffer(
    encryptedObject.ciphertext
  );

  const decryptedData = await cryptoAPI.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decryptedData);
}