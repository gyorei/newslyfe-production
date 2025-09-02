import { AppJwtPayload } from '../../auth/utils/token';

declare global {
  namespace Express {
    export interface Request {
      user?: AppJwtPayload;
    }
  }
}
