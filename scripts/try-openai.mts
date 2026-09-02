import { openaiProvider } from "../src/ai/openai/index.ts";

const t = Date.now();
const since = () => `${((Date.now() - t) / 1000).toFixed(0)}s`;

console.log(`model: ${process.env.PLAYBOOK_OPENAI_MODEL || "gpt-5"}\n`);

console.log("Profile synthesis (no search)...");
const p = await openaiProvider.synthesizeProfile({
  resume:
    "Ana Reyes. Third-year civil engineering student. Built a flood-risk map of the city using " +
    "open sensor data, used by two neighbourhood associations. Interned at a water utility on " +
    "pipe-failure analysis. Runs a 40-person Engineers Without Borders chapter.",
  direction: "Get into a top graduate program for water resources engineering.",
  access: "My internship supervisor at the utility. A professor who liked the flood map.",
  constraints: "No savings for application fees. Graduating in 18 months.",
});
console.log(`  ok in ${since()}`);
console.log(`  capabilities: ${p.capabilities.slice(0, 2).join(" | ")}`);
console.log(`  underused:    ${p.underusedLeverage[0]}`);

if (process.argv.includes("--search")) {
  console.log("\nBrief research (WITH web search)...");
  const b = await openaiProvider.researchBrief({
    objective: "Get admitted to the Knight-Hennessy Scholars program at Stanford.",
    deadline: "2027-10-01",
    success: "An admission offer, or reaching the finalist interview round.",
    constraints: "Applying while working full time.",
  });
  console.log(`  ok in ${since()}`);
  console.log(`  title: ${b.title}`);
  console.log(`  sources:`);
  b.sources.forEach((s) => console.log(`    - ${s.url}`));
}
console.log(`\ndone in ${since()}\n`);
