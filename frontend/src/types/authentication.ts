export interface SignupData {
  name: string;
  email: string;
  username: string;
  password: string;
}

type SignupField = "name" | "email" | "username" | "password";

export interface SignupMessage {
  message: string[];
  field?: SignupField[];
}

export interface SignupReturn {
  status: number;
  statusMessage: string;
  message: SignupMessage;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface Error {
  message: string;
  status: string;
}
