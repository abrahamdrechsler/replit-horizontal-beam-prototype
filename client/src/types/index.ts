// Entity types enum
export enum EntityType {
  Floor = 'floor',
  Beam = 'beam'
}

// Base entity interface
export interface Entity {
  id: string;
  type: EntityType;
}

// Floor system entity
export interface FloorSystem extends Entity {
  type: EntityType.Floor;
  x: number;
  y: number;
  width: number;
  height: number;
  joistDirection: 'x' | 'y';
  joistDepth: number;
  joistSpacing: number;
  systemDepth: number;
}

// Beam entity
export interface Beam extends Entity {
  type: EntityType.Beam;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  depth: number;
}

// Drawing states
export interface DrawingFloor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DrawingBeam {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}
