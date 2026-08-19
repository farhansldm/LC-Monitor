import { getAuthHeaders } from "@/lib/auth";

export async function jsonRequest(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });
  const data = await res.json().catch(() => ({} as { error?: string }));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
