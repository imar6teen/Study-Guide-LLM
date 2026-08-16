import Icon from "./Icon";
import type {
  UseFormRegister,
  UseFormHandleSubmit,
  SubmitHandler,
  FieldErrors,
} from "react-hook-form";
import { z } from "zod";

import { signupSchema } from "../types";

import InputForm from "./InputForm";

interface CreateAccountFormProps {
  register: UseFormRegister<z.infer<typeof signupSchema>>;
  handleSubmit: UseFormHandleSubmit<z.infer<typeof signupSchema>>;
  onSubmit: SubmitHandler<z.infer<typeof signupSchema>>;
  errors: FieldErrors<z.infer<typeof signupSchema>>;
  isSubmitting: boolean;
}

function CreateAccountForm({
  register,
  handleSubmit,
  onSubmit,
  errors,
  isSubmitting,
}: CreateAccountFormProps) {
  return (
    <form
      className="flex flex-col space-y-md w-full bg-surface-container-lowest rounded-xl p-md shadow-md"
      onSubmit={handleSubmit(onSubmit)}
    >
      <InputForm<z.infer<typeof signupSchema>>
        iconName="person"
        registerName="name"
        labelName="Full Name"
        id="fullName"
        placeholder="Dr. Jane Doe"
        type="text"
        register={register}
        errors={errors}
      />

      <InputForm<z.infer<typeof signupSchema>>
        iconName="person"
        registerName="username"
        labelName="Username"
        id="username"
        placeholder="janedoe"
        type="text"
        register={register}
        errors={errors}
      />

      <InputForm<z.infer<typeof signupSchema>>
        iconName="mail"
        registerName="email"
        labelName="Email"
        id="email"
        placeholder="john.doe@email.xyz"
        type="email"
        register={register}
        errors={errors}
      />

      <InputForm<z.infer<typeof signupSchema>>
        iconName="lock"
        registerName="password"
        labelName="Password"
        id="password"
        placeholder="••••••••"
        type="password"
        register={register}
        errors={errors}
      />

      <button
        className="w-full bg-primary text-on-primary font-label-md text-label-md py-sm rounded-lg shadow-md hover:bg-on-primary-fixed-variant hover:shadow-lg transition-all flex items-center justify-center gap-xs mt-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
        type="submit"
        disabled={isSubmitting}
      >
        Join for free
        <Icon name="arrow_forward" className="text-sm" />
      </button>
    </form>
  );
}

export default CreateAccountForm;
