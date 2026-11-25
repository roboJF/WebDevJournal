
import {
  generateEncryptionKey,
  encryptData,
  decryptData,
} from './crypto.js';

async function testEncryption() {
  console.log('Starting encryption tests...');

  // Test 1: Generate a key
  const key = await generateEncryptionKey();
  console.log('Generated key:', key);
  console.log('Is CryptoKey:', key instanceof CryptoKey);
  console.log('Key type:', key?.type);
  console.log('Test 1 passed: Encryption key generated.');

  // Test 2: Encrypt text
  const originalText = 'This is my private journal entry.';
  const encrypted = await encryptData(originalText, key);

  console.log('Encrypted data:', encrypted);

  console.assert(
    encrypted.ciphertext !== originalText,
    'Test 2 failed: Text was not encrypted.'
  );

  console.log('Test 2 passed: Text encrypted.');

  // Test 3: Decrypt text
  const decrypted = await decryptData(encrypted, key);

  console.assert(
    decrypted === originalText,
    'Test 3 failed: Decrypted text does not match.'
  );

  console.log('Test 3 passed: Text decrypted correctly.');

  // Test 4: Different IVs
  const encryptedAgain = await encryptData(originalText, key);

  console.assert(
    encrypted.iv !== encryptedAgain.iv,
    'Test 4 failed: IVs were reused.'
  );

  console.log('Test 4 passed: Different IVs generated.');

  // Test 5: Wrong key
  const wrongKey = await generateEncryptionKey();

  try {
    await decryptData(encrypted, wrongKey);
    console.error('Test 5 failed: Wrong key was accepted.');
  } catch {
    console.log('Test 5 passed: Wrong key rejected.');
  }

  // Test 6: Tampered ciphertext
  const tampered = {
    ...encrypted,
    ciphertext: encrypted.ciphertext.slice(0, -4) + 'AAAA',
  };

  try {
    await decryptData(tampered, key);
    console.error('Test 6 failed: Tampered data was accepted.');
  } catch {
    console.log('Test 6 passed: Tampered data rejected.');
  }

  console.log('All encryption tests completed.');
}

testEncryption().catch(console.error);
