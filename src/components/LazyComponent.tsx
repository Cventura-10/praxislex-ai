import { ReactNode } from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

/**
 * Wrapper component for lazy loading content on viewport intersection
 */
export function LazyComponent({ 
  children, 
  fallback = <Skeleton className="h-32 w-full" />,
  className = ""
}: LazyComponentProps) {
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
  });

  return (
    <div ref={elementRef} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}
