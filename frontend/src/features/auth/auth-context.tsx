"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { AuthUser, Role } from "@/lib/auth-types";

type AuthContextType = {
    user: AuthUser | null;
    role: Role;
    login: (user: AuthUser) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);

    function login(u: AuthUser) {
        setUser(u);
    }

    function logout() {
        setUser(null);
    }

    const role: Role = user?.role ?? "GUEST";

    return (
        <AuthContext.Provider value={{ user, role, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}