// src\backend\license\controllers\recoveryController.ts
import { Request, Response } from 'express';
import { KeyService } from '../services/keyService';
import { logger } from '../../server/logger';

/**
 * @swagger
 * components:
 *   schemas:
 *     RecoverLicenseRequest:
 *       type: object
 *       required:
 *         - recoveryCode
 *       properties:
 *         recoveryCode:
 *           type: string
 *           description: A licensz generálásakor kapott helyreállítási kód.
 *           example: "rec_a1b2c3d4e5f6"
 *     RecoverLicenseResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         licenseKey:
 *           type: string
 *           description: A helyreállított, eredeti licenszkulcs.
 *
 * tags:
 *   name: License Recovery
 *   description: Nyilvános végpont a licenszkulcsok helyreállításához
 */
export class RecoveryController {
  constructor(private keyService: KeyService) {}

  /**
   * @swagger
   * /api/recover/license:
   *   post:
   *     summary: Licenszkulcs helyreállítása recovery kóddal
   *     tags: [License Recovery]
   *     description: Egy érvényes, nem visszavont licenszkulcsot ad vissza a hozzá tartozó helyreállítási kód alapján. Ez a végpont rate-limittel védett a visszaélések elkerülése érdekében.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RecoverLicenseRequest'
   *     responses:
   *       '200':
   *         description: Sikeres helyreállítás, a licenszkulcs visszaadva.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RecoverLicenseResponse'
   *       '400':
   *         description: Hiányzó vagy érvénytelen formátumú recovery kód.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       '403':
   *         description: A licensz vissza van vonva, ezért nem állítható helyre.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       '404':
   *         description: A megadott recovery kóddal nem található licensz.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       '500':
   *         description: Szerver oldali hiba.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  public recoverLicense = async (req: Request, res: Response): Promise<void> => {
    try {
      const { recoveryCode } = req.body;
      if (!recoveryCode || typeof recoveryCode !== 'string') {
        res.status(400).json({ success: false, error: 'Parameter `recoveryCode` must be a non-empty string.' });
        return;
      }

      const license = await this.keyService.findLicenseByRecoveryCode(recoveryCode.trim());

      if (!license) {
        res.status(404).json({ success: false, error: 'License not found.' });
        return;
      }
      
      if (license.isRevoked) {
        res.status(403).json({ success: false, error: 'This license has been revoked.' });
        return;
      }

      res.status(200).json({ success: true, licenseKey: license.licenseKey });

    } catch (error) {
      logger.error('License recovery failed:', error);
      res.status(500).json({ success: false, error: 'An internal error occurred.' });
    }
  };
}