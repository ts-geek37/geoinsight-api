export interface MMITokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface MMIReverseGeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}
 
export interface MMIPOI {
  placeName: string;
  place_name?: string;
  name?: string;
  placeAddress: string;
  distance: number;
  eLoc: string;
  keywords: string[];
}
