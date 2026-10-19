"use client";
import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({ plugins: [twoFactorClient({ twoFactorPage: "/verification" })] });
// A full navigation after changing credentials discards the previous RSC/router cache.
export function navigateSession(path: string) { window.location.replace(new URL(path, window.location.origin).href); }
