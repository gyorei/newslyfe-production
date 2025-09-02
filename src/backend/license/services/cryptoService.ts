// src/backend/license/services/cryptoService.ts

import { generateKeyPairSync, createSign, createPrivateKey, KeyObject, createHash } from 'crypto';

/**
 * Minden digitális aláírás és kulcsgenerálás itt történik.
 */
export class CryptoService {
  private privateKey: KeyObject;

  constructor(privateKey: string) {
    if (!privateKey) throw new Error('Private key is required!');
    this.privateKey = createPrivateKey(privateKey);
  }

  public sign(data: string): string {
    const signer = createSign('sha256');
    signer.update(data);
    signer.end();
    return signer.sign(this.privateKey, 'base64');
  }

  public static generateSigningKeys(): { privateKey: string; publicKey: string } {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    return { privateKey, publicKey };
  }
}

export function createKeyHash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}