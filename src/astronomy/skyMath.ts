import { lstHours } from "./sidereal";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function degToRad(deg: number): number {
  return deg * DEG2RAD;
}

function radToDeg(rad: number): number {
  return rad * RAD2DEG;
}

function normalizeRadians(angle: number): number {
  let a = angle % (2 * Math.PI);
  if (a < 0) a += 2 * Math.PI;
  return a;
}

export type Star = {
  id: number;
  hip?: number | null;
  name: string;
  raDeg: number;
  decDeg: number;
  mag: number;
};

export type VisibleStar = Star & {
  altitudeDeg: number;
  azimuthDeg: number;
  x: number;
  y: number;
  z: number;
};

export function starToHorizontal(
  star: Star,
  latDeg: number,
  lonDeg: number,
  date: Date
) {
  const lat = degToRad(latDeg);
  const dec = degToRad(star.decDeg);

  const raHours = star.raDeg / 15;
  const lst = lstHours(date, lonDeg);
  const hourAngleHours = lst - raHours;
  const H = degToRad(hourAngleHours * 15);

  const sinAlt =
    Math.sin(lat) * Math.sin(dec) +
    Math.cos(lat) * Math.cos(dec) * Math.cos(H);

  const alt = Math.asin(sinAlt);

  const yAz = -Math.cos(dec) * Math.sin(H);
  const xAz =
    Math.sin(dec) * Math.cos(lat) -
    Math.cos(dec) * Math.sin(lat) * Math.cos(H);

  const az = normalizeRadians(Math.atan2(yAz, xAz));

  return {
    altitudeDeg: radToDeg(alt),
    azimuthDeg: radToDeg(az),
    altitudeRad: alt,
    azimuthRad: az,
  };
}

export function visibleStarsTo3D(
  stars: Star[],
  latDeg: number,
  lonDeg: number,
  date: Date,
  radius = 100
): VisibleStar[] {
  return stars
    .map((star) => {
      const h = starToHorizontal(star, latDeg, lonDeg, date);

      const alt = h.altitudeRad;
      const az = h.azimuthRad;

      const x = radius * Math.cos(alt) * Math.sin(az);
      const y = radius * Math.sin(alt);
      const z = radius * Math.cos(alt) * Math.cos(az);

      return {
        ...star,
        altitudeDeg: h.altitudeDeg,
        azimuthDeg: h.azimuthDeg,
        x,
        y,
        z,
      };
    })
    .filter((star) => star.altitudeDeg >= 0);
}

export function starTo3D(
  star: Star,
  latDeg: number,
  lonDeg: number,
  date: Date,
  radius = 100
) {
  const h = starToHorizontal(star, latDeg, lonDeg, date);

  const alt = h.altitudeRad;
  const az = h.azimuthRad;

  const x = radius * Math.cos(alt) * Math.sin(az);
  const y = radius * Math.sin(alt);
  const z = radius * Math.cos(alt) * Math.cos(az);

  return {
    ...star,
    altitudeDeg: h.altitudeDeg,
    azimuthDeg: h.azimuthDeg,
    x,
    y,
    z,
  };
}

export function normalizeVector(x: number, y: number, z: number) {
  const length = Math.sqrt(x * x + y * y + z * z);
  return {
    x: x / length,
    y: y / length,
    z: z / length,
  };
}

export function angularDistanceDeg(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
) {
  const na = normalizeVector(a.x, a.y, a.z);
  const nb = normalizeVector(b.x, b.y, b.z);

  const dot = na.x * nb.x + na.y * nb.y + na.z * nb.z;
  const clamped = Math.max(-1, Math.min(1, dot));
  return (Math.acos(clamped) * 180) / Math.PI;
}