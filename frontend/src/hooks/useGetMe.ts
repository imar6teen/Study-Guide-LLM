import { useEffect } from "react";
import useAuthStore from "./useAuthStore";
import getMe from "../helpers/me";

function useGetMe() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);

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
      }
    };

    getMeHelper();
  }, []);
}

export default useGetMe;
