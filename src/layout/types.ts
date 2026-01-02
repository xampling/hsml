import { HSMLNode } from '../hsml/types';

export type LayoutBox = {
  id: string;
  type: HSMLNode['kind'];
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  node: HSMLNode;
  children: LayoutBox[];
};
