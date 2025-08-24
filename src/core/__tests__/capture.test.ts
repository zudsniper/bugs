import { BugReportCapture } from '../capture';

describe('BugReportCapture', () => {
  let capture: BugReportCapture;

  beforeEach(() => {
    capture = new BugReportCapture();
    jest.clearAllMocks();
  });

  afterEach(() => {
    capture.stopCapturing();
  });

  describe('console capture', () => {
    it('should capture console logs when capturing is started', () => {
      capture.startCapturing();
      
      console.log('test message', { data: 'test' });
      
      const logs = capture.getConsoleLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('test message [object Object]');
      expect(logs[0].level).toBe('log');
    });

    it('should not capture console logs when capturing is stopped', () => {
      console.log('test message before start');
      
      const logs = capture.getConsoleLogs();
      expect(logs).toHaveLength(0);
    });

    it('should limit console logs to max count', () => {
      capture.updateOptions({ maxConsoleLogs: 2 });
      capture.startCapturing();
      
      console.log('message 1');
      console.log('message 2');
      console.log('message 3');
      
      const logs = capture.getConsoleLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe('message 2');
      expect(logs[1].message).toBe('message 3');
    });

    it('should capture different log levels', () => {
      capture.startCapturing();
      
      console.log('info message');
      console.warn('warning message');
      console.error('error message');
      
      const logs = capture.getConsoleLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].level).toBe('log');
      expect(logs[1].level).toBe('warn');
      expect(logs[2].level).toBe('error');
    });
  });

  describe('network capture', () => {
    beforeEach(() => {
      // Mock fetch
      global.fetch = jest.fn();
    });

    it('should capture fetch requests', async () => {
      const mockResponse = {
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('100')
        }
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      capture.startCapturing();
      
      await fetch('https://api.example.com/test');
      
      const requests = capture.getNetworkRequests();
      expect(requests).toHaveLength(1);
      expect(requests[0].method).toBe('GET');
      expect(requests[0].url).toBe('https://api.example.com/test');
      expect(requests[0].status).toBe(200);
    });

    it('should sanitize sensitive URL parameters', async () => {
      const mockResponse = { status: 200, headers: { get: jest.fn() } };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      capture.startCapturing();
      
      await fetch('https://api.example.com/test?token=secret123&data=safe');
      
      const requests = capture.getNetworkRequests();
      expect(requests[0].url).toBe('https://api.example.com/test?token=[REDACTED]&data=safe');
    });

    it('should limit network requests to max count', async () => {
      const mockResponse = { status: 200, headers: { get: jest.fn() } };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      capture.updateOptions({ maxNetworkRequests: 2 });
      capture.startCapturing();
      
      await fetch('https://api.example.com/1');
      await fetch('https://api.example.com/2');
      await fetch('https://api.example.com/3');
      
      const requests = capture.getNetworkRequests();
      expect(requests).toHaveLength(2);
      expect(requests[0].url).toBe('https://api.example.com/2');
      expect(requests[1].url).toBe('https://api.example.com/3');
    });
  });

  describe('screenshot capture', () => {
    it('should capture screenshot', async () => {
      const screenshot = await capture.captureScreenshot();
      expect(screenshot).toBe('data:image/png;base64,mock-screenshot-data');
    });

    it('should return undefined when screenshot capture fails', async () => {
      const html2canvas = require('html2canvas');
      html2canvas.mockRejectedValueOnce(new Error('Capture failed'));
      
      const screenshot = await capture.captureScreenshot();
      expect(screenshot).toBeUndefined();
    });
  });

  describe('report generation', () => {
    it('should generate complete bug report', async () => {
      capture.startCapturing();
      
      console.log('test log');
      await fetch('https://api.example.com/test');
      
      const report = await capture.captureReport({
        title: 'Test Bug',
        description: 'Test description',
        userEmail: 'test@example.com'
      });

      expect(report.title).toBe('Test Bug');
      expect(report.description).toBe('Test description');
      expect(report.userEmail).toBe('test@example.com');
      expect(report.consoleLogs).toHaveLength(1);
      expect(report.networkRequests).toHaveLength(1);
      expect(report.screenshot).toBe('data:image/png;base64,mock-screenshot-data');
      expect(report.timestamp).toBeGreaterThan(0);
      expect(report.url).toBe('http://localhost/');
    });
  });

  describe('configuration updates', () => {
    it('should update capture options', () => {
      const newOptions = {
        maxConsoleLogs: 100,
        maxNetworkRequests: 50,
        sensitiveParams: ['secret', 'key']
      };
      
      capture.updateOptions(newOptions);
      capture.startCapturing();
      
      // Test that new options are applied
      for (let i = 0; i < 110; i++) {
        console.log(`message ${i}`);
      }
      
      const logs = capture.getConsoleLogs();
      expect(logs).toHaveLength(100);
    });
  });
});