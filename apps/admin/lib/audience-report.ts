import { z } from "zod";
export const audienceProperty = "559264383";
export function audiencePeriod(value?: string, now = new Date()) {
  const days = value === "7" ? 7 : value === "90" ? 90 : 30;
  const end = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const date = new Date(end + "T12:00:00Z"); date.setUTCDate(date.getUTCDate() - days + 1);
  return { days, start: date.toISOString().slice(0, 10), end };
}
export function audienceRequests(period: ReturnType<typeof audiencePeriod>) {
  const base = { dateRanges: [{ startDate: period.start, endDate: period.end }], dimensionFilter: { filter: { fieldName: "hostName", inListFilter: { values: ["zelyweb.com", "www.zelyweb.com"] } } }, keepEmptyRows: false };
  const metrics = ["totalUsers", "sessions", "screenPageViews"].map(name => ({ name }));
  return [
    { ...base, metrics },
    { ...base, metrics, dimensions: [{ name: "date" }], orderBys: [{ dimension: { dimensionName: "date" } }], limit: 90 },
    { ...base, metrics: [{ name: "sessions" }], dimensions: [{ name: "sessionSourceMedium" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 15 },
    { ...base, metrics: [{ name: "screenPageViews" }], dimensions: [{ name: "pagePath" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 15 },
    { ...base, metrics: [{ name: "eventCount" }, { name: "totalUsers" }], dimensions: [{ name: "eventName" }], dimensionFilter: { andGroup: { expressions: [base.dimensionFilter, { filter: { fieldName: "eventName", inListFilter: { values: ["cta_click", "contact_click", "lead_form_start", "lead_form_step", "lead_form_submit", "lead_form_success"] } } }] } }, limit: 10 },
  ];
}
const cell = z.object({ value: z.string().max(2000).default("") });
const report = z.object({ rows: z.array(z.object({ dimensionValues: z.array(cell).optional(), metricValues: z.array(cell) })).default([]), metadata: z.object({ subjectToThresholding: z.boolean().optional(), samplingMetadatas: z.array(z.unknown()).optional() }).optional() });
export function parseAudience(input: unknown, period: ReturnType<typeof audiencePeriod>) {
  const reports = z.object({ reports: z.array(report).length(5) }).parse(input).reports;
  const number = (value?: string) => { const n = Number(value || 0); if (!Number.isFinite(n) || n < 0) throw new Error("INVALID_REPORT"); return n; };
  const totals = reports[0].rows[0]?.metricValues;
  const daily = new Map(reports[1].rows.map(row => [row.dimensionValues?.[0]?.value, row]));
  const days = Array.from({ length: period.days }, (_, n) => {
    const date = new Date(period.start + "T12:00:00Z"); date.setUTCDate(date.getUTCDate() + n); const iso = date.toISOString().slice(0, 10), row = daily.get(iso.replaceAll("-", ""));
    return { date: iso, visitors: number(row?.metricValues[0]?.value), sessions: number(row?.metricValues[1]?.value), views: number(row?.metricValues[2]?.value) };
  });
  return { period, visitors: number(totals?.[0]?.value), sessions: number(totals?.[1]?.value), views: number(totals?.[2]?.value), daily: days,
    sources: reports[2].rows.map(r => ({ label: r.dimensionValues?.[0]?.value || "Non attribué", sessions: number(r.metricValues[0]?.value) })),
    pages: reports[3].rows.map(r => ({ label: r.dimensionValues?.[0]?.value || "/", views: number(r.metricValues[0]?.value) })),
    events: reports[4].rows.map(r => ({ name: r.dimensionValues?.[0]?.value || "", count: number(r.metricValues[0]?.value), visitors: number(r.metricValues[1]?.value) })),
    limited: reports.some(r => r.metadata?.subjectToThresholding || r.metadata?.samplingMetadatas?.length),
  };
}
export type AudienceReport = ReturnType<typeof parseAudience>;
