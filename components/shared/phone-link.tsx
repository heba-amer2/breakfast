"use client";

type PhoneLinkProps = {
  phone?: string | null;
  className?: string;
};

export function PhoneLink({ phone, className = "" }: PhoneLinkProps) {
  if (!phone) {
    return <span className={`text-slate-400 ${className}`}>No phone</span>;
  }

  return (
    <a
      href={`tel:${phone}`}
      className={`font-medium text-emerald-600 hover:text-emerald-700 ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      {phone}
    </a>
  );
}
