export type AABB = { x: number; y: number; z: number; w: number; h: number; d: number };

export function intersects(a: AABB, b: AABB): boolean {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y ||
    a.z + a.d <= b.z ||
    b.z + b.d <= a.z
  );
}
