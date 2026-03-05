module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testTimeout: 15000,
};
