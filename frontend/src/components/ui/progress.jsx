import React from "react";
import { cn } from "../../lib/utils";

const Progress = React.forwardRef(({ className, value = 0, max = 100, ...props }, ref) => {
  // Calculate the width percentage
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      />
    </div>
  );
});

Progress.displayName = "Progress";

export { Progress };