export type Constellation = {
  name: string;
  edges: [string, string][];
};

export const constellations: Constellation[] = [
  {
    name: "Orion",
    edges: [
      ["Betelgeuse", "Bellatrix"],
      ["Bellatrix", "Mintaka"],
      ["Mintaka", "Alnilam"],
      ["Alnilam", "Alnitak"],
      ["Alnitak", "Saiph"],
      ["Saiph", "Rigel"],
      ["Rigel", "Mintaka"]
    ],
  },
  {
    name: "Crux",
    edges: [
      ["Acrux", "Mimosa"],
      ["Mimosa", "Gacrux"],
      ["Gacrux", "Delta Crucis"],
      ["Mimosa", "Delta Crucis"]
    ],
  },
  {
    name: "Cassiopeia",
    edges: [
      ["Caph", "Schedar"],
      ["Schedar", "Gamma Cassiopeiae"],
      ["Gamma Cassiopeiae", "Ruchbah"],
      ["Ruchbah", "Segin"]
    ],
  },
];