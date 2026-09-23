import {
  forwardRef,
  type ChangeEventHandler,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label?: string;
  icon?: ReactNode;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement> | ((value: string) => void);
  error?: string;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    icon,
    value,
    onChange,
    error,
    hint,
    className = "",
    id,
    ...props
  },
  ref,
) {
  const inputId = id ?? props.name ?? label?.toLowerCase().replace(/\s+/g, "-");

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (typeof onChange !== "function") {
      return;
    }

    if (typeof value !== "undefined") {
      (onChange as (value: string) => void)(event.target.value);
      return;
    }

    (onChange as ChangeEventHandler<HTMLInputElement>)(event);
  };

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        {icon ? (
          <span
            className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400 transition-colors"
            aria-hidden
          >
            {icon}
          </span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          className={[
            "h-11 w-full rounded-xl border bg-white text-sm text-slate-900 shadow-2xs outline-none transition-all duration-150",
            "placeholder:text-slate-400",
            "focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15 focus:bg-white",
            error
              ? "border-rose-300 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-rose-500/15"
              : "border-slate-200/90 hover:border-slate-300",
            icon ? "pl-10 pr-3.5" : "px-3.5",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
          {...(value !== undefined ? { value } : {})}
          onChange={handleChange}
        />
      </div>

      {error ? (
        <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
});
