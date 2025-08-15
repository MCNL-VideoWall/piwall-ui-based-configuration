import { useState } from "react";
import type { Tile, Display } from "./types";
import "./App.css";

function App() {
  // Display resolution
  const [display, setDisplay] = useState<Display>({
    width: 1920,
    height: 1080,
  });

  //Display Scale
  const [scale, setScale] = useState(1);

  // Tiles
  const [tiles, setTiles] = useState<Tile[]>([]);
  const tileCount = tiles.length;

  // DisplayWrapper Reference
  const displayWrapperRef = useRef<HTMLDivElement>(null);

  const calcScale = () => {
    if (!displayWrapperRef.current) return;
    const wrapperWidth = displayWrapperRef.current.clientWidth;
    const scale = wrapperWidth / display.width;

    setScale(scale);
  };

  // display 변경시 상대 scale 계산해서 변경
  useEffect(() => {
    calcScale();

    window.addEventListener("resize", calcScale);

    return () => window.removeEventListener("resize", calcScale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display]);

  return (
    <>
      <div id="container">
        <h1>PI Wall Generator</h1>
        {/* DISPLAY RESOLUTION INPUTS */}
        <div id="display-resolution">
          <input type="number" />
          x
          <input type="number" />
        </div>

        {/* DISPLAY */}
        <div id="display"></div>
      </div>
    </>
  );
}

export default App;
