import { AreaProfile } from "./AreaProfile";
import { SimilarAreaResult } from "./Similarity";

export type RFMSegment = "Champion" | "Promising" | "Needs Attention";
export type RevenueFilter = "all" | "low" | "mid" | "high";

export interface Store {
  id: string;
  name: string;
  address?: string;
  city: string;
  state: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  store_type?: string;
  size_sqft?: number;
  opening_date?: string;
  rfm_score: number;
  rfm_segment: RFMSegment | string;
  frequency_score: number;
  monetary_score: number;
  recency_score: number;
  yearly_revenue: {
    year: number;
    revenue_inr: number;
    transaction_count: number;
    avg_ticket_size: number;
  }[];
  area: AreaProfile;
}

export interface Sales {
  id?: number;
  store_id: string;
  year: number;
  month: number;
  revenue_inr: number;
  transaction_count: number;
  avg_ticket_size: number;
}

export type StoreSummary = {
  id: string;
  name: string;
  city: string;
  state: string;
  rfm_score: number;
  revenue_latest_year: number;
  rank_score: number;
};

export type StoreAreaSummaryItem = {
  store: StoreSummary;
  baseArea: AreaProfile;
  areas: SimilarAreaResult[];
};

export type StoreAreaSummaryResponse = {
  generated_at: string;
  results: StoreAreaSummaryItem[];
};
