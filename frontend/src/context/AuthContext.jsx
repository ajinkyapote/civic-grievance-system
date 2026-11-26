import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("civic_auth");
    return saved ? JSON.parse(saved) : null;
  });

  const login = (authData) => {
    localStorage.setItem("civic_auth", JSON.stringify(authData));
    setUser(authData);
  };

  const logout = () => {
    localStorage.removeItem("civic_auth");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
