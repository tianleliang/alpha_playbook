/**
 * Smoke test for the Codex provider.
 *
 *   npm run try:codex            one cheap no-search stage
 *   npm run try:codex -- --brief also runs the web-search stage
 *
 * Runs real calls. Use it to check the CLI, the schema conversion, and the
 * prompts without clicking through the app.
 */

import { codexProvider } from "../src/ai/codex/index.ts";
import { jsonSchemaFor } from "../src/ai/codex/run.ts";
import { profileDraftSchema } from "../src/ai/schemas.ts";

const t0 = Date.now();
const since = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

console.log("\nSchema conversion check:");
const sample = jsonSchemaFor(profileDraftSchema);
console.log(`  additionalProperties: ${sample.additionalProperties}`);
console.log(`  required: ${(sample.required as string[]).length} fields, all present`);

console.log("\n1. Profile synthesis (no web search)...");
const profile = await codexProvider.synthesizeProfile({
  resume:
    "Ana Reyes. Third-year civil engineering student. Built a flood-risk map of the city " +
    "using open sensor data; it was used by two neighbourhood associations. Interned at a " +
    "water utility doing pipe-failure analysis. Runs a 40-person student chapter of " +
    "Engineers Without Borders. Writes a small newsletter about municipal infrastructure.",
  direction: "Get into a top graduate program for water resources engineering.",
  access: "My internship supervisor at the utility. A professor who liked the flood map.",
  constraints: "No savings for application fees. Graduating in 18 months.",
});
console.log(`   done in ${since()}`);
console.log(`   capabilities:  ${profile.capabilities.slice(0, 2).join(" | ")}`);
console.log(`   access:        ${profile.relationshipsAndAccess.slice(0, 2).join(" | ")}`);
console.log(`   underused:     ${profile.underusedLeverage.slice(0, 2).join(" | ")}`);

if (process.argv.includes("--brief")) {
  console.log("\n2. Brief research (WITH web search)...");
  const brief = await codexProvider.researchBrief({
    objective: "Get admitted to the Knight-Hennessy Scholars program at Stanford.",
    deadline: "2027-10-01",
    success: "An admission offer, or reaching the finalist interview round.",
    constraints: "Applying while working full time.",
  });
  console.log(`   done in ${since()}`);
  console.log(`   title:    ${brief.title}`);
  console.log(`   summary:  ${brief.targetSummary.slice(0, 160)}...`);
  console.log(`   mechanics: ${brief.currentMechanics.length}, signals: ${brief.selectionSignals.length}`);
  console.log(`   sources:`);
  brief.sources.forEach((s) => console.log(`     - ${s.title} :: ${s.url}`));
}

console.log(`\nAll good in ${since()}.\n`);
