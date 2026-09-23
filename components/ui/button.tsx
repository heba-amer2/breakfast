import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "accent";
};

const sizeClasses = {
  sm: "h-9 px-3 text-xs sm:text-sm font-medium gap-1.5",
  md: "h-10 px-4 text-sm font-medium gap-2",
  lg: "h-12 px-5 text-base font-semibold gap-2.5",
} as const;

const variantClasses = {
  primary:
    "bg-emerald-600 text-white shadow-xs shadow-emerald-600/20 hover:bg-emerald-700 focus-visible:ring-emerald-500 active:bg-emerald-800",
  accent:"bg-linear-to-r from-emerald-700 to-emerald-900 text-white shadow-xs shadow-emerald-900/20 hover:from-emerald-800 hover:to-emerald-950 focus-visible:ring-emerald-700",
  secondary:
    "bg-white border border-slate-200/90 text-slate-700 hover:bg-emerald-50/50 hover:text-emerald-900 hover:border-emerald-200 shadow-xs focus-visible:ring-emerald-500",
  ghost:
    "bg-transparent text-slate-700 hover:bg-emerald-50/80 hover:text-emerald-900 focus-visible:ring-emerald-500",
  destructive:
    "bg-rose-600 text-white shadow-xs shadow-rose-600/20 hover:bg-rose-700 focus-visible:ring-rose-500",
} as const;

export function Button({
  children,
  fullWidth = false,
  size = "md",
  variant = "primary",
  className = "",
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center rounded-xl transition-all duration-150 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        !disabled ? "active:scale-[0.98] cursor-pointer" : "",
        sizeClasses[size],
        variantClasses[variant],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
