export type RoomMLNode =
  | ContainerNode
  | RoomNode
  | FurnitureNode
  | DoorNode
  | WindowNode
  | GroupNode;

export type BaseNode = {
  type: string;
  id?: string;
  children?: RoomMLNode[];
  flex?: FlexSizing;
};

export type FlexSizing = {
  basis?: number;
  grow?: number;
  shrink?: number;
};

export type ContainerNode = BaseNode & {
  type: 'house' | 'floor' | 'container';
  size?: Size3DPartial;
  layout?: LayoutSettings;
};

export type GroupNode = BaseNode & {
  type: 'group';
};

export type RoomNode = BaseNode & {
  type: 'room';
  id: string;
  size: Size3D;
  thickness?: Thickness;
};

export type FurnitureNode = BaseNode & {
  type: 'furniture';
  id: string;
  size: Size3D;
  place?: FurniturePlacement;
};

export type DoorNode = BaseNode & {
  type: 'door';
  id?: string;
  wall: WallSide;
  offset: number;
  size: Size2D;
  sill?: number;
};

export type WindowNode = BaseNode & {
  type: 'window';
  id?: string;
  wall: WallSide;
  offset: number;
  size: Size2D;
  sill?: number;
};

export type FurniturePlacement =
  | { mode: 'free'; x?: number; z?: number; y?: number }
  | { mode: 'anchor'; anchor: WallSide; offset?: number; inset?: number; y?: number };

export type WallSide = 'N' | 'E' | 'S' | 'W';

export type Size3D = { w: number; d: number; h: number };
export type Size3DPartial = { w?: number; d?: number; h?: number };
export type Size2D = { w: number; h: number };
export type Thickness = { wall?: number; floor?: number; ceiling?: number };

export type LayoutSettings = {
  mode: 'flex';
  dir: 'row' | 'col';
  gap?: number;
  wrap?: boolean;
  align?: 'start' | 'center' | 'end';
  justify?: 'start' | 'center' | 'end';
};

export type ValidationIssue = {
  level: 'error' | 'warn';
  path: string;
  message: string;
};
