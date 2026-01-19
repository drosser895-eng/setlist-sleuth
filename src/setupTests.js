// Polyfill TextEncoder/TextDecoder for Jest environment
const { TextEncoder, TextDecoder } = require('util');
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Mock thirdweb packages that pull in heavy browser-only deps
jest.mock('@thirdweb-dev/react', () => ({
  ThirdwebProvider: ({ children }) => children,
}));

jest.mock('@thirdweb-dev/chains', () => ({
  Polygon: {},
  Mumbai: {},
}));
