import { useEffect } from "react";
import useAuthStore from "./useAuthStore";
import getMe from "../helpers/me";

function useGetMe() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // const isLoaded = useAuthStore((state) => state.isLoaded);
  const setUser = useAuthStore((state) => state.setUser);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const setIsLoaded = useAuthStore((state) => state.setIsLoaded);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    const getMeHelper = async () => {
      try {
        const data = await getMe();
        if (data === null) return;
        setUser(data);
        setIsAuthenticated(true);
      } catch (err) {
        console.log(err);
        setUser({
          name: "",
          email: "",
          username: "",
        });
        setIsAuthenticated(false);
      } finally {
        setIsLoaded(true);
      }
    };

    getMeHelper();
  }, []);
}

export default useGetMe;
