import { z } from "zod";
import { loginSchema } from "../types";
import { ServerError, UnauthorizedError } from "../errors";
import type { LoginReturn } from "../types/authentication";

async function signin(data: z.infer<typeof loginSchema>) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
    const msg = await response.json();

    const result: LoginReturn = {
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

export default signin;
