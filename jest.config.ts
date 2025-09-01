// jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testEnvironmentOptions: {
      customExportConditions: ['node', 'node-addons'],
    },
    transform: {
      '^.+\\.(ts|tsx)$': 'babel-jest'
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    roots: ['<rootDir>/src/backend'],
    setupFiles: ['<rootDir>/jest.env.setup.cjs'],
    testMatch: ['**/tests/**/*.test.ts'],
    moduleNameMapper: {
      '^@server/(.*)$': '<rootDir>/src/backend/server/$1',
      '^@license/(.*)$': '<rootDir>/src/backend/license/$1',
      '^@components/(.*)$': '<rootDir>/src/components/$1',
      '^@premium/(.*)$': '<rootDir>/src/components/Utility/Premium/$1'
    },
    globals: {
      'ts-jest': {
        tsconfig: 'tsconfig.server.json'
      }
    }
  };