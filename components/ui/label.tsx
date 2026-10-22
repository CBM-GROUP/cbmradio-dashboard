import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  error?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, error, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-xs font-semibold leading-none text-slate-700 dark:text-zinc-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        error && "text-rose-500 dark:text-rose-400",
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };
