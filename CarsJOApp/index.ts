import 'expo-router/entry';
import { Alert } from 'react-native';

const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  originalConsoleError(...args);
};

if (!__DEV__) {
  const globalErrorHandler = (error: any) => {
    console.warn('Caught global error:', error?.message || error);
    return true;
  };
  const globalRejectionHandler = (event: any) => {
    console.warn('Caught unhandled rejection:', event?.reason?.message || event?.reason);
    event.preventDefault?.();
    return true;
  };
  if (typeof globalThis !== 'undefined') {
    globalThis.ErrorUtils?.setGlobalHandler?.(globalErrorHandler);
  }
  if (typeof ErrorUtils !== 'undefined') {
    ErrorUtils.setGlobalHandler(globalErrorHandler);
  }
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).addEventListener?.('unhandledrejection', globalRejectionHandler);
  }
}
