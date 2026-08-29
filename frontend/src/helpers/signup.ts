import { ServerError, UnauthorizedError } from "../errors";
import type { SignupReturn, signupSchema } from "../types";
import { z } from "zod";

async function signup(data: z.infer<typeof signupSchema>) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/auth/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
    const msg = await response.json();

    const result: SignupReturn = {
      status: response.status,
      statusMessage: response.statusText,
      message: msg,
    };

    return result;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      throw new UnauthorizedError("User Unauthorized!", err.status);
    } else if (err instanceof ServerError) {
      throw new ServerError("Internal Server Error!", err.status);
    } else {
      throw new Error("Something went wrong!", { cause: err });
    }
  }
}

export default signup;
