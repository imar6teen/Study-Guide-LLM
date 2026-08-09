import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import Icon from "../components/Icon";
import { Link } from "react-router";

function Signin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.includes("@") || !password) {
      setError("Enter a valid institutional email and password.");
      return;
    }
    setError("");
    navigate("/app/chat");
  }

  return (
    <div className="bg-surface-container-low font-body-md text-on-surface flex min-h-screen">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                height="48"
                id="grid-signin"
                patternUnits="userSpaceOnUse"
                width="48"
              >
                <path
                  className="text-on-primary"
                  d="M 48 0 L 0 0 0 48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect fill="url(#grid-signin)" height="100%" width="100%" />
          </svg>
        </div>
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
          <p className="font-body-md text-body-md text-primary-fixed-dim leading-relaxed">
            Your intelligent companion for rigorous academic exploration.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <main className="flex-1 flex items-center justify-center px-margin-mobile md:px-md py-lg">
        <div className="w-full max-w-full flex flex-col space-y-lg">
          <div className="flex flex-col items-center text-center space-y-sm">
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

          <form
            className="flex flex-col space-y-md w-full bg-surface-container-lowest rounded-xl p-md shadow-md"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col space-y-xs relative group">
              <label
                className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider ml-xs"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <Icon
                  name="mail"
                  className="absolute left-sm top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"
                />
                <input
                  className="w-full bg-surface-container-low font-body-md text-body-md text-on-surface rounded-lg pl-10 pr-sm py-sm outline-none border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                  id="email"
                  placeholder="johndoe@email.xyz"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col space-y-xs relative group">
              <div className="flex justify-between items-center ml-xs mr-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider"
                  htmlFor="password"
                >
                  Password
                </label>
                <a
                  className="font-body-sm text-body-sm text-primary hover:text-on-primary-fixed-variant transition-colors underline decoration-transparent hover:decoration-current underline-offset-4"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Icon
                  name="lock"
                  className="absolute left-sm top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"
                />
                <input
                  className="w-full bg-surface-container-low font-body-md text-body-md text-on-surface rounded-lg pl-10 pr-sm py-sm outline-none border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                  id="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute right-sm top-12/20 -translate-y-1/2 text-outline hover:text-on-surface transition-colors focus:outline-none"
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon name={showPassword ? "visibility" : "visibility_off"} />
                </button>
              </div>
            </div>

            {error && (
              <p className="font-body-sm text-body-sm text-error">{error}</p>
            )}

            <button
              className="w-full bg-primary text-on-primary font-label-md text-label-md uppercase tracking-widest py-sm rounded-lg hover:bg-on-primary-fixed-variant transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98] mt-base flex items-center justify-center space-x-2"
              type="submit"
            >
              <span>Authenticate</span>
              <Icon name="arrow_forward" className="text-[18px]" />
            </button>
          </form>

          <div className="flex justify-center items-center pt-sm">
            <p className="font-body-md text-body-md text-on-surface-variant">
              New to Study Guide LLM?{" "}
              <Link
                to={"/app/signup"}
                className="text-primary font-medium hover:text-on-primary-fixed-variant transition-colors border-b border-primary/30 hover:border-primary pb-0.5"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Signin;
