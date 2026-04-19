export type ArrowProps = {
  direction: string;
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
