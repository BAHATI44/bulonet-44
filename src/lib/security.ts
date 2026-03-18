/**
 * BULONET Security Utilities
 * Input validation, sanitization, and security helpers
 */

// Sanitize string input - remove potential XSS vectors
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove inline event handlers
    .replace(/data:\s*text\/html/gi, '') // Remove data:text/html
    .trim();
};

// Sanitize URL - only allow http/https
export const sanitizeUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

// Rate limiter for client-side operations
export class RateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60_000
  ) {}

  check(key: string): { allowed: boolean; remainingAttempts: number; retryAfterMs: number } {
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry || now > entry.resetAt) {
      this.attempts.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remainingAttempts: this.maxAttempts - 1, retryAfterMs: 0 };
    }

    if (entry.count >= this.maxAttempts) {
      return { allowed: false, remainingAttempts: 0, retryAfterMs: entry.resetAt - now };
    }

    entry.count++;
    return { allowed: true, remainingAttempts: this.maxAttempts - entry.count, retryAfterMs: 0 };
  }

  reset(key: string) {
    this.attempts.delete(key);
  }
}

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
};

// Generate a nonce for CSP
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
};

// Detect common injection patterns
export const detectInjection = (input: string): boolean => {
  const patterns = [
    /(<script[\s>])/i,
    /(union\s+select)/i,
    /(drop\s+table)/i,
    /(insert\s+into)/i,
    /(delete\s+from)/i,
    /(--\s*$)/,
    /(\/\*.*\*\/)/,
    /(\b(eval|exec|execute)\s*\()/i,
  ];
  return patterns.some((p) => p.test(input));
};

// Prevent right-click context menu (anti-copy)
export const disableContextMenu = () => {
  document.addEventListener('contextmenu', (e) => e.preventDefault());
};

// Prevent text selection (anti-copy) 
export const disableTextSelection = () => {
  document.addEventListener('selectstart', (e) => e.preventDefault());
};

// Prevent keyboard shortcuts for copy/save/inspect
export const disableDevShortcuts = () => {
  document.addEventListener('keydown', (e) => {
    // Ctrl+U (view source), Ctrl+S (save), Ctrl+Shift+I (devtools)
    if (
      (e.ctrlKey && e.key === 'u') ||
      (e.ctrlKey && e.key === 's') ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.shiftKey && e.key === 'J') ||
      (e.ctrlKey && e.shiftKey && e.key === 'C') ||
      e.key === 'F12'
    ) {
      e.preventDefault();
    }
  });
};

// Anti-iframe: prevent site from being embedded in iframes
export const preventFraming = () => {
  if (window.top !== window.self) {
    // Allow lovable preview frames
    try {
      if (!document.referrer.includes('lovable.app') && !document.referrer.includes('localhost')) {
        window.top!.location.href = window.self.location.href;
      }
    } catch {
      // Cross-origin - can't access top, which means we're framed by external site
    }
  }
};
