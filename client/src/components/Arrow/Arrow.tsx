import type { JSX } from "react";
import "./Arrow.css";

export type ArrowProps = {
  direction: JSX.Element;
  top: string;
  left: string;
};

export default function Arrow({ direction, top, left }: ArrowProps) {
  return (
    <p className="arrow" style={{ position: "absolute", top: top, left: left }}>
      {direction}
    </p>
  );
}
