import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-emerald-500/25 bg-emerald-50 text-emerald-700 border dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
        secondary:
          "border-slate-200 bg-slate-100 text-slate-800 dark:border-transparent dark:bg-slate-800 dark:text-slate-200",
        destructive:
          "border-rose-500/25 bg-rose-50 text-rose-700 border dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30",
        outline: "text-slate-700 border-slate-300 dark:text-slate-200 dark:border-slate-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
