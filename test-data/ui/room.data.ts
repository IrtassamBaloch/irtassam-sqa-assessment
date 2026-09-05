export interface RoomData {
  name: string;
  type: 'Single' | 'Twin' | 'Double' | 'Family' | 'Suite';
  accessible: boolean;
  price: string;
  features: readonly ('WiFi' | 'TV' | 'Radio' | 'Refreshments' | 'Safe' | 'Views')[];
}

export function createRoomData(suffix: string): RoomData {
  return {
    name: `SQA-${suffix}`,
    type: 'Twin',
    accessible: false,
    price: '175',
    features: ['WiFi', 'TV'],
  };
}

export function createUpdatedRoomData(name: string): RoomData {
  return {
    name,
    type: 'Suite',
    accessible: true,
    price: '225',
    features: ['WiFi', 'TV', 'Safe', 'Views'],
  };
}
