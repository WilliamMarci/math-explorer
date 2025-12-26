import React from 'react';
import MathNode from './MathNode';
import { RichViewer } from './Common';

const Canvas = ({ 
    svgRef, 
    transform, 
    links, 
    nodes, 
    library, 
    onToggle, 
    onHover, 
    onDragStart, 
    onEdit, 
    onPin, 
    onContextMenu, 
    lang, 
    I18N,
    settings,
    editingNodeId,
    focusedNodeId,
    nodeOrder,
    selectedNodeIds = [],
    onSelectionChange,
    isSpacePressed,
    viewMode
}) => {
    // Selection State
    const [selectionBox, setSelectionBox] = React.useState(null);

    // Helper to find connection label
    const getLinkData = (source, target) => {
        if (!source || !target || !library[source.contentId]) return null;
        const segments = library[source.contentId].segments || {};
        // Find segment that links to target
        return Object.values(segments).find(seg => seg.type === 'link' && seg.target === target.contentId);
    };

    const sortedNodes = React.useMemo(() => {
        if (!nodeOrder || nodeOrder.length === 0) return nodes;
        return [...nodes].sort((a, b) => {
            const idxA = nodeOrder.indexOf(a.contentId);
            const idxB = nodeOrder.indexOf(b.contentId);
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
        });
    }, [nodes, nodeOrder]);

    // Selection Handlers
    const handleMouseDown = (e) => {
        // Only Left Click (0)
        if (e.button !== 0) return;
        
        // If Space is pressed OR viewMode is enabled, let D3 handle it (it's a drag)
        if ((isSpacePressed && isSpacePressed.current) || viewMode) return;

        // Start Selection
        const rect = svgRef.current.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        
        setSelectionBox({ startX, startY, currentX: startX, currentY: startY });
    };

    const handleMouseMove = (e) => {
        if (!selectionBox) return;
        
        const rect = svgRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        setSelectionBox(prev => ({ ...prev, currentX, currentY }));
    };

    const handleMouseUp = (e) => {
        if (!selectionBox) return;
        
        // Calculate selection
        const x1 = Math.min(selectionBox.startX, selectionBox.currentX);
        const y1 = Math.min(selectionBox.startY, selectionBox.currentY);
        const x2 = Math.max(selectionBox.startX, selectionBox.currentX);
        const y2 = Math.max(selectionBox.startY, selectionBox.currentY);
        
        // Filter nodes
        const selected = nodes.filter(node => {
            // Node position in screen coords
            const nx = node.x * transform.k + transform.x;
            const ny = node.y * transform.k + transform.y;
            // Check if center is inside
            return nx >= x1 && nx <= x2 && ny >= y1 && ny <= y2;
        }).map(n => n.id);
        
        if (onSelectionChange) {
            onSelectionChange(selected);
        }
        
        setSelectionBox(null);
    };

    // Attach global mouse up/move if selection started?
    // Better to attach to window to handle drag outside canvas
    React.useEffect(() => {
        if (selectionBox) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [selectionBox, nodes, transform]); // Dependencies for calculation

    return (
        <div 
            ref={svgRef} 
            className="w-full h-full cursor-move relative overflow-hidden"
            onMouseDown={handleMouseDown}
        >
            <div className="scene-layer" style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})` }}>
                <svg className="link-layer">
                    {links.map((l, i) => { 
                        const s = typeof l.source === 'object' ? l.source : nodes.find(n => n.id === l.source); 
                        const t = typeof l.target === 'object' ? l.target : nodes.find(n => n.id === l.target); 
                        if(!s || !t) return null; 
                        
                        const seg = getLinkData(s, t);
                        const dashArray = seg?.connectionDash === 'dashed' ? '4,4' : seg?.connectionDash === 'dotted' ? '1,3' : undefined;
                        const lineCap = seg?.connectionDash === 'dotted' ? 'round' : undefined;
                        
                        return (
                            <g key={i} className="text-[var(--border)]">
                                <line 
                                    x1={s.x} y1={s.y} x2={t.x} y2={t.y} 
                                    className="link-line" 
                                    strokeDasharray={dashArray}
                                    strokeLinecap={lineCap}
                                    stroke={seg?.color || "currentColor"}
                                />
                                {seg?.connectionMarker === 'arrow' && (
                                    <path 
                                        d="M -6 -4 L 4 0 L -6 4 Z" 
                                        fill={seg?.color || "currentColor"} 
                                        transform={`translate(${(s.x + t.x) / 2}, ${(s.y + t.y) / 2}) rotate(${Math.atan2(t.y - s.y, t.x - s.x) * 180 / Math.PI})`} 
                                    />
                                )}
                            </g>
                        ); 
                    })}
                </svg>

                {/* Edge Labels Layer */}
                {settings?.showEdgeLabels && links.map((l, i) => {
                    const s = typeof l.source === 'object' ? l.source : nodes.find(n => n.id === l.source); 
                    const t = typeof l.target === 'object' ? l.target : nodes.find(n => n.id === l.target); 
                    if(!s || !t) return null;

                    const seg = getLinkData(s, t);
                    if (!seg || !seg.connectionLabel) return null;

                    let midX = (s.x + t.x) / 2;
                    let midY = (s.y + t.y) / 2;

                    // Apply offset if mode is 'side'
                    if (settings?.edgeLabelMode === 'side') {
                        // Calculate perpendicular vector
                        const dx = t.x - s.x;
                        const dy = t.y - s.y;
                        const len = Math.sqrt(dx*dx + dy*dy) || 1;
                        // Perpendicular: (-dy, dx)
                        const perpX = -dy / len;
                        const perpY = dx / len;
                        const offset = 15; // px
                        midX += perpX * offset;
                        midY += perpY * offset;
                    }

                    const bgClass = settings?.edgeLabelBg === 'none' 
                        ? '' 
                        : 'bg-[var(--card-bg)] border border-[var(--border)] shadow-sm';

                    return (
                        <div 
                            key={`label-${i}`}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded z-0 pointer-events-none ${bgClass}`}
                            style={{ left: midX, top: midY }}
                        >
                            <RichViewer content={seg.connectionLabel} inline={true} className="text-xs text-[var(--muted)]" />
                        </div>
                    );
                })}

                {/* Render nodes */}
                {sortedNodes.map(node => {
                    if (node.id === editingNodeId) return null; // Skip editing node, render last
                    if (node.id === focusedNodeId && !editingNodeId) return null; // Skip focused node if not editing, render last
                    return (
                        <MathNode 
                            key={node.id} 
                            node={node} 
                            content={library[node.contentId]} 
                            onToggle={onToggle} 
                            onHover={onHover}
                            onDragStart={onDragStart}
                            onEdit={onEdit}
                            onPin={onPin}
                            onContextMenu={onContextMenu}
                            lang={lang}
                            I18N={I18N}
                            isSelected={selectedNodeIds.includes(node.id)}
                            viewMode={viewMode}
                        />
                    );
                })}
                
                {/* Render focused node last (on top) if not editing */}
                {focusedNodeId && !editingNodeId && (() => {
                    const node = nodes.find(n => n.id === focusedNodeId);
                    if (!node) return null;
                    return (
                        <MathNode 
                            key={node.id} 
                            node={node} 
                            content={library[node.contentId]} 
                            onToggle={onToggle} 
                            onHover={onHover}
                            onDragStart={onDragStart}
                            onEdit={onEdit}
                            onPin={onPin}
                            onContextMenu={onContextMenu}
                            lang={lang}
                            I18N={I18N}
                            isSelected={selectedNodeIds.includes(node.id)}
                            viewMode={viewMode}
                        />
                    );
                })()}

                {/* Render editing node last (on top) - takes precedence */}
                {editingNodeId && (() => {
                    const node = nodes.find(n => n.id === editingNodeId);
                    if (!node) return null;
                    return (
                        <MathNode 
                            key={node.id} 
                            node={node} 
                            content={library[node.contentId]} 
                            onToggle={onToggle} 
                            onHover={onHover}
                            onDragStart={onDragStart}
                            onEdit={onEdit}
                            onPin={onPin}
                            onContextMenu={onContextMenu}
                            lang={lang}
                            I18N={I18N}
                            isSelected={selectedNodeIds.includes(node.id)}
                            viewMode={viewMode}
                        />
                    );
                })()}
            </div>

            {/* Selection Box */}
            {selectionBox && (
                <div 
                    className="absolute border border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none z-50"
                    style={{
                        left: Math.min(selectionBox.startX, selectionBox.currentX),
                        top: Math.min(selectionBox.startY, selectionBox.currentY),
                        width: Math.abs(selectionBox.currentX - selectionBox.startX),
                        height: Math.abs(selectionBox.currentY - selectionBox.startY)
                    }}
                />
            )}
        </div>
    );
};

export default Canvas;
