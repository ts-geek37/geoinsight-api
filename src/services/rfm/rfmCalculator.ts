import { RFMScore } from "../../types"

const NOW_YEAR = 2025
const NOW_MONTH = 12

const monthsBetween = (year: number, month: number) => {
  return (NOW_YEAR - year) * 12 + (NOW_MONTH - month)
}

const scoreRecency = (recencyMonths: number) => {
  if (recencyMonths <= 1) return 5
  if (recencyMonths <= 3) return 4
  if (recencyMonths <= 6) return 3
  if (recencyMonths <= 12) return 2
  return 1
}

const scoreFrequency = (freq: number) => {
  if (freq >= 18) return 5
  if (freq >= 14) return 4
  if (freq >= 10) return 3
  if (freq >= 6) return 2
  return 1
}

const scoreMonetary = (value: number, allValues: number[]) => {
  if (!allValues.length) return 1

  const sorted = [...allValues].sort((a, b) => a - b)
  const idx = sorted.findIndex((v) => v >= value)
  const pct = idx / sorted.length

  if (pct >= 0.8) return 5
  if (pct >= 0.6) return 4
  if (pct >= 0.4) return 3
  if (pct >= 0.2) return 2
  return 1
}

const segmentFromTotal = (total: number): string => {
  if (total >= 12) return "Champion"
  if (total >= 8) return "Promising"
  return "Needs Attention"
}

export const calculateRFMForAllStores = (
  data: {
    store_id: string
    sales: { year: number; month: number; revenue_inr: number }[]
  }[]
): RFMScore[] => {
  const raw = data.map((entry) => {
    const sales = entry.sales

    if (!sales.length) {
      return {
        store_id: entry.store_id,
        recencyMonths: 999,
        frequency: 0,
        monetary: 0
      }
    }

    const last = sales.reduce((max, s) => {
      const key = s.year * 100 + s.month
      return key > max ? key : max
    }, 0)

    const lastYear = Math.floor(last / 100)
    const lastMonth = last % 100

    return {
      store_id: entry.store_id,
      recencyMonths: monthsBetween(lastYear, lastMonth),
      frequency: sales.length,
      monetary: Number(
        sales.reduce((sum, s) => sum + s.revenue_inr, 0).toFixed(2)
      )
    }
  })

  const monetaryList = raw.map((r) => r.monetary)

  return raw.map((r) => {
    const rec = scoreRecency(r.recencyMonths)
    const freq = scoreFrequency(r.frequency)
    const mon = scoreMonetary(r.monetary, monetaryList)
    const total = rec + freq + mon

    return {
      store_id: r.store_id,
      recency_score: rec,
      frequency_score: freq,
      monetary_score: mon,
      rfm_total: total,
      segment: segmentFromTotal(total)
    }
  })
}
