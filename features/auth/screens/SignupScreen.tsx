"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FiCheckCircle, FiLock, FiPhone, FiUser } from "react-icons/fi";

import { Button, Input } from "@/components/ui";
import { AuthHeroPanel } from "@/features/auth/components/AuthHeroPanel";
import { SignupSchema, type SignupTypes } from "@/features/auth/schemas/auth";
import { registerUser } from "@/features/auth/store/authThunks";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";

export default function SignupScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupTypes>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      name: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupTypes) => {
    const result = await dispatch(
      registerUser({
        name: data.name,
        phone: data.phone,
        password: data.password,
      }),
    );

    if (registerUser.fulfilled.match(result)) {
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
              Create your account
            </h1>
            <p className="text-sm text-slate-500">
              Join your office breakfast community
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
              label="Full Name"
              placeholder="Jane Doe"
              icon={<FiUser size={16} />}
              error={errors.name?.message}
              {...register("name")}
            />

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
              placeholder="Min. 8 characters"
              icon={<FiLock size={16} />}
              error={errors.password?.message}
              {...register("password")}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              icon={<FiCheckCircle size={16} />}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="pt-2">
              <Button fullWidth size="lg" type="submit" disabled={isSubmitting || loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/authentication/login"
              className="font-medium text-emerald-600 hover:text-emerald-700"
            >
              Sign in
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
