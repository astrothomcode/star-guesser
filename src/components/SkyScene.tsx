import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { useMemo, useState } from "react";
import {
  visibleStarsTo3D,
  angularDistanceDeg,
  starTo3D,
  type Star,
} from "../astronomy/skyMath";
import { constellations } from "../data/constellations.generated";

type Props = {
  stars: Star[];
  latDeg: number;
  lonDeg: number;
  date: Date;
};

type MeasurablePoint = {
  id: string;
  hip?: number | null;
  name: string;
  x: number;
  y: number;
  z: number;
  color?: string;
};

const northPoleStar: Star = {
  id: -1,
  hip: null,
  name: "NCP",
  raDeg: 0,
  decDeg: 90,
  mag: -10,
};

const southPoleStar: Star = {
  id: -2,
  hip: null,
  name: "SCP",
  raDeg: 0,
  decDeg: -90,
  mag: -10,
};

function normalizeHipEdge(a: number, b: number) {
  return [a, b].sort((x, y) => x - y).join("||");
}

function checkConstellation(
  lines: [MeasurablePoint, MeasurablePoint][],
  visible: ReturnType<typeof visibleStarsTo3D>
): string {
  const validPlayerEdges = lines.filter(
    ([a, b]) => Number.isFinite(a.hip) && Number.isFinite(b.hip)
  );

  const playerEdges = new Set(
    validPlayerEdges.map(([a, b]) => normalizeHipEdge(a.hip!, b.hip!))
  );

  const visibleHipSet = new Set(
    visible
      .map((s) => s.hip)
      .filter((hip): hip is number => hip !== null && hip !== undefined)
  );

  let bestMatch: { name: string; matched: number; total: number } | null = null;

  for (const constellation of constellations) {
    const targetEdges = new Set(
      constellation.edges
        .filter(([a, b]) => visibleHipSet.has(a) && visibleHipSet.has(b))
        .map(([a, b]) => normalizeHipEdge(a, b))
    );

    if (targetEdges.size === 0) continue;

    let matched = 0;
    for (const edge of playerEdges) {
      if (targetEdges.has(edge)) matched++;
    }

    if (
      !bestMatch ||
      matched > bestMatch.matched ||
      (matched === bestMatch.matched && targetEdges.size < bestMatch.total)
    ) {
      bestMatch = {
        name: constellation.name,
        matched,
        total: targetEdges.size,
      };
    }
  }

  if (!bestMatch || bestMatch.matched === 0) {
    return "❌ No valid constellation";
  }

  const score = bestMatch.matched / bestMatch.total;

  if (score >= 0.4) {
    return `✅ Likely: ${bestMatch.name} (${Math.round(score * 100)}%)`;
  }

  return `❌ Closest: ${bestMatch.name} (${Math.round(score * 100)}%)`;
}

function HorizonRing() {
  const points = useMemo(() => {
    const arr: number[] = [];
    const r = 100;

    for (let i = 0; i <= 128; i++) {
      const t = (i / 128) * Math.PI * 2;
      arr.push(r * Math.sin(t), 0, r * Math.cos(t));
    }

    return new Float32Array(arr);
  }, []);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#7a7f87" />
    </line>
  );
}

function SimpleLine({
  from,
  to,
}: {
  from: { x: number; y: number; z: number };
  to: { x: number; y: number; z: number };
}) {
  const positions = useMemo(
    () => new Float32Array([from.x, from.y, from.z, to.x, to.y, to.z]),
    [from, to]
  );

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="cyan" />
    </line>
  );
}

function ClickableStars({
  stars,
  onMeasureSelect,
  onPoleGuess,
  selectedIds,
  poleGuessId,
  pendingConstellationStarId,
}: {
  stars: ReturnType<typeof visibleStarsTo3D>;
  onMeasureSelect: (star: MeasurablePoint) => void;
  onPoleGuess: (star: MeasurablePoint) => void;
  selectedIds: string[];
  poleGuessId: string | null;
  pendingConstellationStarId: string | null;
}) {
  return (
    <>
      {stars.map((star) => {
        const point: MeasurablePoint = {
          id: `star-${star.id}`,
          hip: star.hip ?? null,
          name: star.name,
          x: star.x,
          y: star.y,
          z: star.z,
          color: "white",
        };

        const isSelected =
          selectedIds.includes(point.id) ||
          pendingConstellationStarId === point.id;
        const isPoleGuess = poleGuessId === point.id;

        const size = Math.max(
          0.08,
          Math.min(2.2, 1.8 * Math.exp(-0.35 * star.mag))
        );

        return (
          <mesh
            key={point.id}
            position={[point.x, point.y, point.z]}
            onClick={(e) => {
              e.stopPropagation();
              onMeasureSelect(point);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onPoleGuess(point);
            }}
          >
            <sphereGeometry args={[isSelected ? size * 1.8 : size, 8, 8]} />
            <meshBasicMaterial
              color={isPoleGuess ? "hotpink" : isSelected ? "yellow" : "white"}
              transparent
              opacity={
                isPoleGuess || isSelected
                  ? 1
                  : Math.max(0.08, 0.7 * Math.exp(-0.3 * star.mag))
              }
            />
          </mesh>
        );
      })}
    </>
  );
}

export default function SkyScene({ stars, latDeg, lonDeg, date }: Props) {
  const radius = 100;

  const visible = useMemo(
    () => visibleStarsTo3D(stars, latDeg, lonDeg, date, radius),
    [stars, latDeg, lonDeg, date]
  );

  const trueNorthPole = useMemo(
    () => starTo3D(northPoleStar, latDeg, lonDeg, date, radius),
    [latDeg, lonDeg, date]
  );

  const trueSouthPole = useMemo(
    () => starTo3D(southPoleStar, latDeg, lonDeg, date, radius),
    [latDeg, lonDeg, date]
  );

  const zenith: MeasurablePoint = {
    id: "zenith",
    hip: null,
    name: "Zenith",
    x: 0,
    y: radius,
    z: 0,
    color: "#8b5cf6",
  };

  const cardinalPoints: MeasurablePoint[] = [
    { id: "north", hip: null, name: "N", x: 0, y: 0, z: radius, color: "#ef4444" },
    { id: "east", hip: null, name: "E", x: radius, y: 0, z: 0, color: "#ef4444" },
    { id: "south", hip: null, name: "S", x: 0, y: 0, z: -radius, color: "#ef4444" },
    { id: "west", hip: null, name: "W", x: -radius, y: 0, z: 0, color: "#ef4444" },
  ];

  const [selected, setSelected] = useState<MeasurablePoint[]>([]);
  const [poleGuess, setPoleGuess] = useState<MeasurablePoint | null>(null);
  const [cardinalsUnlocked, setCardinalsUnlocked] = useState(false);

  const [constellationMode, setConstellationMode] = useState(false);
  const [constellationLines, setConstellationLines] = useState<
    [MeasurablePoint, MeasurablePoint][]
  >([]);
  const [pendingConstellationStar, setPendingConstellationStar] =
    useState<MeasurablePoint | null>(null);
  const [constellationResult, setConstellationResult] = useState("");

  const [poleMessage, setPoleMessage] = useState(
    "Double-click Polaris or Acrux to unlock the cardinal points."
  );

  function handleMeasureSelect(point: MeasurablePoint) {
    if (constellationMode) {
      if (!pendingConstellationStar) {
        setPendingConstellationStar(point);
        return;
      }

      if (pendingConstellationStar.id !== point.id) {
        setConstellationLines((prev) => [
          ...prev,
          [pendingConstellationStar, point],
        ]);
      }

      setPendingConstellationStar(point);
      return;
    }

    setSelected((prev) => {
      if (prev.length === 0) return [point];
      if (prev.length === 1) return [prev[0], point];
      return [point];
    });
  }

  function handlePoleGuess(point: MeasurablePoint) {
    const normalizedName = point.name.trim().toLowerCase();
    const isPolaris = normalizedName === "polaris";
    const isAcrux = normalizedName === "acrux";

    setPoleGuess(point);

    if (isPolaris || isAcrux) {
      setCardinalsUnlocked(true);
      setPoleMessage(`${point.name} recognized. Cardinal points unlocked.`);
    } else {
      setPoleMessage(`${point.name} is not a pole indicator.`);
    }
  }

  let measureAngle: number | null = null;
  if (selected.length === 2) {
    measureAngle = angularDistanceDeg(selected[0], selected[1]);
  }

  let poleError: number | null = null;
  let poleResult = "-";

  if (poleGuess) {
    const errorNorth = angularDistanceDeg(poleGuess, trueNorthPole);
    const errorSouth = angularDistanceDeg(poleGuess, trueSouthPole);

    poleError = Math.min(errorNorth, errorSouth);
    poleResult = poleError < 5 ? "✅ Correct" : "❌ Try again";
  }

  const selectedIds = selected.map((p) => p.id);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#070b16",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 10,
          color: "white",
          padding: 12,
          fontFamily: "sans-serif",
          background: "rgba(0,0,0,0.55)",
          borderRadius: 8,
          maxWidth: 360,
        }}
      >
        <div>
          <strong>Visible stars:</strong> {visible.length}
        </div>
        <div>
          <strong>Mode:</strong> {constellationMode ? "Constellation" : "Measurement"}
        </div>
        <div>
          <strong>Pole guess:</strong>{" "}
          {poleGuess ? poleGuess.name : "double-click a star"}
        </div>
        <div>
          <strong>Status:</strong> {poleMessage}
        </div>
        <div>
          <strong>Pole error:</strong>{" "}
          {poleError !== null ? `${poleError.toFixed(2)}°` : "-"}
        </div>
        <div>
          <strong>Pole result:</strong> {poleResult}
        </div>
        <div>
          <strong>Cardinals:</strong> {cardinalsUnlocked ? "unlocked" : "locked"}
        </div>
        <div>
          <strong>Selected:</strong>{" "}
          {selected.length === 0
            ? "none"
            : selected.map((s) => s.name).join(" → ")}
        </div>
        <div>
          <strong>Angular distance:</strong>{" "}
          {measureAngle === null ? "click two points" : `${measureAngle.toFixed(2)}°`}
        </div>
        <div>
          <strong>Pending constellation star:</strong>{" "}
          {pendingConstellationStar ? pendingConstellationStar.name : "-"}
        </div>
        <div>
          <strong>Constellation lines:</strong> {constellationLines.length}
        </div>
        <div>
          <strong>Constellation:</strong> {constellationResult || "-"}
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setConstellationMode((prev) => !prev);
              setPendingConstellationStar(null);
              setSelected([]);
            }}
          >
            {constellationMode ? "Exit Constellation Mode" : "Constellation Mode"}
          </button>

          <button
            onClick={() => {
              setConstellationLines([]);
              setPendingConstellationStar(null);
              setConstellationResult("");
            }}
          >
            Clear Constellation
          </button>

          <button
            onClick={() => {
              setConstellationResult(
                checkConstellation(constellationLines, visible)
              );
            }}
          >
            Submit Constellation
          </button>
        </div>
      </div>

      <Canvas
        style={{ width: "100%", height: "100%" }}
        camera={{ position: [0, 0, 0.1], fov: 75 }}
      >
        <color attach="background" args={["#070b16"]} />

        <ClickableStars
          stars={visible}
          onMeasureSelect={handleMeasureSelect}
          onPoleGuess={handlePoleGuess}
          selectedIds={selectedIds}
          poleGuessId={poleGuess?.id ?? null}
          pendingConstellationStarId={pendingConstellationStar?.id ?? null}
        />

        {constellationLines.map(([from, to], index) => (
          <SimpleLine key={index} from={from} to={to} />
        ))}

        <HorizonRing />

        <group position={[zenith.x, zenith.y, zenith.z]}>
          <mesh onClick={() => handleMeasureSelect(zenith)}>
            <sphereGeometry args={[0.8, 10, 10]} />
            <meshBasicMaterial
              color={selectedIds.includes(zenith.id) ? "yellow" : "#8b5cf6"}
            />
          </mesh>
          <Text
            position={[0, 4, 0]}
            fontSize={5}
            color="#8b5cf6"
            anchorX="center"
            anchorY="middle"
          >
            Z
          </Text>
        </group>

        {cardinalsUnlocked &&
          cardinalPoints.map((point) => (
            <group key={point.id} position={[point.x, point.y, point.z]}>
              <mesh onClick={() => handleMeasureSelect(point)}>
                <sphereGeometry
                  args={[selectedIds.includes(point.id) ? 1.2 : 0.7, 10, 10]}
                />
                <meshBasicMaterial
                  color={selectedIds.includes(point.id) ? "yellow" : "#ef4444"}
                />
              </mesh>
              <Text
                position={[0, 4, 0]}
                fontSize={5}
                color="#ef4444"
                anchorX="center"
                anchorY="middle"
              >
                {point.name}
              </Text>
            </group>
          ))}

        {!constellationMode && selected.length === 2 && (
          <SimpleLine from={selected[0]} to={selected[1]} />
        )}

        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}