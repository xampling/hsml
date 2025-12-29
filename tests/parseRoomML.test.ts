import { describe, expect, it } from 'vitest'
import parseRoomML from '../src/roomml/parseRoomML'

const baseHeader = 'ROOM h=3\nOUTER: M 0 0 L 4 0 L 4 4 L 0 4 Z\n'

describe('parseRoomML', () => {
  it('parses outer and holes', () => {
    const text = `${baseHeader}HOLE inner: M 1 1 L 2 1 L 2 2 L 1 2 Z`
    const result = parseRoomML(text)
    expect(result.outer.length).toBe(4)
    expect(result.holes).toHaveLength(1)
    expect(result.holes[0].name).toBe('inner')
    expect(result.holes[0].points.length).toBe(4)
  })

  it('parses openings on outer and hole walls', () => {
    const text = `${baseHeader}HOLE pit: M 1 1 L 2 1 L 2 2 L 1 2 Z\nOPEN door wall=outer[1] at=1 w=0.9 b=0 h=2\nOPEN window wall=hole(pit)[2] at=0.1 w=0.5 b=0.5 h=1`
    const result = parseRoomML(text)
    expect(result.openings).toHaveLength(2)
    const outerOpen = result.openings.find((o) => o.refKind === 'outer')
    const holeOpen = result.openings.find((o) => o.refKind === 'hole')
    expect(outerOpen?.edgeIndex).toBe(1)
    expect(holeOpen?.refName).toBe('pit')
  })

  it('ignores comments and blank lines', () => {
    const text = `# comment\n\nROOM h=2 floor=0\n# another\nOUTER: M 0 0 L 1 0 L 1 1 L 0 1 Z\n`
    const result = parseRoomML(text)
    expect(result.floorZ).toBe(0)
    expect(result.outer.length).toBe(4)
  })

  it('throws on invalid wall references', () => {
    const text = `${baseHeader}OPEN door wall=outer[5] at=0 w=1 b=0 h=1`
    expect(() => parseRoomML(text)).toThrow()
  })
})
