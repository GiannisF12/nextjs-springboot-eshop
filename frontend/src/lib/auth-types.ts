export type Role = "GUEST" | "USER" | "ADMIN";

export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export type AuthUser = {
    id: number;
    email: string;
    name: string | null;
    role: Role;
    gender: Gender | null;
    birthday: string | null; // ISO date (YYYY-MM-DD)
};
