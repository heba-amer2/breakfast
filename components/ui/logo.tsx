type LogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-14 w-14 text-xl",
} as const;

export function Logo({ size = "md", className = "" }: LogoProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`flex items-center justify-center rounded-2xl bg-emerald-600 font-bold text-white shadow-sm ${sizeClasses[size]}`}
        aria-hidden
      >
        SO
      </div>
      <span className="text-sm font-semibold tracking-tight text-slate-800">
        Smart Office Breakfast
      </span>
    </div>
  );
}
