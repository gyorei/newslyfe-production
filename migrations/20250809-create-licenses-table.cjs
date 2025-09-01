// src/backend/license/models/migrations/20250809-create-licenses-table.js
// npx sequelize-cli db:migrate

'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('licenses', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      license_key: { type: Sequelize.TEXT, allowNull: false, unique: true },
      key_hash: { type: Sequelize.STRING(64), allowNull: false, unique: true },
      recovery_code: { type: Sequelize.STRING(32), allowNull: false, unique: true },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      is_revoked: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      revocation_reason: { type: Sequelize.TEXT, allowNull: true },
      revoked_at: { type: Sequelize.DATE, allowNull: true },
      metadata: { type: Sequelize.JSONB, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('licenses');
  }
};