export interface SignupData {
  name: string;
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface Error {
  message: string;
  status: string;
}
