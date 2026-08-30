import { create } from "zustand";

type User = {
  username: string;
  name: string;
  email: string;
};

type State = {
  user: User;
  isAuthenticated: boolean;
  isLoaded: boolean;
};

type Action = {
  setUser: (user: User) => void;
  setIsAuthenticated: (value: boolean) => void;
  setIsLoaded: (value: boolean) => void;
};

const useAuthStore = create<State & Action>()((set) => ({
  user: {
    username: "",
    name: "",
    email: "",
  },
  isLoaded: false,
  isAuthenticated: false,
  setUser: (user: User) => set(() => ({ user: user })),
  setIsAuthenticated: (value: boolean) =>
    set(() => ({ isAuthenticated: value })),
  setIsLoaded: (value: boolean) => set(() => ({ isLoaded: value })),
}));

export default useAuthStore;
