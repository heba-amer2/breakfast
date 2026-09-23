import { redirect } from "next/navigation";

export default function MyBillRedirectPage() {
  redirect("/user/my-orders");
}
