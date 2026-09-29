import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

const fieldBase =
  "focus-ring w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 text-sm text-foreground outline-none transition duration-(--duration-fast) placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-60";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(fieldBase, "min-h-[56px] resize-y leading-6", className)}
      {...props}
    />
  );
});
