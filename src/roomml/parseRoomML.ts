import { HoleConfig, LoopPoint, OpeningConfig, RoomConfig } from './types'

interface ParsedOpeningLine {
  type: string
  wall: string
  at: number
  w: number
  b: number
  h: number
}

function parseNumber(value: string, field: string): number {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid number for ${field}: ${value}`)
  }
  return num
}

function parsePath(text: string, label: string): LoopPoint[] {
  const tokens = text.trim().split(/\s+/)
  if (tokens.length < 4) {
    throw new Error(`${label} path is too short`)
  }

  const points: LoopPoint[] = []
  let i = 0

  while (i < tokens.length) {
    const cmd = tokens[i]
    if (cmd === 'Z') {
      if (i !== tokens.length - 1) {
        throw new Error(`Unexpected tokens after Z in ${label} path`)
      }
      break
    }

    if (cmd !== 'M' && cmd !== 'L') {
      throw new Error(`Expected M or L in ${label} path, got ${cmd}`)
    }

    const xToken = tokens[i + 1]
    const yToken = tokens[i + 2]
    if (xToken === undefined || yToken === undefined) {
      throw new Error(`Missing coordinates after ${cmd} in ${label} path`)
    }

    const x = parseNumber(xToken, `${label} x`)
    const y = parseNumber(yToken, `${label} y`)
    points.push([x, y])
    i += 3
  }

  if (points.length < 3) {
    throw new Error(`${label} must have at least 3 points`)
  }

  return points
}

function parseOpening(line: string): ParsedOpeningLine {
  const trimmed = line.trim()
  const tokens = trimmed.split(/\s+/)
  if (tokens.length < 6) {
    throw new Error(`OPEN line is incomplete: ${line}`)
  }

  const [openKeyword, type, ...rest] = tokens
  if (openKeyword !== 'OPEN') {
    throw new Error(`Invalid OPEN line: ${line}`)
  }

  const params: Record<string, string> = {}
  rest.forEach((part) => {
    const [key, value] = part.split('=')
    if (!key || value === undefined) {
      throw new Error(`Invalid parameter in OPEN line: ${part}`)
    }
    params[key] = value
  })

  const wall = params['wall']
  const at = parseNumber(params['at'], 'opening at')
  const w = parseNumber(params['w'], 'opening width')
  const b = parseNumber(params['b'], 'opening bottom')
  const h = parseNumber(params['h'], 'opening height')

  if (!wall) {
    throw new Error(`OPEN line missing wall reference: ${line}`)
  }

  return { type, wall, at, w, b, h }
}

function polygonArea(points: LoopPoint[]): number {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    area += x1 * y2 - x2 * y1
  }
  return area / 2
}

export function parseRoomML(text: string): RoomConfig {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'))

  let roomSeen = false
  let floorZ = 0
  let height: number | undefined
  let ceiling: number | undefined
  let thickness = 0
  let outer: LoopPoint[] | null = null
  const holes: HoleConfig[] = []
  const openings: OpeningConfig[] = []

  for (const line of lines) {
    if (line.startsWith('ROOM')) {
      if (roomSeen) {
        throw new Error('ROOM line specified more than once')
      }
      roomSeen = true
      const paramsPart = line.slice('ROOM'.length).trim()
      const params = paramsPart.split(/\s+/)
      params.forEach((param) => {
        const [key, value] = param.split('=')
        if (!key || value === undefined) {
          throw new Error(`Invalid ROOM parameter: ${param}`)
        }
        switch (key) {
          case 'h':
            height = parseNumber(value, 'room height')
            break
          case 'floor':
            floorZ = parseNumber(value, 'floor height')
            break
          case 'ceil':
            ceiling = parseNumber(value, 'ceiling height')
            break
          case 'thick':
            thickness = parseNumber(value, 'wall thickness')
            break
          default:
            throw new Error(`Unknown ROOM parameter: ${key}`)
        }
      })
      continue
    }

    if (line.startsWith('OUTER')) {
      const pathPart = line.split(':')[1]
      if (!pathPart) {
        throw new Error('OUTER line missing path definition')
      }
      outer = parsePath(pathPart, 'OUTER')
      continue
    }

    if (line.startsWith('HOLE')) {
      const match = line.match(/^HOLE\s+([^:]+):\s*(.*)$/)
      if (!match) {
        throw new Error(`Invalid HOLE line: ${line}`)
      }
      const name = match[1].trim()
      const pathPart = match[2]
      const points = parsePath(pathPart, `HOLE ${name}`)
      holes.push({ name, points })
      continue
    }

    if (line.startsWith('OPEN')) {
      const parsed = parseOpening(line)
      openings.push({
        type: parsed.type,
        refKind: parsed.wall.startsWith('outer') ? 'outer' : 'hole',
        refName: parsed.wall.startsWith('hole')
          ? parsed.wall.match(/hole\(([^)]+)\)/)?.[1]
          : undefined,
        edgeIndex: (() => {
          const match = parsed.wall.match(/\[(\d+)\]/)
          if (!match) {
            throw new Error(`Invalid wall reference format: ${parsed.wall}`)
          }
          return Number(match[1])
        })(),
        at: parsed.at,
        w: parsed.w,
        b: parsed.b,
        h: parsed.h,
      })
      continue
    }

    throw new Error(`Unknown line: ${line}`)
  }

  if (!roomSeen) {
    throw new Error('ROOM line is required')
  }
  if (!outer) {
    throw new Error('OUTER loop is required')
  }

  const resolvedHeight = ceiling !== undefined ? ceiling - floorZ : height
  if (resolvedHeight === undefined) {
    throw new Error('ROOM height (h=) or ceiling (ceil=) must be provided')
  }
  if (resolvedHeight <= 0) {
    throw new Error('Room height must be positive')
  }
  if (thickness < 0) {
    throw new Error('Wall thickness cannot be negative')
  }

  // validate wall references now that loops are known
  const validateEdgeIndex = (loopPoints: LoopPoint[], edgeIndex: number, ref: string) => {
    if (!Number.isInteger(edgeIndex)) {
      throw new Error(`Wall index must be an integer in ${ref}`)
    }
    if (edgeIndex < 0 || edgeIndex >= loopPoints.length) {
      throw new Error(`Wall index ${edgeIndex} out of range for ${ref}`)
    }
  }

  openings.forEach((open) => {
    if (open.refKind === 'outer') {
      validateEdgeIndex(outer!, open.edgeIndex, 'outer wall')
    } else {
      const hole = holes.find((h) => h.name === open.refName)
      if (!hole) {
        throw new Error(`Opening references missing hole: ${open.refName}`)
      }
      validateEdgeIndex(hole.points, open.edgeIndex, `hole(${open.refName}) wall`)
    }
  })

  const config: RoomConfig = {
    units: 'm',
    floorZ,
    height: resolvedHeight,
    thickness,
    outer,
    holes,
    openings: openings.map((o) => ({ ...o })),
  }

  // Ensure outer orientation non-zero area
  if (Math.abs(polygonArea(config.outer)) === 0) {
    throw new Error('OUTER polygon area is zero')
  }

  config.holes.forEach((hole) => {
    if (Math.abs(polygonArea(hole.points)) === 0) {
      throw new Error(`HOLE ${hole.name} polygon area is zero`)
    }
  })

  return config
}

export default parseRoomML
