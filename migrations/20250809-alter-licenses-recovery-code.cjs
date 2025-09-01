'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('licenses', 'recovery_code', {
      type: Sequelize.STRING(32),
      allowNull: false,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('licenses', 'recovery_code', {
      type: Sequelize.STRING(19),
      allowNull: false,
      unique: true,
    });
  },
};
