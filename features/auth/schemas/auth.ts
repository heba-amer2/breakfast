import * as zod from "zod";

const phoneSchema = zod
  .string()
  .nonempty("phone number is required")
  .regex(
    /^(\+2)?01[0125][0-9]{8}$/,
    "only Egyptian phone numbers are allowed",
  );

const passwordSchema = zod
  .string()
  .nonempty("Password is required")
  .regex(/^.{8,}$/, "Password must be at least 8 characters")
  .regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter")
  .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
  .regex(
    /[!@#$%^&*]/,
    "Password must contain at least one special character",
  );

export const SignupSchema = zod
  .object({
    name: zod
      .string()
      .nonempty("Name is required")
      .regex(/^[A-Za-z]/, "Username must start with a letter")
      .min(4, "Username must be at least 4 characters")
      .max(20, "Username must not exceed 20 characters"),
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: zod.string().nonempty("Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

//login schema (validation)

export const LoginSchema = zod.object({
  phone: phoneSchema,
  password: zod.string().nonempty("Password is required"),
});

export type SignupTypes = zod.infer<typeof SignupSchema>;
export type LoginTypes = zod.infer<typeof LoginSchema>;
