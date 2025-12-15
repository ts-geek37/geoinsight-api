import axios from "axios";

import { MMIReverseGeocodeResult } from "../../types";
import { getMMIToken } from "./tokenService";

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<MMIReverseGeocodeResult> {
  const token = await getMMIToken();

  const url = `https://apis.mapmyindia.com/advancedmaps/v1/${token}/rev_geocode?lat=${lat}&lng=${lon}`;

  try {
    const response = await axios.get(url);
    const result = response.data?.results?.[0];

    if (!result || !result.formatted_address) {
      return {
        latitude: lat,
        longitude: lon,
        formatted_address: null,
        city: null,
        state: null,
        pincode: null,
      };
    }

    return {
      latitude: lat,
      longitude: lon,
      formatted_address: result.formatted_address || null,
      city: result.city || result.district || result.locality || null,
      state: result.state || null,
      pincode: result.pincode || null,
    };
  } catch (error: any) {
    throw error;
  }
}

export async function geocode(address: string) {
  const token = await getMMIToken();

  const url = `https://apis.mapmyindia.com/advancedmaps/v1/${token}/search?query=${encodeURIComponent(
    address
  )}&region=ind`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

const categories = {
  restaurants: [
    "FODCON",
    "FODFFD",
    "FODIND",
    "FODRDS",
    "FODBAK",
    "FODCOF",
    "FODBVG",
    "FODOTL",
    "FODPLZ",
    "FODTEA",
    "FODOTH",
  ],
  hotels: ["HOTALL", "HOTRES", "HOTHST", "HOTPRE", "PREHRG", "PRENRT"],
  bars: ["FODPUB"],
  clubs: ["RCNCLB", "RCNPCB"],
};

const poiCodes = Object.values(categories).flat();

export async function getPOIsAround(lat: number, lon: number, radius = 1000) {
  const token = await getMMIToken();

  const keywords = poiCodes.join(";");

  const url =
    `https://atlas.mapmyindia.com/api/places/nearby/json?` +
    `keywords=${keywords}&refLocation=${lat},${lon}&radius=${radius}`;

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const results = response.data?.suggestedLocations || [];

    const counts: { category: string; count: number }[] = [];

    for (const [category, codes] of Object.entries(categories)) {
      const count = results.filter((r) =>
        r.keywords?.some((kw) => codes.includes(kw))
      ).length;

      counts.push({ category, count });
    }
    return counts;
  } catch (error: any) {
    return [];
  }
}
export async function computeRoadConnectivity(
  lat: number,
  lon: number
): Promise<number> {
  return 0.5;
}
