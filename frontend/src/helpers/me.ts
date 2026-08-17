import { UnauthorizedError, ServerError } from "../errors";

interface Me {
  name: string;
  email: string;
  username: string;
}

async function getMe(): Promise<Me> {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, {
    method: "GET",
    credentials: "include",
  });
  const data: Me = await res.json();

  if (res.status === 401) {
    throw new UnauthorizedError("User Unauthorized!", res.status);
  } else if (res.status === 500) {
    throw new ServerError("Internal Server Error!", res.status);
  }

  return data;
}

export default getMe;
