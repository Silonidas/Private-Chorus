
import { Wall, Door, RoomElement } from "@/components/RoomBuilder";

interface Player {
  id: string;
  x: number;
  y: number;
}

// Check if a line segment intersects with a wall
function lineIntersectsWall(
  startX: number, 
  startY: number, 
  endX: number, 
  endY: number, 
  wall: Wall
): boolean {
  // Line-line intersection algorithm
  const x1 = startX;
  const y1 = startY;
  const x2 = endX;
  const y2 = endY;
  const x3 = wall.x1;
  const y3 = wall.y1;
  const x4 = wall.x2;
  const y4 = wall.y2;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.001) return false; // Lines are parallel

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

// Check if movement path intersects with a door
function lineIntersectsDoor(
  startX: number, 
  startY: number, 
  endX: number, 
  endY: number, 
  door: Door
): boolean {
  // Check if line passes through door area
  const doorLeft = door.x;
  const doorTop = door.y;
  const doorRight = door.x + door.width;
  const doorBottom = door.y + door.height;

  // Simple bounding box intersection check
  const minX = Math.min(startX, endX);
  const maxX = Math.max(startX, endX);
  const minY = Math.min(startY, endY);
  const maxY = Math.max(startY, endY);

  return !(maxX < doorLeft || minX > doorRight || maxY < doorTop || minY > doorBottom);
}

export function canPlayerMoveTo(
  player: Player,
  newX: number,
  newY: number,
  elements: RoomElement[]
): { canMove: boolean; adjustedX: number; adjustedY: number } {
  const walls = elements.filter(el => el.type === 'wall') as Wall[];
  const doors = elements.filter(el => el.type === 'door') as Door[];

  // Check collision with walls
  for (const wall of walls) {
    if (lineIntersectsWall(player.x, player.y, newX, newY, wall)) {
      return { canMove: false, adjustedX: player.x, adjustedY: player.y };
    }
  }

  // Check collision with locked doors
  for (const door of doors) {
    if (lineIntersectsDoor(player.x, player.y, newX, newY, door)) {
      if (door.isLocked || !door.isOpen) {
        return { canMove: false, adjustedX: player.x, adjustedY: player.y };
      }
    }
  }

  return { canMove: true, adjustedX: newX, adjustedY: newY };
}
