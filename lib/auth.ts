import { cookies } from "next/headers";

const COOKIE_NAME = "worldcup_admin";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin1234";
}

export function isAdminPassword(input: string): boolean {
  return input === getAdminPassword();
}

export function getSessionToken(): string {
  return Buffer.from(getAdminPassword()).toString("base64");
}

export function setAdminCookie(): void {
  cookies().set(COOKIE_NAME, getSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAdminCookie(): void {
  cookies().delete(COOKIE_NAME);
}

export function isAdminAuthed(): boolean {
  const c = cookies().get(COOKIE_NAME);
  if (!c) return false;
  return c.value === getSessionToken();
}
