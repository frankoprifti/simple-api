module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};