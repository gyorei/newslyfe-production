// src\backend\license\controllers\adminController.ts
import { Request, Response } from 'express';
import { KeyService } from '../services/keyService.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     GenerateLicenseRequest:
 *       type: object
 *       properties:
 *         validityMonths:
 *           type: number
 *           description: A licensz érvényességi ideje hónapokban.
 *           example: 12
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           description: A licenszhez tartozó extra funkciók listája.
 *           example: ["feature_A", "feature_B"]
 *         metadata:
 *           type: object
 *           description: Egyedi metaadatok, amik a licenszhez kapcsolódnak.
 *           example: { "companyId": "comp-5678", "tier": "gold" }
 *         subject:
 *           type: string
 *           description: A licensz "tárgya", pl. egy felhasználói vagy eszköz azonosító.
 *           example: "user-jane-doe"
 *     GenerateLicenseResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         license:
 *           type: object
 *           properties:
 *             licenseKey:
 *               type: string
 *               description: Az újonnan generált, aláírt licenszkulcs.
 *             recoveryCode:
 *               type: string
 *               description: A licensz helyreállításához szükséges kód.
 *             expiresAt:
 *               type: string
 *               format: date-time
 *               description: A licensz lejárati dátuma.
 *     RevokeLicenseRequest:
 *       type: object
 *       required:
 *         - keyHash
 *         - reason
 *       properties:
 *         keyHash:
 *           type: string
 *           description: A visszavonandó licenszkulcs SHA256 hash-e.
 *         reason:
 *           type: string
 *           description: A visszavonás oka.
 *     RevokedLicenseResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         license:
 *           type: object
 *           properties:
 *             keyHash:
 *               type: string
 *             isRevoked:
 *               type: boolean
 *             revokedAt:
 *               type: string
 *               format: date-time
 *     RevokedListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         count:
 *           type: integer
 *         revokedKeyHashes:
 *           type: array
 *           items:
 *             type: string
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: A hiba leírása.
 */

/**
 * @swagger
 * tags:
 *   name: Admin - License
 *   description: Licensz adminisztrációs műveletek
 */
export class AdminController {
  constructor(private keyService: KeyService) {}

  /**
   * @swagger
   * /api/admin/license/generate:
   *   post:
   *     summary: Új licenszkulcs generálása és tárolása
   *     tags: [Admin - License]
   *     description: Létrehoz egy új licenszet a megadott paraméterekkel, eltárolja az adatbázisban, és visszaadja a licenszkulcsot, valamint egy helyreállítási kódot.
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GenerateLicenseRequest'
   *     responses:
   *       '201':
   *         description: Sikeres licensz generálás.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/GenerateLicenseResponse'
   *       '400':
   *         description: Érvénytelen kérés (pl. validityMonths nem szám).
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
  public generateLicense = async (req: Request, res: Response): Promise<void> => {
    try {
      const { validityMonths = 12, features = [], metadata = null, subject = null } = req.body;
      if (typeof validityMonths !== 'number' || validityMonths <= 0) {
        res.status(400).json({ success: false, error: 'Invalid parameter: validityMonths must be a positive number.' });
        return;
      }
      const newLicense = await this.keyService.generateAndStoreLicense(
        validityMonths,
        features,
        metadata,
        subject
      );
      res.status(201).json({
        success: true,
        message: 'License key generated and stored successfully.',
        license: {
          licenseKey: newLicense.licenseKey,
          recoveryCode: newLicense.recoveryCode,
          expiresAt: newLicense.expiresAt,
        }
      });
    } catch (error) {
      console.error('License generation failed:', error);
      res.status(500).json({ success: false, error: 'An internal error occurred during license generation.' });
    }
  };

  /**
   * @swagger
   * /api/admin/license/revoke:
   *   post:
   *     summary: Licenszkulcs visszavonása
   *     tags: [Admin - License]
   *     description: Egy meglévő licenszet visszavonott állapotba helyez a hash-e alapján.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RevokeLicenseRequest'
   *     responses:
   *       '200':
   *         description: Sikeres visszavonás.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RevokedLicenseResponse'
   *       '400':
   *         description: Hiányzó vagy érvénytelen paraméterek.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       '404':
   *         description: A megadott hash-sel nem található licensz.
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
  public revokeLicense = async (req: Request, res: Response): Promise<void> => {
    try {
      const { keyHash, reason } = req.body;
      if (!keyHash || typeof keyHash !== 'string' || !reason || typeof reason !== 'string') {
        res.status(400).json({ success: false, error: 'Parameters `keyHash` and `reason` must be non-empty strings.' });
        return;
      }
      const revokedLicense = await this.keyService.revokeLicense(keyHash, reason);
      if (!revokedLicense) {
        res.status(404).json({ success: false, error: 'License with the given hash not found.' });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'License revoked successfully.',
        license: {
          keyHash: revokedLicense.keyHash,
          isRevoked: revokedLicense.isRevoked,
          revokedAt: revokedLicense.revokedAt,
        }
      });
    } catch (error) {
      console.error('License revocation failed:', error);
      res.status(500).json({ success: false, error: 'An internal error occurred.' });
    }
  };

  /**
   * @swagger
   * /api/admin/license/revoked-list:
   *   get:
   *     summary: Visszavont licenszek listája
   *     tags: [Admin - License]
   *     description: Visszaadja az összes visszavont licenszkulcs hash-ét. Ezt a listát használhatja egy kliens alkalmazás a feketelista szinkronizálására.
   *     responses:
   *       '200':
   *         description: A lista sikeresen lekérve.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RevokedListResponse'
   *       '500':
   *         description: Szerver oldali hiba.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  public getRevokedList = async (req: Request, res: Response): Promise<void> => {
    try {
      const hashes = await this.keyService.getRevokedKeyHashes();
      res.status(200).json({
        success: true,
        count: hashes.length,
        revokedKeyHashes: hashes,
      });
    } catch (error) {
      console.error('Failed to get revoked list:', error);
      res.status(500).json({ success: false, error: 'An internal error occurred.' });
    }
  };

  /**
   * @swagger
   * /api/admin/license/list:
   *   get:
   *     summary: Összes licensz listázása
   *     tags: [Admin - License]
   *     description: (NINCS IMPLEMENTÁLVA) Listázza az összes licenszet az adatbázisban. Pagináció szükséges a jövőben.
   *     responses:
   *       '501':
   *         description: A funkció még nincs implementálva.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       '500':
   *         description: Szerver oldali hiba.
   */
  /**
   * Listázza a licenceket (egyelőre egyszerűsített formában).
   * Egy valós alkalmazásban itt paginációra lenne szükség.
   */
  public listLicenses = async (req: Request, res: Response): Promise<void> => {
    try {
      // A service réteget kellene majd meghívni, ami lekérdezi az adatokat.
      // Példaként most csak egy üzenetet adunk vissza.
      // const licenses = await this.keyService.findAllLicenses();
      res.status(501).json({ success: false, message: 'License listing is not fully implemented in service yet.' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error.' });
    }
  };
}