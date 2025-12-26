import React, { useState, useEffect } from 'react';

const Minimap = ({ nodes, links, transform, visible, labelType, library, settings }) => {
    const [size, setSize] = useState({ w: 240, h: 160 });
    const [isResizing, setIsResizing] = useState(false);

    const isPixelMode = settings?.pixelMode;

    useEffect(() => {
        if (!isResizing) return;
        const handleMouseMove = (e) => {
            const newW = Math.max(150, size.w - e.movementX); 
            const newH = Math.max(100, size.h + e.movementY); 
            setSize({ w: newW, h: newH });
        };
        const handleMouseUp = () => setIsResizing(false);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, size]);

    if (!visible) return null;

    const viewportW = window.innerWidth / transform.k;
    const viewportH = window.innerHeight / transform.k;
    const viewX = -transform.x / transform.k;
    const viewY = -transform.y / transform.k;
    let minX = viewX, maxX = viewX + viewportW;
    let minY = viewY, maxY = viewY + viewportH;
    nodes.forEach(n => { if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x; if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y; });
    const padding = 100; minX -= padding; maxX += padding; minY -= padding; maxY += padding;
    const worldW = maxX - minX; const worldH = maxY - minY;
    const scaleX = size.w / worldW; const scaleY = size.h / worldH; const scale = Math.min(scaleX, scaleY);
    const offsetX = (size.w - worldW * scale) / 2; const offsetY = (size.h - worldH * scale) / 2;
    const mapX = (x) => (x - minX) * scale + offsetX; const mapY = (y) => (y - minY) * scale + offsetY;
    const handleMouseDown = (e) => { e.stopPropagation(); setIsResizing(true); };

    return (
        <div className="minimap-container shadow-lg bg-[var(--panel-bg)] border border-[var(--border)]" style={{ width: size.w, height: size.h }}>
            <svg width="100%" height="100%" className="bg-[var(--bg)]">
                {links.map((l, i) => {
                    const s = typeof l.source === 'object' ? l.source : nodes.find(n => n.id === l.source);
                    const t = typeof l.target === 'object' ? l.target : nodes.find(n => n.id === l.target);
                    if(!s || !t) return null;
                    return <line key={i} x1={mapX(s.x)} y1={mapY(s.y)} x2={mapX(t.x)} y2={mapY(t.y)} stroke="var(--text)" strokeOpacity="0.2" strokeWidth="1" />;
                })}
                {nodes.map(n => (
                    <g key={n.id}>
                        {isPixelMode ? (
                            <rect 
                                x={mapX(n.x) - 3} 
                                y={mapY(n.y) - 3} 
                                width={6} 
                                height={6} 
                                fill={n.color || '#94a3b8'} 
                                stroke="var(--text)" 
                                strokeOpacity="0.5" 
                                strokeWidth="1" 
                                shapeRendering="crispEdges"
                            />
                        ) : (
                            <circle cx={mapX(n.x)} cy={mapY(n.y)} r={3} fill={n.color || '#94a3b8'} stroke="var(--text)" strokeOpacity="0.5" strokeWidth="0.5" />
                        )}
                        {labelType && labelType !== 'none' && (
                            <text 
                                x={mapX(n.x)} y={mapY(n.y) - 5} 
                                textAnchor="middle" 
                                fill="var(--text)" 
                                fontSize="8px" 
                                opacity="0.7"
                            >
                                {labelType === 'id' ? n.contentId : (library[n.contentId]?.title || n.contentId)}
                            </text>
                        )}
                    </g>
                ))}
                <rect 
                    x={mapX(viewX)} 
                    y={mapY(viewY)} 
                    width={viewportW * scale} 
                    height={viewportH * scale} 
                    className="minimap-viewport" 
                    style={{ 
                        stroke: 'var(--text)', 
                        strokeOpacity: 0.5, 
                        fill: 'none',
                        shapeRendering: isPixelMode ? 'crispEdges' : 'auto',
                        strokeWidth: isPixelMode ? 2 : 1
                    }} 
                />
            </svg>
            <div className="minimap-resize-handle" onMouseDown={handleMouseDown} title="Drag to resize" />
        </div>
    );
};

export default Minimap;
