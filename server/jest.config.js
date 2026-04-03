module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!jest.config.js',
    '!__tests__/**',
  ],
  testPathIgnorePatterns: ['/node_modules/', '__tests__/setup.js'],
  testTimeout: 15000,
};
