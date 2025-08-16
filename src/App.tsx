import { useEffect, useRef, useState } from "react";
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

  // 디스플레이 크기 변경
  const handleDisplaySizeChange = (width: number, height: number) => {
    setDisplay({ width, height });
  };

  // 타일 추가
  const addTile = () => {
    const newTile: Tile = {
      id: `tile-${tiles.length}`,
      xPx: 0,
      yPx: 0,
      widthPx: newTileWidth,
      heightPx: newTileHeight,
      isDragging: false,
    };
    setTiles([...tiles, newTile]);
  };

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent, tileId: string) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    setDraggedTile(tileId);
    setTiles(
      tiles.map((t) => (t.id === tileId ? { ...t, isDragging: true } : t))
    );
  };

  // 드래그 중
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedTile) return;

    const displayWrapper = displayWrapperRef.current;
    if (!displayWrapper) return;

    const wrapperRect = displayWrapper.getBoundingClientRect();
    const x = (e.clientX - wrapperRect.left - 20 - dragOffset.x) / scale; // 20은 padding
    const y = (e.clientY - wrapperRect.top - 20 - dragOffset.y) / scale;

    // 디스플레이 경계 내에서만 이동 가능하도록 제한
    const tile = tiles.find((t) => t.id === draggedTile);
    if (!tile) return;

    const constrainedX = Math.max(0, Math.min(display.width - tile.widthPx, x));
    const constrainedY = Math.max(
      0,
      Math.min(display.height - tile.heightPx, y)
    );

    setTiles(
      tiles.map((t) =>
        t.id === draggedTile
          ? { ...t, xPx: constrainedX, yPx: constrainedY }
          : t
      )
    );
  };

  // 드래그 끝
  const handleMouseUp = () => {
    if (draggedTile) {
      setTiles(
        tiles.map((t) =>
          t.id === draggedTile ? { ...t, isDragging: false } : t
        )
      );
      setDraggedTile(null);
    }
  };

  // 타일 삭제
  const removeTile = (tileId: string) => {
    setTiles(tiles.filter((t) => t.id !== tileId));
  };

  // 타일 크기 변경
  const updateTileSize = (tileId: string, width: number, height: number) => {
    setTiles(
      tiles.map((t) =>
        t.id === tileId
          ? {
              ...t,
              widthPx: width,
              heightPx: height,
              // 경계를 벗어나지 않도록 위치 조정
              xPx: Math.min(t.xPx, display.width - width),
              yPx: Math.min(t.yPx, display.height - height),
            }
          : t
      )
    );
  };

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
        <div id="displayWrapper" ref={displayWrapperRef}>
          <div
            id="display"
            style={{
              position: "relative",
              width: display.width * scale,
              height: display.height * scale,
            }}
          ></div>
        </div>
      </div>
    </>
  );
}

export default App;
