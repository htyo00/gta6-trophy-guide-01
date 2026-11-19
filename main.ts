// Sunset Platinum — entrypoint for the gta6-trophy-guide-01 bounty.
// Hands the guide in: copies app/ and screenshots/ into the output
// directory, then writes dossier.json with buildDossier from the kit's
// vendored frontend library. Node 22, standard library only.

import { buildDossier } from "./vendor/makefun-frontend.ts";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The repository root is the directory this entrypoint lives in.
const repoRoot = dirname(fileURLToPath(import.meta.url));

// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// The dossier text cap from the competition rules: the judge view is built
// from at most this many bytes of source text.
const dossierTextLimit = 163840;

async function handInGuide() {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  await cp(join(repoRoot, "app"), join(outputDir, "app"), { recursive: true });
  await cp(join(repoRoot, "screenshots"), join(outputDir, "screenshots"), {
    recursive: true,
  });
  // buildDossier returns the dossier bytes themselves: write them as-is so
  // dossier.json is byte for byte what the library writes.
  const dossier = await buildDossier(outputDir, {
    text_max_bytes: dossierTextLimit,
  });
  await writeFile(join(outputDir, "dossier.json"), dossier);
}

await handInGuide();
