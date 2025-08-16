import { useEffect, useRef, useState } from "react";
import type { Tile, Display } from "./types";
import "./App.css";

function App() {
  // Display resolution
  const [display, setDisplay] = useState<Display>({
    width: 1920,
    height: 1080,
  });

  // Display Scale
  const [scale, setScale] = useState(1);

  // Tiles
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [draggedTile, setDraggedTile] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 새 타일 입력값
  const [newTileWidth, setNewTileWidth] = useState(200);
  const [newTileHeight, setNewTileHeight] = useState(200);

  // DisplayWrapper Reference
  const displayWrapperRef = useRef<HTMLDivElement>(null);

  const calcScale = () => {
    if (!displayWrapperRef.current) return;
    const wrapperWidth = displayWrapperRef.current.clientWidth - 40; // padding 고려
    const wrapperHeight = displayWrapperRef.current.clientHeight - 40;
    const scaleX = wrapperWidth / display.width;
    const scaleY = wrapperHeight / display.height;
    const scale = Math.min(scaleX, scaleY, 0.8); // 최대 80% 스케일
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

  // piwall 설정 파일 생성
  const generatePiwallConfig = () => {
    const config = [];

    // wall 섹션 추가
    config.push("# Flexible Video Wall Configuration");
    config.push(
      `# 소스 비디오(Wall) 해상도: ${display.width}x${display.height} (고정)`
    );
    config.push(`# 물리적 디스플레이: ${tiles.length}개 모니터`);
    config.push(
      `# [wall] 섹션: 보여주고자 하는 원본 영상의 크기를 ${display.width}x${display.height}으로 고정`
    );
    config.push("");
    config.push("[wall]");
    config.push(`width=${display.width}`);
    config.push(`height=${display.height}`);
    config.push("x=0");
    config.push("y=0");
    config.push("");

    // 각 타일에 대한 섹션 추가
    tiles.forEach((tile, index) => {
      const piNumber = String(index + 1).padStart(2, "0");
      config.push(`# --- ${tile.id} ---`);
      config.push(`[pi${piNumber}]`);
      config.push("wall=wall");
      config.push(`width=${tile.widthPx}`);
      config.push(`height=${tile.heightPx}`);
      config.push(`x=${Math.round(tile.xPx)}`);
      config.push(`y=${Math.round(tile.yPx)}`);
      config.push("");
    });

    return config.join("\n");
  };

  // 파일 다운로드
  const downloadPiwallConfig = () => {
    const configContent = generatePiwallConfig();
    const blob = new Blob([configContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "piwall.conf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">PI Wall Generator</h1>

      {/* 디스플레이 해상도 설정 */}
      <div className="section">
        <h3>디스플레이 해상도</h3>
        <div className="input-row">
          <input
            type="number"
            value={display.width}
            onChange={(e) =>
              handleDisplaySizeChange(Number(e.target.value), display.height)
            }
            placeholder="Width"
            className="input-number input-large"
          />
          <span>×</span>
          <input
            type="number"
            value={display.height}
            onChange={(e) =>
              handleDisplaySizeChange(display.width, Number(e.target.value))
            }
            placeholder="Height"
            className="input-number input-large"
          />
          <span className="info-text">
            현재: {display.width} × {display.height} (Scale:{" "}
            {(scale * 100).toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* 타일 추가 섹션 */}
      <div className="section">
        <h3>새 타일 추가</h3>
        <div className="input-row">
          <input
            type="number"
            value={newTileWidth}
            onChange={(e) => setNewTileWidth(Number(e.target.value))}
            placeholder="Width"
            className="input-number input-small"
          />
          <span>×</span>
          <input
            type="number"
            value={newTileHeight}
            onChange={(e) => setNewTileHeight(Number(e.target.value))}
            placeholder="Height"
            className="input-number input-small"
          />
          <button onClick={addTile} className="btn btn-primary">
            타일 추가
          </button>
        </div>
      </div>

      {/* 설정 다운로드 섹션 */}
      <div className="section">
        <h3>Piwall 설정 파일</h3>
        <div className="input-row">
          <button
            onClick={downloadPiwallConfig}
            className="btn btn-success"
            disabled={tiles.length === 0}
          >
            piwall.conf 다운로드
          </button>
          <span className="info-text">
            {tiles.length}개의 타일로 구성된 설정 파일
          </span>
        </div>
      </div>

      {/* 메인 디스플레이 영역 */}
      <div
        ref={displayWrapperRef}
        className={`display-wrapper ${draggedTile ? "dragging" : ""}`}
        style={{
          height: `${display.height * scale + 40}px`,
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 디스플레이 영역 */}
        <div
          id="display"
          className="display"
          style={{
            width: display.width * scale,
            height: display.height * scale,
          }}
        >
          {/* 디스플레이 정보 라벨 */}
          <div className="display-label">
            Display ({display.width} × {display.height})
          </div>
        </div>

        {/* 타일들 렌더링 */}
        {tiles.map((tile) => (
          <div
            key={tile.id}
            className={`tile ${tile.isDragging ? "tile-dragging" : ""}`}
            style={{
              left: tile.xPx * scale + 20,
              top: tile.yPx * scale + 20,
              width: tile.widthPx * scale,
              height: tile.heightPx * scale,
            }}
            onMouseDown={(e) => handleMouseDown(e, tile.id)}
          >
            <div className="tile-content">
              <div>{tile.id}</div>
              <div className="tile-position">
                ({Math.round(tile.xPx)}, {Math.round(tile.yPx)})
              </div>
              <div className="tile-size">
                {tile.widthPx}×{tile.heightPx}
              </div>
            </div>
            <button
              onClick={() => removeTile(tile.id)}
              className="tile-remove-btn"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 타일 목록 및 편집 */}
      <div className="tile-list-section">
        <h3>타일 목록</h3>
        {tiles.length === 0 ? (
          <p className="empty-message">
            타일이 없습니다. 위에서 타일을 추가해보세요.
          </p>
        ) : (
          tiles.map((tile) => (
            <div key={tile.id} className="tile-item">
              <div className="tile-info">
                <strong>{tile.id}</strong>
                <span>
                  Position: ({Math.round(tile.xPx)}, {Math.round(tile.yPx)})
                </span>
                <button
                  onClick={() => removeTile(tile.id)}
                  className="btn btn-danger btn-small"
                >
                  삭제
                </button>
              </div>
              <div className="tile-size-controls">
                <span>크기:</span>
                <input
                  type="number"
                  value={tile.widthPx}
                  onChange={(e) =>
                    updateTileSize(
                      tile.id,
                      Number(e.target.value),
                      tile.heightPx
                    )
                  }
                  className="input-number input-tiny"
                />
                <span>×</span>
                <input
                  type="number"
                  value={tile.heightPx}
                  onChange={(e) =>
                    updateTileSize(
                      tile.id,
                      tile.widthPx,
                      Number(e.target.value)
                    )
                  }
                  className="input-number input-tiny"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
