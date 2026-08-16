import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: Role;
      avatar: string | null;
      coins: number;
      exp: number;
      level: number;
      isBanned: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    role: Role;
    avatar: string | null;
    coins: number;
    exp: number;
    level: number;
    isBanned: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: Role;
    avatar: string | null;
    coins: number;
    exp: number;
    level: number;
    isBanned: boolean;
  }
}
