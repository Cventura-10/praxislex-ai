import { memo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MemoizedCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * Memoized card component to prevent unnecessary re-renders
 * Only re-renders when title or children actually change
 */
export const MemoizedCard = memo(function MemoizedCard({
  title,
  children,
  className = "",
}: MemoizedCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  // Only re-render if title or children reference changes
  return (
    prevProps.title === nextProps.title &&
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className
  );
});
