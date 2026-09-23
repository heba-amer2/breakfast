"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FiCheckCircle, FiLock, FiPhone, FiUser } from "react-icons/fi";

import { Button, Input } from "@/components/ui";
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
      <div className="relative hidden w-1/2 flex-col items-start justify-center overflow-hidden p-12 lg:flex">
        <Image
          src="/assets/breakfast-signup.jpg"
          alt="Office breakfast table with coffee and food"
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />

        <div className="absolute inset-0 bg-linear-to-br from-emerald-950/85 via-emerald-900/65 to-amber-800/45" />

        <div className="absolute inset-0 opacity-25">
          <div className="absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-amber-100/20" />
          <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-emerald-100/15" />
        </div>

        <div className="relative z-10 text-left">
          <h2 className="mb-4 text-4xl font-bold leading-tight text-white">
            Good morning,
            <br />
            let&apos;s order
            <br />
            breakfast together.
          </h2>

          <p className="max-w-xs text-base leading-relaxed text-emerald-50">
            Join your team&apos;s breakfast room, pick your favorites, and
            split the bill automatically.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-6 sm:p-8 lg:w-1/2">
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
