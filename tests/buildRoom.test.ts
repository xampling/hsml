import { describe, expect, it } from 'vitest'
import buildRoomFromRoomML from '../src/roomml/buildRoom'

const squareRoom = `ROOM h=3\nOUTER: M 0 0 L 4 0 L 4 4 L 0 4 Z\n`

function findWall(group: any, name: string) {
  return group.children.find((c: any) => c.name === name)
}

describe('buildRoomFromRoomML', () => {
  it('creates one wall mesh per edge', () => {
    const group = buildRoomFromRoomML(squareRoom)
    const walls = group.children.filter((c) => c.name.startsWith('Wall:outer'))
    expect(walls).toHaveLength(4)
    expect(group.getObjectByName('Floor')).toBeTruthy()
    expect(group.getObjectByName('Ceiling')).toBeTruthy()
  })

  it('creates different geometry when openings are present', () => {
    const noOpen = buildRoomFromRoomML(squareRoom)
    const withOpen = buildRoomFromRoomML(
      `${squareRoom}OPEN door wall=outer[0] at=1 w=1 b=0 h=2`,
    )

    const wallPlain = findWall(noOpen, 'Wall:outer[0]')
    const wallOpen = findWall(withOpen, 'Wall:outer[0]')

    const plainCount = wallPlain?.geometry.getAttribute('position').count
    const openCount = wallOpen?.geometry.getAttribute('position').count

    expect(openCount).toBeGreaterThan(plainCount!)
  })

  it('adds wall meshes for hole boundaries', () => {
    const text = `${squareRoom}HOLE void: M 1 1 L 3 1 L 3 3 L 1 3 Z\n`
    const group = buildRoomFromRoomML(text)
    const holeWalls = group.children.filter((c) => c.name.startsWith('Wall:hole(void)'))
    expect(holeWalls).toHaveLength(4)
  })
})
