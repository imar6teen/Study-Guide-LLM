import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { signupSchema } from "../types";
import Icon from "../components/Icon";
import CreateAccountForm from "../components/CreateAccountForm";
import useAuthStore from "../hooks/useAuthStore";
import { useEffect, useState } from "react";
import ROUTES from "../constants/routes";
import useGetMe from "../hooks/useGetMe";

function Signup() {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const [loading, setLoading] = useState(true);

  useGetMe();

  useEffect(() => {
    if (authStore.isAuthenticated) {
      navigate(ROUTES.CHAT);
      return;
    }

    (() => setLoading(false))();
  }, [authStore.isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof signupSchema>> = (
    data: z.infer<typeof signupSchema>
  ) => {
    console.log(data);
    navigate(ROUTES.CHAT);
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
              name="menu_book"
              size="40px"
              filled
              className="text-on-primary-container"
            />
          </div>
          <h2 className="font-headline-md text-headline-md text-on-primary mb-sm">
            Study Guide LLM
          </h2>
          <p className="font-body-md text-body-md text-on-primary leading-relaxed">
            Master any subject with AI-powered study guides, interactive
            mindmaps, and scholarly citations.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <main className="flex-1 flex items-center justify-center px-margin-mobile md:px-md py-lg">
        <div className="w-full max-w-full flex flex-col space-y-lg">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-sm">
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-base shadow-sm lg:hidden">
              <Icon
                name="menu_book"
                size="32px"
                filled
                className="text-on-primary-container"
              />
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
              Create Account
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-full">
              Personalized learning paths and interactive visualizations.
            </p>
          </div>

          <CreateAccountForm
            register={register}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            errors={errors}
            isSubmitting={isSubmitting}
          />

          <div className="text-center lg:text-left">
            <Link
              className="font-body-md text-body-md text-primary hover:text-on-primary-fixed-variant underline transition-colors"
              to={"/app/signin"}
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Signup;
