import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

const SOURCE_URL =
  "https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv";

async function main() {
  console.log("Downloading HYG star catalogue...");
  const response = await fetch(SOURCE_URL);

  if (!response.ok) {
    throw new Error(`Failed to download catalogue: ${response.status}`);
  }

  const csvText = await response.text();

  console.log("Parsing catalogue...");
  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log("Filtering stars...");

  const stars = rows
    .map((row) => {
      const id = Number(row.id);
      const hip = row.hip ? Number(row.hip) : null;
      const hr = row.hr ? Number(row.hr) : null;
      const proper = row.proper?.trim() || "";
      const bf = row.bf?.trim() || "";
      const raHours = Number(row.ra);
      const decDeg = Number(row.dec);
      const mag = Number(row.mag);

      const name =
        proper ||
        bf ||
        (hip ? `HIP ${hip}` : hr ? `HR ${hr}` : `Star ${id}`);

      return {
        id,
        hip,
        name,
        raHours,
        raDeg: raHours * 15,
        decDeg,
        mag,
      };
    })
    .filter(
      (star) =>
        Number.isFinite(star.raHours) &&
        Number.isFinite(star.decDeg) &&
        Number.isFinite(star.mag) &&
        star.hip !== null
    )
    .sort((a, b) => a.mag - b.mag)
    .slice(0, 3000);

  const outputDir = path.join(process.cwd(), "public", "catalogs");
  const outputFile = path.join(outputDir, "bright-stars-3000.json");

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify(stars, null, 2), "utf8");

  console.log(`Done. Saved ${stars.length} stars to:`);
  console.log(outputFile);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});