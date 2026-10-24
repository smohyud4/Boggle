import './Loader.css';

interface LoaderProps {
  boardDimension?: number;
  helperText?: string;
}

function Loader({ boardDimension = 4, helperText }: LoaderProps) {
  return (
    <section className="starting-shell">
      <div className={`loader-container loader-container-${boardDimension}`}>
        {Array.from({ length: boardDimension * boardDimension }).map((_, index) => (
          <span key={index} className="loader" />
        ))}
      </div>
      {helperText && <h2>{helperText}</h2>}
    </section>
  );
}

export default Loader;
