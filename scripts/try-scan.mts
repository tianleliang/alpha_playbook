import { readFileSync, readdirSync } from "node:fs";
import { codexProvider } from "../src/ai/codex/index.ts";

const d = "data/projects";
const p = JSON.parse(readFileSync(`${d}/${readdirSync(d)[0]}`, "utf8"));
const profile = JSON.parse(readFileSync("data/profile.json", "utf8"));
const step = p.plan.steps.find((s: any) => s.status === "current");
const nodes = p.nodeSet.nodes.filter((n: any) => n.stepId === step.id && n.status === "active");

console.log(`scanning ${step.id} with ${nodes.length} directions...`);
const t = Date.now();
try {
  const scan = await codexProvider.runScan({ brief: p.brief, plan: p.plan, step, nodes, profile });
  console.log(`OK in ${((Date.now() - t) / 1000).toFixed(0)}s`);
  console.log("classifications:", scan.classifications.map((c) => `${c.nodeId}:${c.lane}`).join(", "));
  console.log("groups:", scan.nodeResultGroups.map((g) => `${g.nodeId}=${g.results.length}`).join(", "));
  for (const g of scan.nodeResultGroups)
    for (const r of g.results) {
      console.log(`\n[${r.lane}/${r.resultType}/${r.confidence}] ${r.title}`);
      console.log(`  ${r.summary.slice(0, 220)}`);
      console.log(`  DO: ${r.suggestedAction.slice(0, 160)}`);
      if (r.sourceLinks.length) console.log(`  SRC: ${r.sourceLinks.slice(0, 2).join(" , ")}`);
    }
  for (const w of scan.wildcards) {
    console.log(`\nWILDCARD [${w.lane}] ${w.title}`);
    console.log(`  ${w.summary.slice(0, 200)}`);
  }
} catch (e) {
  console.log("FAILED:", (e as Error).message.slice(0, 400));
}
