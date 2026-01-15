// Polyfill TextEncoder/TextDecoder for dependencies and mock thirdweb for tests.

const { TextEncoder, TextDecoder } = require('util');

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Mock thirdweb packages that pull in heavy browser deps in Jest.
jest.mock('@thirdweb-dev/react', () => ({
  ThirdwebProvider: ({ children }) => children,
}));
jest.mock('@thirdweb-dev/chains', () => ({
  Polygon: {},
  Mumbai: {},
}));
