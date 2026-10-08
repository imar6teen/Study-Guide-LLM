import { useEffect } from "react";
import useAuthStore from "./useAuthStore";
import getMe from "../helpers/me";
import { clearAuthToken } from "../helpers/auth";

function useGetMe() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const setIsLoaded = useAuthStore((state) => state.setIsLoaded);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    let isMounted = true;

    const getMeHelper = async () => {
      try {
        const data = await getMe();
        if (!isMounted || data === null) return;
        setUser(data);
        setIsAuthenticated(true);
      } catch (err) {
        if (!isMounted) return;
        clearAuthToken();
        setUser({
          name: "",
          email: "",
          username: "",
        });
        setIsAuthenticated(false);
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    };

    getMeHelper();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, setUser, setIsAuthenticated, setIsLoaded]);
}

export default useGetMe;
