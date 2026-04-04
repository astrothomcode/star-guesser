import fs from "fs/promises";
import path from "path";

const INDEX_URL =
  "https://raw.githubusercontent.com/Stellarium/stellarium-skycultures/master/western/index.json";

async function main() {
  console.log("Downloading constellation data...");

  const response = await fetch(INDEX_URL);
  if (!response.ok) {
    throw new Error(`Failed to download western/index.json: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data.constellations)) {
    throw new Error("index.json does not contain a constellations array");
  }

  const constellations = data.constellations.map((c) => ({
    key:
      c.id ??
      c.iau ??
      c.common_name?.english ??
      c.common_name?.native ??
      "unknown",
    name:
      c.common_name?.english ??
      c.common_name?.native ??
      c.id ??
      c.iau ??
      "Unknown",
    edges: Array.isArray(c.lines)
      ? c.lines
          .filter((line) => Array.isArray(line) && line.length >= 2)
          .map((line) => [Number(line[0]), Number(line[1])])
          .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b))
      : [],
  }));

  const filtered = constellations.filter((c) => c.edges.length > 0);

  const outputDir = path.join(process.cwd(), "src", "data");
  const outputFile = path.join(outputDir, "constellations.generated.ts");

  const fileContents = `export type GeneratedConstellation = {
  key: string;
  name: string;
  edges: [number, number][];
};

export const constellations: GeneratedConstellation[] = ${JSON.stringify(
    filtered,
    null,
    2
  )} as const;
`;

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputFile, fileContents, "utf8");

  console.log(`Done. Saved ${filtered.length} constellations to:`);
  console.log(outputFile);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});