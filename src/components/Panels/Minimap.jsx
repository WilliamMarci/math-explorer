import React, { useState, useEffect } from 'react';

const Minimap = ({ nodes, links, transform, visible, labelType, library, settings, isModified, isSaving, onSave, t }) => {
    const [size, setSize] = useState({ w: 240, h: 160 });
    const [isResizing, setIsResizing] = useState(false);
    const [showModifiedPopup, setShowModifiedPopup] = useState(false);

    const isPixelMode = settings?.pixelMode;

    useEffect(() => {
        if (!isResizing) return;
        const handleMouseMove = (e) => {
            const newW = Math.max(150, size.w - e.movementX); 
            const newH = Math.max(100, size.h - e.movementY); 
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
        <div className="minimap-container shadow-lg bg-[var(--panel-bg)] border border-[var(--border)] flex flex-col relative" style={{ width: size.w, height: size.h + 24 }}>
            {/* Popup */}
            {showModifiedPopup && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-[var(--panel-bg)] border border-[var(--border)] shadow-lg rounded p-2 z-50">
                    <div className="text-xs mb-2">{t?.unsavedChanges || "Unsaved changes"}</div>
                    <div className="flex gap-2">
                        <button className="btn text-xs flex-1" onClick={() => setShowModifiedPopup(false)}>{t?.close || "Close"}</button>
                        <button className="btn text-xs flex-1 bg-[var(--accent)] text-white" onClick={() => { onSave && onSave(); setShowModifiedPopup(false); }}>{t?.save || "Save"}</button>
                    </div>
                </div>
            )}

            <div style={{ width: '100%', height: size.h, position: 'relative' }}>
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

            {/* Status Bar */}
            <div className="h-6 border-t border-[var(--border)] bg-[var(--panel-bg)] flex items-center px-2 text-[10px] text-[var(--muted)] justify-between shrink-0">
                <div className="flex items-center gap-2">
                    {isModified && (
                        <div 
                            className="flex items-center gap-1 cursor-pointer group"
                            onClick={() => setShowModifiedPopup(!showModifiedPopup)}
                        >
                            <div className="w-2 h-2 border border-red-500 bg-red-500/20 group-hover:bg-red-500 transition-colors"></div>
                            <span className="text-[var(--text)] opacity-70 group-hover:opacity-100">{t?.modified || "Modified"}</span>
                        </div>
                    )}
                    {isSaving && (
                        <span className="text-[var(--accent)] opacity-70 animate-pulse">{t?.saving || "Saving..."}</span>
                    )}
                </div>
                <div>
                    {/* Future notifications */}
                </div>
            </div>
        </div>
    );
};

export default Minimap;
