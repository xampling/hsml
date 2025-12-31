import { RoomMLNode } from '../roomml/types';

export type LayoutBox = {
  id: string;
  type: RoomMLNode['type'];
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  node: RoomMLNode;
  children: LayoutBox[];
};
