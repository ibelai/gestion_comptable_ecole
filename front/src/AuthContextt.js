import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Fonction pour charger l'utilisateur depuis localStorage
  const loadUserFromStorage = () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const exp = decoded.exp * 1000;
        if (Date.now() > exp) {
          localStorage.clear();
          setUser(null);
        } else {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (err) {
        localStorage.clear();
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
