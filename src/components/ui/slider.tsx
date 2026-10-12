"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export function Slider({
  label,
  valueLabel,
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & { label?: string; valueLabel?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-fg-2">{label}</span>
          {valueLabel && <span className="tabular font-mono text-fg">{valueLabel}</span>}
        </div>
      )}
      <SliderPrimitive.Root
        className="relative flex h-4 w-full touch-none select-none items-center"
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1 grow overflow-hidden rounded-full bg-line">
          <SliderPrimitive.Range className="absolute h-full bg-accent" />
        </SliderPrimitive.Track>
        {(props.value ?? props.defaultValue ?? [0]).map((_, i) => (
          <SliderPrimitive.Thumb
            key={i}
            aria-label={label}
            className="block size-3.5 rounded-full border border-line-strong bg-surface shadow-sm outline-none transition-shadow focus-visible:ring-4 focus-visible:ring-accent/25"
          />
        ))}
      </SliderPrimitive.Root>
    </div>
  );
}
