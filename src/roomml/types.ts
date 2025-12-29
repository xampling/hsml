export type LoopPoint = [number, number]

export interface OpeningConfig {
  type: string
  refKind: 'outer' | 'hole'
  refName?: string
  edgeIndex: number
  at: number
  w: number
  b: number
  h: number
}

export interface HoleConfig {
  name: string
  points: LoopPoint[]
}

export interface RoomConfig {
  units: 'm'
  floorZ: number
  height: number
  thickness: number
  outer: LoopPoint[]
  holes: HoleConfig[]
  openings: OpeningConfig[]
}
