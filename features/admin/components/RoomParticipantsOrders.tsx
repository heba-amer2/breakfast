"use client";

export type ParticipantOrderEntry = {
  userName: string;
  items: Array<{
    itemName: string;
    quantity: number;
  }>;
};

type RoomParticipantsOrdersProps = {
  participantMap: ParticipantOrderEntry[];
};

export function RoomParticipantsOrders({
  participantMap,
}: RoomParticipantsOrdersProps) {
  if (participantMap.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm">
      <h2 className="mb-4 text-base font-bold text-slate-900">
        Participant Breakdown ({participantMap.length} people)
      </h2>
      <div className="space-y-3">
        {participantMap.map((p, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5"
          >
            <p className="font-semibold text-slate-900">{p.userName}</p>
            <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
              {p.items.map((it, itIdx) => (
                <li key={itIdx} className="flex items-center gap-2">
                  <span className="font-bold text-emerald-700">
                    {it.quantity}×
                  </span>
                  <span>{it.itemName}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

