export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '').replace(/data:\s*text\/html/gi, '').trim();
};

export const sanitizeUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch { return null; }
};

export const isValidEmail = (email: string): boolean => {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) && email.length <= 255;
};

export const detectInjection = (input: string): boolean => {
  const patterns = [/(<script[\s>])/i, /(union\s+select)/i, /(drop\s+table)/i, /(insert\s+into)/i, /(delete\s+from)/i, /(--\s*$)/, /(\/\*.*\*\/)/, /(\b(eval|exec|execute)\s*\()/i];
  return patterns.some((p) => p.test(input));
};

export const disableContextMenu = () => {
  document.addEventListener('contextmenu', (e) => e.preventDefault());
};

export const disableTextSelection = () => {
  document.addEventListener('selectstart', (e) => e.preventDefault());
};

export const disableDevShortcuts = () => {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.key === 'u') || (e.ctrlKey && e.key === 's') || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.shiftKey && e.key === 'J') || (e.ctrlKey && e.shiftKey && e.key === 'C') || e.key === 'F12') {
      e.preventDefault();
    }
  });
};

export const preventFraming = () => {
  if (window.top !== window.self) {
    try {
      const referrer = document.referrer || '';
      if (!referrer.includes('lovable.app') && !referrer.includes('localhost')) {
        window.top!.location.href = window.self.location.href;
      }
    } catch { /* cross-origin */ }
  }
};

export const detectDevTools = (callback: (isOpen: boolean) => void): void => {
  const threshold = 100;
  const check = () => {
    const start = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    const end = performance.now();
    callback(end - start > threshold);
  };
  check();
  setInterval(check, 2000);
};

export class RateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map();
  constructor(private maxAttempts: number = 5, private windowMs: number = 60_000) {}
  check(key: string) {
    const now = Date.now();
    const entry = this.attempts.get(key);
    if (!entry || now > entry.resetAt) { this.attempts.set(key, { count: 1, resetAt: now + this.windowMs }); return { allowed: true, remainingAttempts: this.maxAttempts - 1, retryAfterMs: 0 }; }
    if (entry.count >= this.maxAttempts) { return { allowed: false, remainingAttempts: 0, retryAfterMs: entry.resetAt - now }; }
    entry.count++;
    return { allowed: true, remainingAttempts: this.maxAttempts - entry.count, retryAfterMs: 0 };
  }
  reset(key: string) { this.attempts.delete(key); }
}

export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
};

export const enableSecurity = () => {
  if (import.meta.env.PROD) {
    preventFraming();
    disableContextMenu();
    disableTextSelection();
    disableDevShortcuts();
  }
};

export const isValidName = (name: string): boolean => /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/.test(name.trim());
export const isValidPhone = (phone: string): boolean => /^\+?[0-9]{8,15}$/.test(phone.replace(/[\s\-]/g, ''));
