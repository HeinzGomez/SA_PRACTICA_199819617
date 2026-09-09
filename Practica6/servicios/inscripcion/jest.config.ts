import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  maxWorkers: 1,
  cache: false,
  forceExit: true,
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        diagnostics: false,
        isolatedModules: true,
      },
    ],
  },
  moduleNameMapper: {
    "^../config/environment$": "<rootDir>/src/__mocks__/environment.ts",
  },
  collectCoverageFrom: [
    "src/services/**/*.ts",
    "src/controller/**/*.ts",
    "src/repositories/**/*.ts",
    "!src/**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary"],
};

export default config;
