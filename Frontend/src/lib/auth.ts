import { apiRequest } from "@/lib/api";

export type AuthUser = {
  user_id: number;
  name: string;
  email: string;
  country: string | null;
  currency: string | null;
  created_at: string;
};

type AuthResponse = {
  user: AuthUser;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  country: string;
  currency: string;
};

type LoginInput = {
  email: string;
  password: string;
};

let currentUserCache: AuthUser | null | undefined;

export async function register(input: RegisterInput) {
  const result = await apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: input,
  });
  currentUserCache = result.user;
  return result.user;
}

export async function login(input: LoginInput) {
  const result = await apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: input,
  });
  currentUserCache = result.user;
  return result.user;
}

export async function logout() {
  await apiRequest<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });
  currentUserCache = null;
}

export async function getCurrentUser(force = false) {
  if (!force && currentUserCache !== undefined) {
    return currentUserCache;
  }

  try {
    const result = await apiRequest<AuthResponse>("/api/auth/me");
    currentUserCache = result.user;
    return result.user;
  } catch (error) {
    currentUserCache = null;
    throw error;
  }
}

export function setCurrentUser(user: AuthUser | null) {
  currentUserCache = user;
}
