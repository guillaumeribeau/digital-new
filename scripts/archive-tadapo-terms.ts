import { writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
// Archive the actual displayed clauses for this release, without a runtime dependency on React rendering.
async function main() {
  process.env.TADAPO_CONTACT_EMAIL = "__TADAPO_CONTACT_EMAIL__";
  const { LegalContent } = await import("../apps/tadapo/lib/legal-content");
  const html = renderToStaticMarkup(createElement(LegalContent, { slug: "conditions-generales" }));
  await writeFile("packages/shared/tadapo-terms-2026-10-23.json", JSON.stringify({ version: "2026-10-23", html }, null, 2) + "\n");
}
main().catch(() => { console.error("Terms archive failed"); process.exitCode = 1; });
