import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-800">Unauthorized</h1>
      <p className="text-sm text-slate-500">
        You do not have permission to access this page.
      </p>
      <Link
        href="/authentication/login"
        className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
      >
        Go to login
      </Link>
    </main>
  );
}
