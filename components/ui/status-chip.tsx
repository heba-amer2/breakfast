import type { RoomStatus } from "@/features/rooms/store/roomSlice";

const statusConfig: Record<
  RoomStatus,
  {
    bg: string;
    text: string;
    border: string;
    dotBg: string;
    pulsing?: boolean;
    label: string;
  }
> = {
  OPEN: {
    bg: "bg-emerald-50/90",
    text: "text-emerald-800 font-semibold",
    border: "border-emerald-200 shadow-xs shadow-emerald-500/10",
    dotBg: "bg-emerald-500",
    pulsing: true,
    label: "Open Now",
  },
  CLOSED: {
    bg: "bg-slate-100/90",
    text: "text-slate-700 font-medium",
    border: "border-slate-200/90",
    dotBg: "bg-slate-400",
    label: "Closed",
  },
  PENDING_ADMIN_APPROVAL: {
    bg: "bg-emerald-50/70",
    text: "text-emerald-900 font-medium",
    border: "border-emerald-200/80",
    dotBg: "bg-emerald-600",
    label: "Pending Split",
  },
  APPROVED_AND_CLOSED: {
    bg: "bg-emerald-900",
    text: "text-emerald-50 font-semibold",
    border: "border-emerald-800 shadow-2xs",
    dotBg: "bg-emerald-400",
    label: "Finalized",
  },
};

type StatusChipProps = {
  status?: RoomStatus | string | null;
  className?: string;
  size?: "sm" | "md";
};

export function StatusChip({
  status,
  className = "",
  size = "md",
}: StatusChipProps) {
  const key = (status ?? "CLOSED") as RoomStatus;
  const config = statusConfig[key] ?? statusConfig.CLOSED;
  const label = config.label || String(status ?? "Unknown");

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {config.pulsing ? (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.dotBg}`}
          />
        ) : null}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${config.dotBg}`}
        />
      </span>
      {label}
    </span>
  );
}
