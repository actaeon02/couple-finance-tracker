// src/components/ui/spinner.tsx
import { cn } from "@/lib/utils"; // Assuming you have a utility for merging class names

interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Size of the spinner.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Color of the spinner. Uses Tailwind CSS text colors.
   * @default 'text-primary'
   */
  color?: string;
}

export function Spinner({ className, size = 'md', color = 'text-primary', ...props }: SpinnerProps) {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-10 h-10 border-4',
  }[size];

  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent",
        sizeClass,
        color,
        className
      )}
      role="status"
      aria-label="Loading..."
      {...props}
    />
  );
}