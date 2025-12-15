export interface RFMScore {
  store_id: string;
  recency_score: number;
  frequency_score: number;
  monetary_score: number;
  rfm_total: number;
  segment: string;
}
