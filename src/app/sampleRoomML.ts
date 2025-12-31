import { RoomMLNode } from '../roomml/types';

export const sampleRoomML: RoomMLNode = {
  type: 'house',
  id: 'house-1',
  layout: { mode: 'flex', dir: 'row', gap: 1 },
  children: [
    {
      type: 'room',
      id: 'living',
      size: { w: 6, d: 5, h: 3 },
      children: [
        {
          type: 'door',
          id: 'living-door',
          wall: 'E',
          offset: 2,
          size: { w: 1, h: 2 },
          sill: 0
        },
        {
          type: 'window',
          id: 'living-window',
          wall: 'N',
          offset: 1.5,
          size: { w: 1.5, h: 1.2 },
          sill: 0.9
        },
        {
          type: 'furniture',
          id: 'sofa',
          size: { w: 2, d: 1, h: 1 },
          place: { mode: 'anchor', anchor: 'S', inset: 0.2, offset: 1.5 }
        },
        {
          type: 'furniture',
          id: 'coffee-table',
          size: { w: 1, d: 0.6, h: 0.4 },
          place: { mode: 'free', x: 2.5, z: 2, y: 0 }
        }
      ]
    },
    {
      type: 'room',
      id: 'kitchen',
      size: { w: 4, d: 4, h: 3 },
      children: [
        {
          type: 'window',
          id: 'kitchen-window',
          wall: 'S',
          offset: 1,
          size: { w: 1.2, h: 1 },
          sill: 1
        },
        {
          type: 'furniture',
          id: 'island',
          size: { w: 1.2, d: 1, h: 0.9 },
          place: { mode: 'free', x: 1.5, z: 1.5, y: 0 }
        }
      ]
    }
  ]
};
