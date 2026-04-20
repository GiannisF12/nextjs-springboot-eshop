"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { AuthUser, Gender, Role } from "@/lib/auth-types";
import { loginApi, logoutApi, meApi, registerApi, updateProfileApi } from "@/lib/api";

type AuthContextType = {
    user: AuthUser | null;
    role: Role;
    loading: boolean;
    login: (email: string, password: string) => Promise<AuthUser>;
    register: (email: string, password: string, name: string) => Promise<AuthUser>;
    updateProfile: (
        name: string,
        email: string,
        gender: Gender | null,
        birthday: string | null
    ) => Promise<AuthUser>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        async function bootstrap() {
            try {
                const currentUser = await meApi();
                if (active) setUser(currentUser);
            } catch {
                if (active) setUser(null);
            } finally {
                if (active) setLoading(false);
            }
        }

        bootstrap();

        return () => {
            active = false;
        };
    }, []);

    async function login(email: string, password: string) {
        const loggedInUser = await loginApi(email, password);
        setUser(loggedInUser);
        return loggedInUser;
    }

    async function register(email: string, password: string, name: string) {
        const newUser = await registerApi(email, password, name);
        setUser(newUser);
        return newUser;
    }

    async function updateProfile(
        name: string,
        email: string,
        gender: Gender | null,
        birthday: string | null
    ) {
        const updated = await updateProfileApi(name, email, gender, birthday);
        setUser(updated);
        return updated;
    }

    async function logout() {
        try {
            await logoutApi();
        } finally {
            setUser(null);
        }
    }

    const role: Role = user?.role ?? "GUEST";

    return (
        <AuthContext.Provider value={{ user, role, loading, login, register, updateProfile, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
