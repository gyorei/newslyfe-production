// src\backend\license\routes\adminRoutes.ts
import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { KeyService } from '../services/keyService';
import { adminAuthMiddleware } from '../middlewares/authMiddleware';

export function createAdminRoutes(keyService: KeyService): Router {
  const router = Router();
  const controller = new AdminController(keyService);
  router.use(adminAuthMiddleware);
  router.post('/generate', controller.generateLicense);
  router.post('/revoke', controller.revokeLicense);
  router.get('/revoked-list', controller.getRevokedList);
  router.get('/list', controller.listLicenses);
  return router;
}