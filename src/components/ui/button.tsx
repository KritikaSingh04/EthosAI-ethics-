import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-fg text-bg hover:bg-fg/85",
        secondary: "border border-line bg-surface text-fg hover:bg-surface-2",
        ghost: "text-fg-2 hover:bg-surface-2 hover:text-fg",
        danger: "bg-critical text-white hover:bg-critical/90",
      },
      size: {
        sm: "h-7 px-2.5",
        md: "h-8 px-3",
        icon: "size-8",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof button>) {
  return <button className={cn(button({ variant, size }), className)} {...props} />;
}
