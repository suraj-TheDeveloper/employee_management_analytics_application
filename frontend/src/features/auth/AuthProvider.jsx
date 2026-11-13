import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./authContext";
import { authService } from "../../services/authService";
import { setUnauthorizedHandler, tokenStorage } from "../../services/apiClient";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // If a token exists, we must verify it before deciding "logged in or not"
  const [loading, setLoading] = useState(Boolean(tokenStorage.get()));

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  // Restore the session on page load
  useEffect(() => {
    if (!tokenStorage.get()) return;
    let cancelled = false;
    authService
      .getMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const token = await authService.login(email, password);
    tokenStorage.set(token);
    const me = await authService.getMe();
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}