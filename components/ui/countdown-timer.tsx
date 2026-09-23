"use client";

import { useEffect, useRef, useState } from "react";
import { FiClock } from "react-icons/fi";

function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type CountdownTimerProps = {
  secondsRemaining?: number | null;
  expiresAt?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  pill?: boolean;
  onExpire?: () => void;
};

export function CountdownTimer({
  secondsRemaining,
  expiresAt,
  className = "",
  size = "sm",
  showIcon = false,
  pill = false,
  onExpire,
}: CountdownTimerProps) {
  const calculateRemaining = () => {
    if (typeof secondsRemaining === "number") {
      return Math.max(0, Math.floor(secondsRemaining));
    }
    if (expiresAt) {
      const expireMs = new Date(expiresAt).getTime();
      if (!Number.isNaN(expireMs)) {
        return Math.max(0, Math.floor((expireMs - Date.now()) / 1000));
      }
    }
    return 0;
  };

  const [remaining, setRemaining] = useState<number>(calculateRemaining);
  const onExpireRef = useRef(onExpire);
  const hasTriggeredExpireRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const next = calculateRemaining();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(next);
    if (next > 0) {
      hasTriggeredExpireRef.current = false;
    }

    const id = window.setInterval(() => {
      setRemaining((value) => {
        const nextVal = Math.max(0, value - 1);
        if (nextVal === 0 && !hasTriggeredExpireRef.current) {
          hasTriggeredExpireRef.current = true;
          onExpireRef.current?.();
        }
        return nextVal;
      });
    }, 1000);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsRemaining, expiresAt]);

  const critical = remaining > 0 && remaining <= 300; // Under 5 mins
  const urgent = remaining > 300 && remaining <= 900; // Under 15 mins
  const expired = remaining <= 0;

  const colorClass = expired
    ? "text-slate-400"
    : critical
      ? "text-rose-600 font-bold"
      : urgent
        ? "text-amber-600 font-semibold"
        : "text-slate-700 font-medium";

  const sizeClass =
    size === "lg"
      ? "text-2xl"
      : size === "md"
        ? "text-base"
        : "text-sm";

  const pillClass = pill
    ? expired
      ? "bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full text-xs"
      : critical
        ? "bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-full text-xs shadow-xs"
        : urgent
          ? "bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full text-xs"
          : "bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full text-xs"
    : "";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono tabular-nums tracking-tight transition-colors ${sizeClass} ${colorClass} ${pillClass} ${className}`}
    >
      {showIcon ? (
        <FiClock
          size={size === "lg" ? 20 : 14}
          className={critical ? "animate-pulse text-rose-500" : "text-slate-400"}
        />
      ) : null}
      <span>{expired ? "Expired" : formatCountdown(remaining)}</span>
    </span>
  );
}
