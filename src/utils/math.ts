export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function nearlyEquals(a: number, b: number, epsilon = 1e-6): boolean {
  return Math.abs(a - b) < epsilon;
}
