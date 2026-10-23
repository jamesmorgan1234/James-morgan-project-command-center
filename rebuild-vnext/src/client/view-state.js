export const VIEW_STATE = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  REFRESHING: 'refreshing',
  READY: 'ready',
  STALE: 'stale',
  EMPTY: 'empty',
  OFFLINE: 'offline',
  DEGRADED: 'degraded',
  ERROR: 'error',
  UNAVAILABLE: 'unavailable'
});

export function truthfulValue({ value, verified = false, available = true }) {
  if (!available) return 'N/A';
  if (value === 0 && verified) return 0;
  if (value == null) return 'N/A';
  return verified ? value : 'N/A';
}
