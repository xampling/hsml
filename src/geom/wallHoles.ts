import * as THREE from 'three';
import { Opening } from '../hsml/types';

export function buildWallShape(length: number, height: number, openings: Opening[]): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(length, 0);
  shape.lineTo(length, height);
  shape.lineTo(0, height);
  shape.lineTo(0, 0);

  for (const opening of openings) {
    const hole = new THREE.Path();
    hole.moveTo(opening.offset, opening.sill);
    hole.lineTo(opening.offset + opening.w, opening.sill);
    hole.lineTo(opening.offset + opening.w, opening.sill + opening.h);
    hole.lineTo(opening.offset, opening.sill + opening.h);
    hole.lineTo(opening.offset, opening.sill);
    shape.holes.push(hole);
  }

  return shape;
}
