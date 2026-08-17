import { useEffect } from "react";
import useAuthStore from "./useAuthStore";
import getMe from "../helpers/me";

function useGetMe() {
  const authStore = useAuthStore();

  useEffect(() => {
    if (authStore.isAuthenticated) {
      return;
    }

    const getMeHelper = async () => {
      try {
        const data = await getMe();
        if (data === null) return;
        authStore.setUser(data);
        authStore.setIsAuthenticated(true);
      } catch (err) {
        console.log(err);
        authStore.setUser({
          name: "",
          email: "",
          username: "",
        });
        authStore.setIsAuthenticated(false);
      }
    };

    getMeHelper();
  }, []);
}

export default useGetMe;
