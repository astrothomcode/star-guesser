import { useEffect, useState } from "react";
import SkyScene from "./components/SkyScene";

type Star = {
  id: number;
  name: string;
  raDeg: number;
  decDeg: number;
  mag: number;
};

type Page = "home" | "play" | "theory";

function randomSpawn() {
  const latDeg = Math.random() * 140 - 70;
  const lonDeg = Math.random() * 360 - 180;

  const start = new Date("2026-01-01T00:00:00Z").getTime();
  const end = new Date("2026-12-31T23:59:59Z").getTime();
  const randomTime = start + Math.random() * (end - start);

  return {
    latDeg,
    lonDeg,
    date: new Date(randomTime),
  };
}

function HomePage({
  onStart,
  onTheory,
}: {
  onStart: () => void;
  onTheory: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1020",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "sans-serif",
        padding: 20,
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "3rem", marginBottom: 10 }}>StarGuessr</h1>
      <p style={{ maxWidth: 700, marginBottom: 30, fontSize: "1.1rem" }}>
        Guess your location on Earth from the night sky using real star
        catalogues and spherical astronomy.
      </p>

      <div style={{ display: "flex", gap: 16 }}>
        <button
          onClick={onStart}
          style={{
            padding: "14px 24px",
            fontSize: "1rem",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
          }}
        >
          Start Playing
        </button>

        <button
          onClick={onTheory}
          style={{
            padding: "14px 24px",
            fontSize: "1rem",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
          }}
        >
          Learn the Theory
        </button>
      </div>
    </div>
  );
}

function TheoryPage({ onBack }: { onBack: () => void }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#10131c",
        color: "white",
        fontFamily: "sans-serif",
        padding: 30,
        lineHeight: 1.6,
      }}
    >
      <button
        onClick={onBack}
        style={{
          marginBottom: 20,
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
        }}
      >
        Back Home
      </button>

      <h1>Spherical Astronomy Theory</h1>

      <p>
        This game works because the night sky depends on where you are on Earth
        and what time it is.
      </p>

      <h2>1. Celestial sphere</h2>
      <p>
        Imagine all the stars placed on a huge sphere around Earth. You stand at
        the center of that sphere and look outward.
      </p>

      <h2>2. Star catalogue coordinates</h2>
      <p>
        Stars are stored using right ascension (RA) and declination (Dec). These
        are like longitude and latitude on the celestial sphere.
      </p>

      <h2>3. Observer coordinates</h2>
      <p>
        For a person standing on Earth, the important coordinates are altitude
        and azimuth:
      </p>
      <ul>
        <li>Altitude = how high above the horizon the star is</li>
        <li>Azimuth = the direction along the horizon</li>
      </ul>

      <h2>4. Horizon</h2>
      <p>
        You can only see the stars above the horizon, so at any moment you only
        see about half of the celestial sphere.
      </p>

      <h2>5. Why location matters</h2>
      <p>
        Your latitude changes which stars rise high in the sky, and your
        longitude changes the local sidereal time, which changes which stars are
        overhead at that moment.
      </p>

      <h2>6. Core idea of the game</h2>
      <p>
        The app chooses a hidden location and time. It calculates the visible sky
        there. Then the player uses spherical astronomy to guess where they are.
      </p>
    </div>
  );
}

function PlayPage({
  onBack,
  stars,
}: {
  onBack: () => void;
  stars: Star[];
}) {
  const [spawn, setSpawn] = useState(randomSpawn());

  return (
    <div style={{ background: "#111", color: "white", minHeight: "100vh" }}>
      <div style={{ padding: 16, fontFamily: "sans-serif" }}>
        <button
          onClick={onBack}
          style={{
            marginBottom: 16,
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          Back Home
        </button>
<button
  onClick={() => setSpawn(randomSpawn())}
  style={{
    marginBottom: 16,
    marginLeft: 12,
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  }}
>
  New Random Spawn
</button>
        <h1>StarGuessr 3D Sky</h1>
        <p>Loaded stars: {stars.length}</p>
        <p>
<p>
  Spawn: lat {spawn.latDeg.toFixed(2)}, lon {spawn.lonDeg.toFixed(2)}, UTC{" "}
  {spawn.date.toISOString()}
</p>        </p>
      </div>

      <SkyScene stars={stars} latDeg={spawn.latDeg} lonDeg={spawn.lonDeg} date={spawn.date} />
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    fetch("/catalogs/bright-stars-300.json")
      .then((r) => r.json())
      .then(setStars)
      .catch((err) => console.error("Failed to load stars:", err));
  }, []);

  if (page === "home") {
    return (
      <HomePage
        onStart={() => setPage("play")}
        onTheory={() => setPage("theory")}
      />
    );
  }

  if (page === "theory") {
    return <TheoryPage onBack={() => setPage("home")} />;
  }

  return <PlayPage onBack={() => setPage("home")} stars={stars} />;
}