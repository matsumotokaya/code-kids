/**
 * Type declarations for Oekaki Robo and Math Playground
 */

// Playground 1: Robo Grid Types
export type CommandType = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'DOUBLE' | 'TRIPLE';

export interface CommandBlock {
  id: string;
  type: CommandType;
}

export interface GridCell {
  x: number; // 0 to 6
  y: number; // 0 to 6
  type: 'empty' | 'star' | 'obstacle' | 'start' | 'puddle' | 'gem';
  label?: string;
}

export interface RoboLevel {
  id: number;
  title: string;
  hint: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  gridSize: number; // e.g., 5 for 5x5
  cells: GridCell[];
  maxCommands: number;
  availableCommands: CommandType[];
}

// Playground 3: Math Jump Types
export interface JumpLevel {
  id: number;
  startValue: number;
  targetValue: number;
  maxMoves: number;
  allowedActions: {
    label: string;
    operation: 'add' | 'sub' | 'mul' | 'div';
    value: number;
  }[];
  hint: string;
}
