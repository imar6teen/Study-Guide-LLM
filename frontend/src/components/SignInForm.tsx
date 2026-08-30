import Icon from "./Icon";
import type {
  UseFormRegister,
  UseFormHandleSubmit,
  SubmitHandler,
  FieldErrors,
} from "react-hook-form";
import { z } from "zod";

import { loginSchema } from "../types";

import InputForm from "./InputForm";

interface SignInFormProps {
  register: UseFormRegister<z.infer<typeof loginSchema>>;
  handleSubmit: UseFormHandleSubmit<z.infer<typeof loginSchema>>;
  onSubmit: SubmitHandler<z.infer<typeof loginSchema>>;
  errors: FieldErrors<z.infer<typeof loginSchema>>;
  isSubmitting: boolean;
}

function SignInForm({
  register,
  handleSubmit,
  onSubmit,
  errors,
  isSubmitting,
}: SignInFormProps) {
  return (
    <form
      className="flex flex-col space-y-md w-full bg-surface-container-lowest rounded-xl p-md shadow-md"
      onSubmit={handleSubmit(onSubmit)}
    >
      <InputForm<z.infer<typeof loginSchema>>
        iconName="person"
        registerName="username"
        labelName="Username"
        id="username"
        placeholder="janedoe"
        type="text"
        register={register}
        errors={errors}
        isSubmitting={isSubmitting}
      />

      <div className="flex flex-col space-y-xs">
        <InputForm<z.infer<typeof loginSchema>>
          iconName="lock"
          registerName="password"
          labelName="Password"
          id="password"
          placeholder="••••••••"
          type="password"
          register={register}
          errors={errors}
          isSubmitting={isSubmitting}
        />
        <div className="flex justify-end pr-xs">
          <a
            className="font-body-sm text-body-sm text-primary hover:text-on-primary-fixed-variant transition-colors underline decoration-transparent hover:decoration-current underline-offset-4"
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            Forgot Password?
          </a>
        </div>
      </div>

      <button
        className="w-full bg-primary text-on-primary font-label-md text-label-md py-sm rounded-lg shadow-md hover:bg-on-primary-fixed-variant hover:shadow-lg transition-all flex items-center justify-center gap-xs mt-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
        type="submit"
        disabled={isSubmitting}
      >
        Authenticate
        <Icon name="arrow_forward" className="text-sm" />
      </button>
    </form>
  );
}

export default SignInForm;
