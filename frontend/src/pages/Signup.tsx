import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import Icon from "../components/Icon";

function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fullName || !email.includes("@") || !password) {
      setError("Please fill in all fields with a valid university email.");
      return;
    }
    setError("");
    navigate("/app/chat");
  }

  return (
    <div className="bg-surface-container-low font-body-md text-on-surface flex min-h-screen">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                height="40"
                id="grid-signup"
                patternUnits="userSpaceOnUse"
                width="40"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect
              className="text-on-primary"
              fill="url(#grid-signup)"
              height="100%"
              width="100%"
            />
          </svg>
        </div>
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
          <p className="font-body-md text-body-md text-primary-fixed-dim leading-relaxed">
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

          <form
            className="flex flex-col space-y-md w-full bg-surface-container-lowest rounded-xl p-md shadow-md"
            onSubmit={handleSubmit}
          >
            <div className="relative group">
              <label
                className="block font-label-md text-label-md text-on-surface-variant mb-xs transition-colors group-focus-within:text-primary"
                htmlFor="fullName"
              >
                Full Name
              </label>
              <div className="relative">
                <Icon
                  name="person"
                  className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary"
                />
                <input
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-sm pl-10 pr-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  id="fullName"
                  placeholder="Dr. Jane Doe"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="relative group">
              <label
                className="block font-label-md text-label-md text-on-surface-variant mb-xs transition-colors group-focus-within:text-primary"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <Icon
                  name="email"
                  className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary"
                />
                <input
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-sm pl-10 pr-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  id="email"
                  placeholder="john.doe@email.xyz"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <div className="relative group">
                <label
                  className="block font-label-md text-label-md text-on-surface-variant mb-xs transition-colors group-focus-within:text-primary"
                  htmlFor="password"
                >
                  Create Password
                </label>
                <div className="relative">
                  <Icon
                    name="lock"
                    className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary"
                  />
                  <input
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-sm pl-10 pr-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <button
                className="absolute cursor-pointer z-0 right-sm top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary bottom-8"
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <Icon name={showPassword ? "visibility_off" : "visibility"} />
              </button>
            </div>

            {error && (
              <p className="font-body-sm text-body-sm text-error">{error}</p>
            )}

            <button
              className="w-full bg-primary text-on-primary font-label-md text-label-md py-sm rounded-lg shadow-md hover:bg-on-primary-fixed-variant hover:shadow-lg transition-all flex items-center justify-center gap-xs mt-sm"
              type="submit"
            >
              Join for free
              <Icon name="arrow_forward" className="text-sm" />
            </button>
          </form>

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
