import { redirect } from "next/navigation";

export default function ReceiptEntryPage() {
  redirect("/admin/approval-queue");
}
