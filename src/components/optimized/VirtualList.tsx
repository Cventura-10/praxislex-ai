import { useRef, useState, useEffect, ReactNode } from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
}

/**
 * Virtual list component for rendering large lists efficiently
 * Only renders visible items plus overscan buffer
 */
export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  className = "",
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const handleResize = () => {
      setContainerHeight(container.clientHeight);
    };

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    
    // Initial height
    setContainerHeight(container.clientHeight);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Calculate visible range
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / itemHeight) - overscan
  );
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: "100%" }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            willChange: "transform",
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface InfiniteScrollProps {
  children: ReactNode;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  loader?: ReactNode;
  threshold?: number;
}

/**
 * Infinite scroll component
 * Triggers onLoadMore when sentinel comes into view
 */
export function InfiniteScroll({
  children,
  onLoadMore,
  hasMore,
  isLoading,
  loader,
  threshold = 0.5,
}: InfiniteScrollProps) {
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold,
    freezeOnceVisible: false,
  });

  useEffect(() => {
    if (isVisible && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [isVisible, hasMore, isLoading, onLoadMore]);

  return (
    <>
      {children}
      {hasMore && (
        <div ref={elementRef} className="py-4 text-center">
          {isLoading && (loader || <p>Cargando más...</p>)}
        </div>
      )}
    </>
  );
}
