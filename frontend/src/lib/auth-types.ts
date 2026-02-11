export type Role = "GUEST" | "USER" | "ADMIN";

export type AuthUser = {
    id: number;
    email: string;
    role: Role;
};