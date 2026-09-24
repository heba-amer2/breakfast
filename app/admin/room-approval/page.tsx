import { redirect } from "next/navigation";

export default function RoomApprovalPage() {
  redirect("/admin/approval-queue");
}
