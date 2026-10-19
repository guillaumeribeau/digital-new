import { test } from "node:test";
import assert from "node:assert/strict";
import { audiencePeriod, audienceRequests, parseAudience } from "../apps/admin/lib/audience-report";
test("rapports GA4 : période française, source globale et filtrage du domaine", () => {
  const p = audiencePeriod("7", new Date("2026-10-18T23:30:00Z"));
  assert.deepEqual(p, { days: 7, start: "2026-10-13", end: "2026-10-19" });
  assert.equal(audiencePeriod("999").days, 30);
  const requests = audienceRequests(p); assert.equal(requests.length, 5);
  assert.ok("dimensions" in requests[2]); assert.equal(requests[2].dimensions?.[0].name, "sessionSourceMedium");
  for (const r of requests) { const json = JSON.stringify(r); assert.ok(json.includes("zelyweb.com")); assert.ok(!json.includes("email")); }
});
test("rapports GA4 : zéro réel, valeurs invalides et visiteurs uniques non additionnés", () => {
  const p = audiencePeriod("7", new Date("2026-10-19T12:00:00Z"));
  const parsed = parseAudience({ reports: [{ rows: [{ metricValues: [{ value: "5" }, { value: "12" }, { value: "30" }] }] }, { rows: [{ dimensionValues: [{ value: "20261019" }], metricValues: [{ value: "3" }, { value: "6" }, { value: "10" }] }] }, {}, {}, { metadata: { subjectToThresholding: true } }] }, p);
  assert.equal(parsed.visitors, 5); assert.equal(parsed.daily.length, 7); assert.equal(parsed.daily[0].sessions, 0); assert.equal(parsed.daily[6].sessions, 6); assert.equal(parsed.limited, true);
  assert.equal(parseAudience({ reports: [{}, {}, {}, {}, {}] }, p).views, 0);
  assert.throws(() => parseAudience({ reports: [{ rows: [{ metricValues: [{ value: "secret" }] }] }, {}, {}, {}, {}] }, p));
  assert.throws(() => parseAudience({ reports: [] }, p));
});
