import * as THREE from 'three'
import parseRoomML from './parseRoomML'
import { OpeningConfig, RoomConfig } from './types'

function area2D(points: [number, number][]): number {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    area += x1 * y2 - x2 * y1
  }
  return area / 2
}

function vector2FromPoints(a: [number, number], b: [number, number]): THREE.Vector3 {
  return new THREE.Vector3(b[0] - a[0], 0, b[1] - a[1])
}

function buildLoopShape(config: RoomConfig): THREE.Shape {
  const outerShape = new THREE.Shape()
  config.outer.forEach(([x, y], idx) => {
    if (idx === 0) outerShape.moveTo(x, y)
    else outerShape.lineTo(x, y)
  })

  const outerArea = area2D(config.outer)

  config.holes.forEach((hole) => {
    const holeShape = new THREE.Path()
    const holeArea = area2D(hole.points)
    const points = [...hole.points]

    // Ensure holes have opposite winding to the outer shape
    const needsReverse = Math.sign(holeArea) === Math.sign(outerArea)
    const loopPoints = needsReverse ? points.slice().reverse() : points

    loopPoints.forEach(([x, y], idx) => {
      if (idx === 0) holeShape.moveTo(x, y)
      else holeShape.lineTo(x, y)
    })

    outerShape.holes.push(holeShape)
  })

  return outerShape
}

function wallOpeningsForEdge(openings: OpeningConfig[], refKind: OpeningConfig['refKind'], refName: string | undefined, edgeIndex: number) {
  return openings.filter(
    (o) => o.refKind === refKind && o.refName === refName && o.edgeIndex === edgeIndex,
  )
}

function createWallMesh(
  start: [number, number],
  end: [number, number],
  height: number,
  thickness: number,
  interiorLeft: boolean,
  floorZ: number,
  openings: OpeningConfig[],
  refKind: 'outer' | 'hole',
  refName: string | undefined,
  edgeIndex: number,
  material: THREE.Material,
): THREE.Mesh {
  const edgeVector = vector2FromPoints(start, end)
  const length = edgeVector.length()
  if (length === 0) {
    throw new Error('Wall edge has zero length')
  }

  const segmentOpenings = wallOpeningsForEdge(openings, refKind, refName, edgeIndex)

  const wallShape = new THREE.Shape()
  wallShape.moveTo(0, 0)
  wallShape.lineTo(length, 0)
  wallShape.lineTo(length, height)
  wallShape.lineTo(0, height)
  wallShape.lineTo(0, 0)

  segmentOpenings.forEach((open) => {
    if (open.at < 0 || open.w <= 0 || open.h <= 0 || open.b < 0) {
      throw new Error(`Invalid opening dimensions on wall ${edgeIndex}`)
    }
    if (open.at + open.w > length) {
      throw new Error(`Opening on wall ${edgeIndex} exceeds wall length`)
    }
    if (open.b + open.h > height) {
      throw new Error(`Opening on wall ${edgeIndex} exceeds wall height`)
    }
    const hole = new THREE.Path()
    hole.moveTo(open.at, open.b)
    hole.lineTo(open.at + open.w, open.b)
    hole.lineTo(open.at + open.w, open.b + open.h)
    hole.lineTo(open.at, open.b + open.h)
    hole.lineTo(open.at, open.b)
    wallShape.holes.push(hole)
  })

  const geometry = thickness > 0
    ? new THREE.ExtrudeGeometry(wallShape, { depth: thickness, bevelEnabled: false })
    : new THREE.ShapeGeometry(wallShape)

  geometry.computeBoundingBox()

  const edgeDir = edgeVector.clone().normalize()
  const up = new THREE.Vector3(0, 1, 0)
  const interiorNormal = interiorLeft
    ? new THREE.Vector3(-edgeDir.z, 0, edgeDir.x)
    : new THREE.Vector3(edgeDir.z, 0, -edgeDir.x)

  const basis = new THREE.Matrix4().makeBasis(edgeDir, up, interiorNormal)
  geometry.applyMatrix4(basis)
  geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(start[0], floorZ, start[1]))
  geometry.computeVertexNormals()

  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = `Wall:${refKind === 'outer' ? 'outer' : `hole(${refName})`}[${edgeIndex}]`
  return mesh
}

export function buildRoomFromRoomML(
  text: string,
  opts?: {
    materials?: {
      floor?: THREE.Material
      ceiling?: THREE.Material
      wall?: THREE.Material
    }
  },
): THREE.Group {
  const config = parseRoomML(text)

  const group = new THREE.Group()

  const floorMaterial = opts?.materials?.floor ?? new THREE.MeshStandardMaterial({ color: '#a0a0a0' })
  const ceilingMaterial = opts?.materials?.ceiling ?? new THREE.MeshStandardMaterial({ color: '#d0d0d0', side: THREE.BackSide })
  const wallMaterial = opts?.materials?.wall ?? new THREE.MeshStandardMaterial({ color: '#cccccc' })

  const shape = buildLoopShape(config)

  // Floor
  const floorGeometry = new THREE.ShapeGeometry(shape)
  floorGeometry.rotateX(-Math.PI / 2)
  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial)
  floorMesh.position.y = config.floorZ
  floorMesh.name = 'Floor'
  group.add(floorMesh)

  // Ceiling (flip normals)
  const ceilingGeometry = new THREE.ShapeGeometry(shape)
  ceilingGeometry.rotateX(-Math.PI / 2)
  ceilingGeometry.scale(1, -1, 1)
  const ceilingMesh = new THREE.Mesh(ceilingGeometry, ceilingMaterial)
  ceilingMesh.position.y = config.floorZ + config.height
  ceilingMesh.name = 'Ceiling'
  group.add(ceilingMesh)

  const outerArea = area2D(config.outer)
  const outerInteriorLeft = outerArea > 0

  config.outer.forEach((point, idx) => {
    const next = config.outer[(idx + 1) % config.outer.length]
    const wall = createWallMesh(
      point,
      next,
      config.height,
      config.thickness,
      outerInteriorLeft,
      config.floorZ,
      config.openings,
      'outer',
      undefined,
      idx,
      wallMaterial,
    )
    group.add(wall)
  })

  config.holes.forEach((hole) => {
    const holeArea = area2D(hole.points)
    const interiorLeft = holeArea > 0 // follow the hole winding so normals face the void
    hole.points.forEach((point, idx) => {
      const next = hole.points[(idx + 1) % hole.points.length]
      const wall = createWallMesh(
        point,
        next,
        config.height,
        config.thickness,
        interiorLeft,
        config.floorZ,
        config.openings,
        'hole',
        hole.name,
        idx,
        wallMaterial,
      )
      group.add(wall)
    })
  })

  return group
}

export default buildRoomFromRoomML
