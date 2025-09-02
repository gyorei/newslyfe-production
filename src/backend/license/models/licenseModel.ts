// src\backend\license\models\licenseModel.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../utils/db';

// Attribútumok TypeScript oldalon (camelCase)
export interface LicenseAttributes {
  id: number;
  licenseKey: string;
  keyHash: string;
  recoveryCode: string;
  expiresAt: Date;
  isRevoked: boolean;
  revocationReason: string | null;
  revokedAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

type LicenseCreationAttributes = Optional<LicenseAttributes, 'id' | 'isRevoked' | 'revocationReason' | 'revokedAt' | 'metadata' | 'createdAt' | 'updatedAt'>;

export class License extends Model<LicenseAttributes, LicenseCreationAttributes> implements LicenseAttributes {
  public id!: number;
  public licenseKey!: string;
  public keyHash!: string;
  public recoveryCode!: string;
  public expiresAt!: Date;
  public isRevoked!: boolean;
  public revocationReason!: string | null;
  public revokedAt!: Date | null;
  public metadata!: Record<string, unknown> | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

License.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    licenseKey: {
      type: DataTypes.TEXT, // TEXT, mert a kulcs hosszú lehet
      allowNull: false,
      unique: true,
      field: 'license_key',
    },
    keyHash: {
      type: DataTypes.STRING(64), // SHA-256 hash
      allowNull: false,
      unique: true,
      field: 'key_hash',
    },
    recoveryCode: {
      type: DataTypes.STRING(32), // egyezzen a migrációval és az adatbázissal!
      allowNull: false,
      unique: true,
      field: 'recovery_code',
    },


    expiresAt: {
      type: DataTypes.DATE, // Sequelize ezt TIMESTAMPTZ-ként kezeli PostgreSQL-ben
      allowNull: false,
      field: 'expires_at',
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_revoked',
    },
    revocationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'revocation_reason',
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'revoked_at',
    },
    metadata: {
      type: DataTypes.JSONB, // PostgreSQL specifikus
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    }
  },
  {
    sequelize,
    tableName: 'licenses',
    timestamps: true,
    underscored: true, // Automatikusan snake_case-re vált
  }
);
