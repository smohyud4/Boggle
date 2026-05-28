import {
  ArrowLeft,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ArrowUpRight,
  ArrowUpLeft,
  ArrowDownRight,
  ArrowDownLeft,
} from 'lucide-react';
import './Arrow.css';

const arrows = {
  left: <ArrowLeft className="arrow-icon" />,
  up: <ArrowUp className="arrow-icon" />,
  right: <ArrowRight className="arrow-icon" />,
  down: <ArrowDown className="arrow-icon" />,
  'top-right': <ArrowUpRight className="arrow-icon" />,
  'top-left': <ArrowUpLeft className="arrow-icon" />,
  'bottom-right': <ArrowDownRight className="arrow-icon" />,
  'bottom-left': <ArrowDownLeft className="arrow-icon" />,
};

export type ArrowDirection = keyof typeof arrows;

export type ArrowProps = {
  direction: ArrowDirection;
  top: string;
  left: string;
};

export default function Arrow({ direction, top, left }: ArrowProps) {
  return (
    <p className="arrow" style={{ position: 'absolute', top: top, left: left }}>
      {arrows[direction]}
    </p>
  );
}
