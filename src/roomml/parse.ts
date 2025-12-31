import { ensureIds, resetIdCounters } from './ids';
import { RoomMLNode } from './types';

export function parseRoomML(jsonText: string): RoomMLNode {
  const parsed = JSON.parse(jsonText) as RoomMLNode;
  resetIdCounters();
  return ensureIds(parsed);
}
