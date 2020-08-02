module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/__tests__/'],
  modulePaths: ['<rootDir>/src/'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverage: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}
