import type {
  SignupData,
  SignupReturn,
  LoginData,
  Error,
} from "./authentication";
import { signupSchema, loginSchema } from "./schema";

export type { SignupData, SignupReturn, LoginData, Error };
export { signupSchema, loginSchema };
