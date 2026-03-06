//UserProvider.jsx

import { useContext, useState } from "react";
import { useEffect } from "react";
import { UserContext } from "./UserContext";

const EMPTY_USER = { isLoggedIn: false, name: "", email: "", role: "" };

function normalizeUser(rawUser = {}, fallbackEmail = "") {
  const resolvedRole = String(rawUser.role || "USER").toUpperCase();
  return {
    isLoggedIn: true,
    name: rawUser.name || rawUser.username || rawUser.fullname || "",
    email: rawUser.email || fallbackEmail,
    role: resolvedRole
  };
}

function getInitialUser() {
  try {
    const saved = localStorage.getItem("session");
    if (!saved) return EMPTY_USER;
    const parsed = JSON.parse(saved);
    if (!parsed?.isLoggedIn) return EMPTY_USER;
    return normalizeUser(parsed, parsed.email || "");
  } catch {
    return EMPTY_USER;
  }
}

export function UserProvider({ children }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const [user, setUser] = useState(getInitialUser);

  function persistUser(nextUser) {
    setUser(nextUser);
    localStorage.setItem("session", JSON.stringify(nextUser));
  }

  useEffect(() => {
    if (!user?.isLoggedIn) return;

    async function syncProfile() {
      try {
        const result = await fetch(`${API_URL}/api/user/profile`, {
          method: "GET",
          credentials: "include"
        });

        if (!result.ok) {
          persistUser(EMPTY_USER);
          return;
        }

        const payload = await result.json().catch(() => ({}));
        const syncedUser = normalizeUser(payload, user.email || "");
        persistUser(syncedUser);
      } catch {
        persistUser(EMPTY_USER);
      }
    }

    syncProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL]);

  const login = async (email, password) => {
    try {
      const result = await fetch(`${API_URL}/api/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      if (!result.ok) return false;

      const payload = await result.json().catch(() => ({}));
      const resolvedUser = payload?.user || payload || {};
      const newUser = normalizeUser(resolvedUser, email);

      persistUser(newUser);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/user/logout`, {
        method: "POST",
        credentials: "include"
      });
    } finally {
      persistUser(EMPTY_USER);
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
