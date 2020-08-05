module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src/", "<rootDir>/__tests__/"],
  modulePaths: ["<rootDir>/src/"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  collectCoverage: true,
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFiles: ["<rootDir>/__tests__/setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/__tests__/setup.ts"],
};
