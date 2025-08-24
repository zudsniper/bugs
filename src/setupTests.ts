import '@testing-library/jest-dom';

// Mock html2canvas
jest.mock('html2canvas', () => {
  return jest.fn(() => 
    Promise.resolve({
      toDataURL: () => 'data:image/png;base64,mock-screenshot-data'
    })
  );
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button'
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children
}));

// Mock browser APIs
global.fetch = jest.fn();
global.navigator.clipboard = {
  writeText: jest.fn(() => Promise.resolve()),
  write: jest.fn(() => Promise.resolve()),
};

// Mock console methods
const originalConsole = global.console;
beforeEach(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  };
});

afterEach(() => {
  global.console = originalConsole;
});