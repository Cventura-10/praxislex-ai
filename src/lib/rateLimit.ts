/**
 * Client-side Rate Limiting
 * Prevents abuse by limiting action frequency
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 60000, // 1 minute
};

class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  /**
   * Check if action is rate limited
   */
  check(key: string, config: Partial<RateLimitConfig> = {}): boolean {
    const { maxAttempts, windowMs } = { ...DEFAULT_CONFIG, ...config };
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing attempts for this key
    const keyAttempts = this.attempts.get(key) || [];
    
    // Filter out old attempts outside the window
    const recentAttempts = keyAttempts.filter(time => time > windowStart);
    
    // Check if limit exceeded
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }

    // Add new attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);

    return true;
  }

  /**
   * Reset attempts for a key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Get remaining attempts
   */
  getRemaining(key: string, config: Partial<RateLimitConfig> = {}): number {
    const { maxAttempts, windowMs } = { ...DEFAULT_CONFIG, ...config };
    const now = Date.now();
    const windowStart = now - windowMs;

    const keyAttempts = this.attempts.get(key) || [];
    const recentAttempts = keyAttempts.filter(time => time > windowStart);

    return Math.max(0, maxAttempts - recentAttempts.length);
  }

  /**
   * Clean up old entries periodically
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, attempts] of this.attempts.entries()) {
      const validAttempts = attempts.filter(time => time > now - DEFAULT_CONFIG.windowMs);
      if (validAttempts.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, validAttempts);
      }
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Cleanup old entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}

/**
 * Rate limit configurations for different actions
 */
export const RATE_LIMITS = {
  // Login attempts
  LOGIN: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 min
  
  // API calls
  API_CALL: { maxAttempts: 100, windowMs: 60 * 1000 }, // 100 per minute
  
  // Document generation
  GENERATE_DOC: { maxAttempts: 10, windowMs: 60 * 1000 }, // 10 per minute
  
  // Search
  SEARCH: { maxAttempts: 30, windowMs: 60 * 1000 }, // 30 per minute
  
  // File upload
  FILE_UPLOAD: { maxAttempts: 20, windowMs: 60 * 1000 }, // 20 per minute
  
  // Password reset
  PASSWORD_RESET: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
};
