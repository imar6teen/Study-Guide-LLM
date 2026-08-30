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

type LoginField = "username" | "password";

export interface LoginMessage {
  message: string[];
  field?: LoginField[];
}

export interface LoginReturn {
  status: number;
  statusMessage: string;
  message: LoginMessage;
}

export interface Error {
  message: string;
  status: string;
}
