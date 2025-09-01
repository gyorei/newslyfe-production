// migrations/20250810-create-audit-logs-table.cjs
'use strict';

/**
 * Audit log tábla migráció (ipari szintű, PostgreSQL)
 * Ez a tábla minden kritikus licensz műveletet naplóz: generálás, visszavonás, helyreállítás stb.
 npx sequelize-cli db:migrate
*/

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      action: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      key_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      admin_id: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      client_ip: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      result: {
        type: Sequelize.STRING(16),
        allowNull: false,
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('audit_logs');
  },
};
