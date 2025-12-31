import * as THREE from 'three';
import { DoorNode, WindowNode } from '../roomml/types';

export type Opening = DoorNode | WindowNode;

export function buildWallShape(length: number, height: number, openings: Opening[]): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(length, 0);
  shape.lineTo(length, height);
  shape.lineTo(0, height);
  shape.lineTo(0, 0);

  for (const opening of openings) {
    const sill = opening.sill ?? (opening.type === 'window' ? 0.9 : 0);
    const hole = new THREE.Path();
    hole.moveTo(opening.offset, sill);
    hole.lineTo(opening.offset + opening.size.w, sill);
    hole.lineTo(opening.offset + opening.size.w, sill + opening.size.h);
    hole.lineTo(opening.offset, sill + opening.size.h);
    hole.lineTo(opening.offset, sill);
    shape.holes.push(hole);
  }

  return shape;
}
