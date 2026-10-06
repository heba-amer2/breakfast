"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FiLock, FiPhone } from "react-icons/fi";

import { Button, Input } from "@/components/ui";
import { AuthHeroPanel } from "@/features/auth/components/AuthHeroPanel";
import { LoginSchema, type LoginTypes } from "@/features/auth/schemas/auth";
import { loginUser } from "@/features/auth/store/authThunks";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginTypes>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginTypes) => {
    const result = await dispatch(loginUser({ phone: data.phone, password: data.password }));

    if (loginUser.fulfilled.match(result)) {
      const destination =
        result.payload.role === "ADMIN" ? "/admin" : "/user/dashboard";
      router.push(destination);
    }
  };

  return (
    <main className="flex min-h-screen bg-slate-50">
      <AuthHeroPanel />

      <div className="flex w-full items-center justify-center p-4 sm:p-8 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="mb-1 text-2xl font-bold text-slate-800">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500">
              Sign in to join today&apos;s breakfast order
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
              label="Phone Number"
              type="tel"
              placeholder="01xxxxxxxxx"
              icon={<FiPhone size={16} />}
              error={errors.phone?.message}
              {...register("phone")}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              icon={<FiLock size={16} />}
              error={errors.password?.message}
              {...register("password")}
            />

            <div className="flex justify-end pt-1">
              <Link
                href="/authentication/forgot-password"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Forgot password?
              </Link>
            </div>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="pt-2">
              <Button fullWidth size="lg" type="submit" disabled={isSubmitting || loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New to BreakfastHub?{" "}
            <Link
              href="/authentication/signup"
              className="font-medium text-emerald-600 hover:text-emerald-700"
            >
              Create account
            </Link>
          </p>

          <div className="mt-10 border-t border-slate-100 pt-6">
            <p className="text-center text-xs text-slate-400">
              BreakfastHub Smart Office · Secure internal platform
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
