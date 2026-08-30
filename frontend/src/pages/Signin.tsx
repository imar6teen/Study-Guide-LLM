import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema } from "../types";
import Icon from "../components/Icon";
import SignInForm from "../components/SignInForm";
import useAuthStore from "../hooks/useAuthStore";
import useGetMe from "../hooks/useGetMe";
import { useState, useEffect } from "react";
import ROUTES from "../constants/routes";
import signin from "../helpers/signin";

function Signin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isVerified = searchParams.has("verified");

  useGetMe();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.CHAT);
      return;
    }

    (() => setLoading(false))();
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof loginSchema>> = async (
    data: z.infer<typeof loginSchema>
  ) => {
    const result = await signin(data);
    setStatus(result.status);

    if (result.status !== 200 && "field" in result.message) {
      const fields = result.message.field;
      const messages = result.message.message;

      fields.forEach((field, index) => {
        setError(field, {
          type: "manual",
          message: messages?.[index] ?? "Invalid value",
        });
      });
    } else if (result.status === 200) {
      navigate(ROUTES.CHAT);
    } else {
      setMessage(result.message.message[0]);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-10 h-10 animate-spin rounded-full border-2 border-surface-variant border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low font-body-md text-on-surface flex min-h-screen">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center overflow-hidden">
        <div className="relative z-10 text-center px-md max-w-full">
          <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mx-auto mb-md shadow-lg">
            <Icon
              name="school"
              size="40px"
              filled
              className="text-on-primary-container"
            />
          </div>
          <h2 className="font-headline-md text-headline-md text-on-primary mb-sm">
            Study Guide LLM
          </h2>
          <p className="font-body-md text-body-md text-on-primary leading-relaxed">
            Your intelligent companion for rigorous academic exploration.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <main className="flex-1 flex items-center justify-center px-margin-mobile md:px-md py-lg">
        <div className="w-full max-w-full flex flex-col space-y-lg">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-sm">
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-base shadow-sm lg:hidden">
              <Icon
                name="school"
                size="32px"
                filled
                className="text-on-primary-container"
              />
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
              Sign In
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-full">
              Ready to continue your academic journey?
            </p>
          </div>

          {isVerified === true && message === null && (
            <div className="flex items-start gap-sm p-md rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 shadow-lg shadow-emerald-950/20 backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2">
              <div className="p-xs rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 flex items-center justify-center">
                <Icon name="check_circle" size="24px" filled />
              </div>
              <div className="flex-1 space-y-xs">
                <h4 className="font-label-md text-label-md text-emerald-300 font-semibold tracking-wide uppercase">
                  Email Verified
                </h4>
                <p className="font-body-sm text-body-sm text-emerald-200/90 leading-relaxed">
                  Your email has been verified successfully. You can now sign
                  in.
                </p>
              </div>
            </div>
          )}

          {status !== null && status !== 200 && message && (
            <div className="flex items-start gap-sm p-md rounded-xl bg-error-container/30 border border-error/30 text-on-error-container shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2">
              <div className="p-xs rounded-lg bg-error/20 text-error shrink-0 flex items-center justify-center">
                <Icon name="error" size="24px" filled />
              </div>
              <div className="flex-1 space-y-xs">
                <h4 className="font-label-md text-label-md text-error font-semibold tracking-wide uppercase">
                  Registration Failed
                </h4>
                <p className="font-body-sm text-body-sm text-on-error-container/90 leading-relaxed">
                  Please check the field you have entered.
                </p>
              </div>
            </div>
          )}

          <SignInForm
            register={register}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            errors={errors}
            isSubmitting={isSubmitting}
          />

          <div className="text-center lg:text-left">
            <Link
              className="font-body-md text-body-md text-primary hover:text-on-primary-fixed-variant underline transition-colors"
              to={"/app/signup"}
            >
              Don't have an account? Sign Up
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Signin;
