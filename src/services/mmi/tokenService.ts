import axios from "axios";
import { MMITokenResponse } from "../../types/MMI";

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

function isTokenValid(): boolean {
  if (!cachedToken || !tokenExpiry) return false;
  return Date.now() < tokenExpiry - 30_000;  
}

export async function getMMIToken(): Promise<string> {
  if (isTokenValid()) return cachedToken!;

  const { MMI_CLIENT_ID, MMI_CLIENT_SECRET } = process.env;

  if (!MMI_CLIENT_ID || !MMI_CLIENT_SECRET) {
    throw new Error("Missing MapMyIndia API credentials");
  }

  const url = `https://outpost.mapmyindia.com/api/security/oauth/token?grant_type=client_credentials&client_id=${MMI_CLIENT_ID}&client_secret=${MMI_CLIENT_SECRET}`;

  const response = await axios.post<MMITokenResponse>(url);

  cachedToken = response.data.access_token;
  tokenExpiry = Date.now() + response.data.expires_in * 1000;

  return cachedToken!;
}

export function getTokenStatus() {
  return {
    hasCredentials: !!process.env.MMI_CLIENT_ID,
    tokenCached: !!cachedToken,
    tokenExpiresAt: tokenExpiry,
  };
}
