export type Role = "GUEST" | "USER" | "ADMIN";

export type AuthUser = {
    id: number;
    email: string;
    name: string | null;
    role: Role;
};