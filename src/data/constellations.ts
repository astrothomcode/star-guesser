export type Constellation = {
  name: string;
  fullEdges: [string, string][];
  coreEdges: [string, string][];
};

export const constellations: Constellation[] = [
  {
    name: "Orion",
    fullEdges: [
      ["Betelgeuse", "Bellatrix"],
      ["Bellatrix", "Mintaka"],
      ["Mintaka", "Alnilam"],
      ["Alnilam", "Alnitak"],
      ["Alnitak", "Saiph"],
      ["Saiph", "Rigel"],
      ["Rigel", "Mintaka"],
      ["Betelgeuse", "Alnitak"]
    ],
    coreEdges: [
      ["Mintaka", "Alnilam"],
      ["Alnilam", "Alnitak"],
      ["Betelgeuse", "Bellatrix"],
      ["Saiph", "Rigel"]
    ],
  },
  {
    name: "Crux",
    fullEdges: [
      ["Gacrux", "Mimosa"],
      ["Mimosa", "Acrux"],
      ["Mimosa", "Delta Crucis"]
    ],
    coreEdges: [
      ["Gacrux", "Mimosa"],
      ["Mimosa", "Acrux"]
    ],
  },
];