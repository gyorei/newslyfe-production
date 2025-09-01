// src/premium/wasm/validatorLoader.ts
// WASM validátor loader Vite-kompatibilis módon
// A WASM csomag (pkg) tartalmát ide kell bemásolni: src/premium/wasm/pkg
// Például: licenseValidator.js, licenseValidator_bg.wasm, licenseValidator.d.ts

import init, { validate_signature, alloc, dealloc } from './pkg/licenseValidator.js';
import { Buffer } from 'buffer';

let wasmMemory: WebAssembly.Memory | null = null;
let wasmInitPromise: Promise<void> | null = null;

const initializeWasmOnce = (): Promise<void> => {
  if (wasmInitPromise === null) {
    wasmInitPromise = init()
      .then((instance: any) => {
        // A wasm-pack által visszaadott példányból kinyerjük a memóriát
        wasmMemory = instance.memory || (instance.exports && instance.exports.memory);
        if (!wasmMemory) {
          throw new Error('WASM Memory object could not be accessed after initialization.');
        }
        console.log('✅ WebAssembly License Validator initialized, memory is ready.');
      })
      .catch((error: unknown) => {
        console.error('❌ Failed to initialize WASM Validator:', error);
        wasmInitPromise = null;
        throw error;
      });
  }
  return wasmInitPromise;
};

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function base64ToUint8Array(base64: string): Uint8Array {
  return Buffer.from(base64, 'base64');
}

export async function validateLicense(licenseKey: string, publicKey: string): Promise<boolean> {
  await initializeWasmOnce();
  if (!wasmMemory) {
    throw new Error('WASM memory is not available. Initialization might have failed.');
  }

  const parts = licenseKey.split('.');
  if (parts.length !== 2) {
    console.error('Invalid license key format.');
    return false;
  }
  const [base64Payload, base64Signature] = parts;

  const publicKeyBytes = stringToUint8Array(publicKey);
  const payloadBytes = base64ToUint8Array(base64Payload);
  const signatureBytes = base64ToUint8Array(base64Signature);

  let publicKeyPtr = 0, payloadPtr = 0, signaturePtr = 0;

  try {
    publicKeyPtr = alloc(publicKeyBytes.length);
    payloadPtr = alloc(payloadBytes.length);
    signaturePtr = alloc(signatureBytes.length);

    new Uint8Array(wasmMemory.buffer, publicKeyPtr, publicKeyBytes.length).set(publicKeyBytes);
    new Uint8Array(wasmMemory.buffer, payloadPtr, payloadBytes.length).set(payloadBytes);
    new Uint8Array(wasmMemory.buffer, signaturePtr, signatureBytes.length).set(signatureBytes);

    const resultCode = validate_signature(
      publicKeyPtr, publicKeyBytes.length,
      signaturePtr, signatureBytes.length,
      payloadPtr, payloadBytes.length
    );

    return resultCode === 1;
  } catch (error) {
    console.error('WASM validation bridge error:', error);
    return false;
  } finally {
    if (publicKeyPtr) dealloc(publicKeyPtr, publicKeyBytes.length);
    if (payloadPtr) dealloc(payloadPtr, payloadBytes.length);
    if (signaturePtr) dealloc(signaturePtr, signatureBytes.length);
  }
}
