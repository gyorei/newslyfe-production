// src/backend/license/services/keyService.ts

import { CryptoService, createKeyHash } from './cryptoService.js';
import { License } from '../models/licenseModel.js';
import crypto from 'crypto';

export class KeyService {
  private cryptoService: CryptoService;

  constructor(privateKey: string) {
    this.cryptoService = new CryptoService(privateKey);
  }

  /**
   * Generál egy aláírt licencet, elmenti az adatbázisba, és visszaadja a teljes mentett entitást.
   */
  public async generateAndStoreLicense(
    validityMonths: number,
    features: string[] = [],
    metadata: Record<string, unknown> | null = null,
    subject?: string
  ): Promise<License> {
    const now = new Date();
    const expiryDate = new Date(new Date().setMonth(now.getMonth() + validityMonths));
    const payload = {
      exp: expiryDate.toISOString(),
      features,
      iat: new Date().toISOString(),
      ...(subject && { sub: subject }),
    };
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = this.cryptoService.sign(base64Payload);
    const licenseKey = `${base64Payload}.${signature}`;
    const recoveryCode = this.generateRecoveryCode();
    const keyHash = createKeyHash(licenseKey);
    return await License.create({
      licenseKey,
      keyHash,
      recoveryCode,
      expiresAt: expiryDate,
      metadata,
    });
  }

  public async revokeLicense(keyHash: string, reason: string): Promise<License | null> {
    const license = await License.findOne({ where: { keyHash } });
    if (!license) return null;
    if (license.isRevoked) return license;
    license.isRevoked = true;
    license.revocationReason = reason;
    license.revokedAt = new Date();
    await license.save();
    return license;
  }

  public async getRevokedKeyHashes(): Promise<string[]> {
    const revokedLicenses = await License.findAll({
      where: { isRevoked: true },
      attributes: ['keyHash'],
    });
    return revokedLicenses.map(l => l.keyHash);
  }

  public async findLicenseByRecoveryCode(recoveryCode: string): Promise<License | null> {
    return await License.findOne({ where: { recoveryCode } });
  }

  private generateRecoveryCode(): string {
    return crypto.randomBytes(12)
      .toString('hex')
      .toUpperCase()
      .match(/.{1,4}/g)!
      .join('-');
  }
}