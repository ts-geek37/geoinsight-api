import { Sales, Store } from "../types";

const MONTHS = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const n = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0;

export const formatINR = (value?: number | null): string => {
  if (!Number.isFinite(value)) return "₹0";

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  const units = [
    { limit: 1_00_00_000, suffix: "Cr" },
    { limit: 1_00_000, suffix: "L" },
    { limit: 1_000, suffix: "K" },
    { limit: 1, suffix: "" },
  ] as const;

  const unit = units.find((u) => abs >= u.limit) ?? units[units.length - 1];
  const raw = abs / unit.limit;

  const formatted =
    unit.limit === 1
      ? abs.toLocaleString("en-IN")
      : raw.toLocaleString("en-IN", { maximumFractionDigits: 2 });

  return `₹${sign}${formatted}${unit.suffix}`;
};

const calcTrend = (curr: number, prev?: number) => {
  if (!Number.isFinite(prev) || prev === 0) {
    return { value: 0, isPositive: true };
  }

  const pct = ((curr - prev) / prev) * 100;

  return {
    value: Number(pct.toFixed(2)),
    isPositive: pct >= 0,
  };
};

const sortByYearMonth = <T extends { year: number; month: number }>(
  data: T[]
): T[] =>
  [...data].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );

const getLatestYear = <T extends { year: number }>(data: T[]): number | null =>
  data.length ? data[data.length - 1].year : null;

export const buildKpisFromMonthly = (sales: Sales[]) => {
  if (sales.length < 2) {
    return [
      { title: "Total Revenue", value: "₹0", trend: { value: 0, isPositive: true } },
      { title: "Transactions", value: "0", subtitle: "/month", trend: { value: 0, isPositive: true } },
      { title: "Avg Ticket", value: "₹0", trend: { value: 0, isPositive: true } },
    ];
  }

  const sorted = sales
    .map((s) => ({
      revenue: n(s.revenue_inr),
      transactions: n(s.transaction_count),
      avgTicket: n(s.revenue_inr) / Math.max(n(s.transaction_count), 1),
      year: n(s.year),
      month: n(s.month),
    }))
    .sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month
    );

  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];

  return [
    {
      title: "Total Revenue",
      value: formatINR(last.revenue),
      trend: calcTrend(last.revenue, prev.revenue),
    },
    {
      title: "Transactions",
      value: last.transactions.toLocaleString("en-IN"),
      subtitle: "/month",
      trend: calcTrend(last.transactions, prev.transactions),
    },
    {
      title: "Avg Ticket",
      value: formatINR(last.avgTicket),
      trend: calcTrend(last.avgTicket, prev.avgTicket),
    },
  ];
};


export const buildRollingSales = (sales: Sales[]) => {
  if (!Array.isArray(sales) || sales.length === 0) return [];

  const normalized = sortByYearMonth(
    sales.map((s) => ({
      year: n(s.year),
      month: n(s.month),
      label: MONTHS[n(s.month)] ?? "",
      revenue: n(s.revenue_inr),
      transactions: n(s.transaction_count),
    }))
  );

  const latestYear = getLatestYear(normalized);
  if (!latestYear) return [];

  return normalized.filter((s) => s.year === latestYear);
};

export const buildDemographics = (area: Store["area"]) => {
  if (!area) return [];

  const percent = (v?: number) =>
    `${n(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;

  return [
    {
      label: "Population 1km",
      value: n(area.population_1km).toLocaleString("en-IN"),
    },
    {
      label: "Population 3km",
      value: n(area.population_3km).toLocaleString("en-IN"),
    },
    {
      label: "Population 5km",
      value: n(area.population_5km).toLocaleString("en-IN"),
    },
    { label: "Age 25–55", value: percent(area.age_25_55_pct) },
    { label: "Income >5L", value: percent(area.income_high_percentage) },
    { label: "Literacy", value: percent(area.literacy_rate) },
    { label: "Worker Population", value: percent(area.worker_pct) },
    {
      label: "Urban Score",
      value: Math.round(n(area.urban_score)).toString(),
    },
  ];
};

export const buildPoiSummary = (area: Store["area"]) => {
  if (!area) return [];

  return [
    { label: "Bars", value: n(area.bars) },
    { label: "Restaurants", value: n(area.restaurants) },
    { label: "Hotels", value: n(area.hotels) },
    { label: "Clubs", value: n(area.clubs) },
  ];
};

export const buildStoreAnalytics = (store: Store, sales: Sales[]) => {
  const rollingSales = buildRollingSales(sales);

  return {
    kpis: buildKpisFromMonthly(sales),
    revenueTrend: rollingSales,
    transactionsTrend: rollingSales,
    demographics: buildDemographics(store.area),
    poiSummary: buildPoiSummary(store.area),
  };
};
