import Icon from "./Icon";
import type { UseFormRegister, FieldErrors, FieldPath, FieldValues } from "react-hook-form";
import { get } from "react-hook-form";
import { useState } from "react";

import { capitalizeEachWord } from "../utils/string";

type InputFormProps<T extends FieldValues> = {
  iconName: string;
  registerName: FieldPath<T>;
  labelName: string;
  id: string;
  placeholder: string;
  type: "text" | "password" | "email";
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
};

function InputForm<T extends FieldValues>({
  iconName,
  registerName,
  labelName,
  id,
  placeholder,
  type,
  register,
  errors,
}: InputFormProps<T>) {
  const error = get(errors, registerName);

  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div className="relative group">
      <label
        className="block font-label-md text-label-md text-on-surface-variant mb-xs transition-colors group-focus-within:text-primary"
        htmlFor={id}
      >
        {capitalizeEachWord(labelName)}
      </label>
      <div className="relative">
        <Icon
          name={iconName}
          className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary"
        />
        <input
          {...register(registerName)}
          className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-sm pl-10 pr-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          id={id}
          placeholder={placeholder}
          type={
            type === "password" ? (showPassword ? "text" : "password") : type
          }
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-sm top-1/2 -translate-y-1/2"
          >
            <Icon name={showPassword ? "visibility_off" : "visibility"} />
          </button>
        )}
        {error && <p className="text-error text-xs mt-xs">{error.message}</p>}
      </div>
    </div>
  );
}

export default InputForm;
