import { HSMLContent, StyleMap } from './parseHSML';

export type Opening = {
  kind: 'door' | 'window';
  wall: 'N' | 'E' | 'S' | 'W';
  offset: number;
  w: number;
  h: number;
  sill: number;
};

export type ResolvedStyle = {
  w: number | 'auto';
  d: number | 'auto';
  h: number | 'auto';
  layout?: 'row' | 'col';
  gap: number;
  padding: { x: number; y: number; z: number };
  margin: { x: number; y: number; z: number };
  basis?: number;
  grow?: number;
  shrink?: number;
  t: number;
  openings: Opening[];
  raw: StyleMap;
  declaredKind?: string;
};

export type HSMLNode = {
  name: string;
  path: string;
  children: HSMLNode[];
  content?: HSMLContent;
  style: ResolvedStyle;
  kind: 'container' | 'room' | 'leaf';
  measured?: Size3D;
};

export type HSMLNodeDraft = {
  name: string;
  path: string;
  children: HSMLNodeDraft[];
  content?: HSMLContent;
  inlineStyle: StyleMap;
};

export type Size3D = { w: number; d: number; h: number };

export type ValidationIssue = {
  level: 'error' | 'warn';
  path: string;
  message: string;
};
