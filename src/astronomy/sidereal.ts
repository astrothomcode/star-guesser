export function julianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

export function normalizeDegrees(deg: number): number {
  let x = deg % 360;
  if (x < 0) x += 360;
  return x;
}

export function normalizeHours(hours: number): number {
  let x = hours % 24;
  if (x < 0) x += 24;
  return x;
}

export function gmstHours(date: Date): number {
  const jd = julianDate(date);
  const T = (jd - 2451545.0) / 36525.0;

  let gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;

  gmst = normalizeDegrees(gmst);
  return gmst / 15;
}

export function lstHours(date: Date, longitudeDeg: number): number {
  return normalizeHours(gmstHours(date) + longitudeDeg / 15);
}