// src\backend\license\routes\recoveryRoutes.ts
import { Router } from 'express';
import { RecoveryController } from '../controllers/recoveryController';

export function createRecoveryRoutes(controller: RecoveryController): Router {
  const router = Router();
  
  // A kontroller recoverLicense metódusát kötjük a POST / végponthoz
  router.post('/', controller.recoverLicense);
  
  return router;
}