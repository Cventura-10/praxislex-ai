/**
 * Performance utilities for PraxisLex
 * Monitors and optimizes application performance
 */

/**
 * Debounce function to limit execution rate
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to ensure maximum execution rate
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Measure component render performance
 */
export function measureRenderTime(componentName: string) {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (renderTime > 16) { // More than one frame (60fps)
      console.warn(
        `[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render`
      );
    }
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get network information
 */
export function getNetworkInfo() {
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

  if (!connection) {
    return { effectiveType: 'unknown', downlink: null };
  }

  return {
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || null,
  };
}

/**
 * Lazy load image with intersection observer
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  placeholder?: string
) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        img.src = src;
        observer.unobserve(img);
      }
    });
  });

  if (placeholder) {
    img.src = placeholder;
  }

  observer.observe(img);

  return () => observer.unobserve(img);
}

/**
 * Batch multiple state updates
 */
export function batchUpdates<T>(
  updates: Array<() => T>,
  delay: number = 0
): Promise<T[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const results = updates.map(update => update());
      resolve(results);
    }, delay);
  });
}

/**
 * Check if device has low memory
 */
export function isLowMemoryDevice(): boolean {
  const memory = (performance as any).memory;
  
  if (!memory) return false;

  // Consider device low memory if less than 4GB total
  const totalMemoryGB = memory.jsHeapSizeLimit / (1024 ** 3);
  return totalMemoryGB < 4;
}

/**
 * Request idle callback wrapper
 */
export function runWhenIdle(
  callback: () => void,
  options?: { timeout?: number }
): number {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  
  // Fallback for browsers without requestIdleCallback
  return Number(setTimeout(callback, 1));
}

/**
 * Cancel idle callback
 */
export function cancelIdleCallback(id: number): void {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}
