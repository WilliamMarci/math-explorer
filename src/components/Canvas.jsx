import React, { useRef } from 'react';
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
    viewMode,
    selectionBox,
    onCanvasMouseDown,
    icons,
    hoveredNodeId,
    onNodeHover,
    onFocusNode
}) => {
    const sceneRef = useRef(null);

    // Helper to calculate relative position without depending on scene transform (fixes lag)
    const getRelativeMetrics = (nodeId, segKey) => {
        const segElem = document.getElementById(`seg-${nodeId}-${segKey}`);
        const cardElem = document.getElementById(`math-card-${nodeId}`);
        const nodeElem = document.getElementById(`node-${nodeId}`);
        
        if (!segElem || !cardElem || !nodeElem) return null;

        let x = 0;
        let y = 0;
        let el = segElem;
        
        // Traverse up to math-card
        while (el && el !== cardElem) {
            x += el.offsetLeft;
            y += el.offsetTop;
            
            // Add border of offsetParent, UNLESS offsetParent is the cardElem itself
            // (because we want position relative to cardElem's padding box)
            if (el.offsetParent && el.offsetParent !== cardElem) {
                x += el.offsetParent.clientLeft;
                y += el.offsetParent.clientTop;
            }
            
            el = el.offsetParent;
        }

        return {
            x,
            y,
            width: segElem.offsetWidth,
            height: segElem.offsetHeight,
            parentWidth: nodeElem.offsetWidth,
            parentHeight: nodeElem.offsetHeight,
            // We also need card offset relative to node wrapper for link calculation
            cardX: cardElem.offsetLeft,
            cardY: cardElem.offsetTop,
            cardClientLeft: cardElem.clientLeft,
            cardClientTop: cardElem.clientTop
        };
    };

    // Helper to find connection label
    const getLinkData = (source, target) => {
        if (!source || !target || !library[source.contentId]) return null;
        const segments = library[source.contentId].segments || {};
        // Find segment that links to target
        const entry = Object.entries(segments).find(([key, seg]) => seg.type === 'link' && seg.target === target.contentId);
        return entry ? { ...entry[1], key: entry[0] } : null;
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

    // Calculate highlights map
    const nodeHighlights = React.useMemo(() => {
        const map = {};
        if (!settings?.minimalMode || settings?.segmentHighlights === false) return map;

        links.forEach(l => {
            const s = typeof l.source === 'object' ? l.source : nodes.find(n => n.id === l.source); 
            const t = typeof l.target === 'object' ? l.target : nodes.find(n => n.id === l.target); 
            if(!s || !t) return;

            const seg = getLinkData(s, t);
            if (seg && seg.key) {
                const metrics = getRelativeMetrics(s.id, seg.key);
                if (metrics) {
                    if (!map[s.id]) map[s.id] = [];
                    map[s.id].push({
                        x: metrics.x,
                        y: metrics.y,
                        width: metrics.width,
                        height: metrics.height,
                        color: seg.color
                    });
                }
            }
        });
        return map;
    }, [links, nodes, settings?.minimalMode, settings?.segmentHighlights, library]); // Re-calc on render

    return (
        <div 
            ref={svgRef} 
            className="w-full h-full cursor-move relative overflow-hidden"
            onMouseDown={onCanvasMouseDown}
        >
            <div ref={sceneRef} className="scene-layer" style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})` }}>
                <svg className="link-layer" style={{ zIndex: (settings?.minimalMode) ? 20 : 0 }}>
                    {links.map((l, i) => { 
                        const s = typeof l.source === 'object' ? l.source : nodes.find(n => n.id === l.source); 
                        const t = typeof l.target === 'object' ? l.target : nodes.find(n => n.id === l.target); 
                        if(!s || !t) return null; 
                        
                        const seg = getLinkData(s, t);
                        
                        let x1 = s.x;
                        let y1 = s.y;

                        if (seg && seg.key) {
                            // Use relative metrics for sync (no lag)
                            const metrics = getRelativeMetrics(s.id, seg.key);
                            
                            if (metrics) {
                                // Calculate absolute position based on current node position (s.x, s.y)
                                // Node is centered, so top-left is s.x - parentWidth/2
                                // We need to add card offset (if any) + segment offset
                                const nodeLeft = s.x - metrics.parentWidth / 2;
                                const nodeTop = s.y - metrics.parentHeight / 2;
                                
                                // Default center of segment (relative to node wrapper)
                                // metrics.x/y are relative to card padding box. card is inside wrapper.
                                // We need to add card offset + card border to get to wrapper coordinate space
                                const segX = metrics.x + (metrics.cardX || 0) + (metrics.cardClientLeft || 0);
                                const segY = metrics.y + (metrics.cardY || 0) + (metrics.cardClientTop || 0);

                                let lx = nodeLeft + segX + metrics.width / 2;
                                let ly = nodeTop + segY + metrics.height / 2;

                                // Minimal mode: use corner
                                if (settings?.minimalMode) {
                                    // Determine corner based on target direction
                                    const isRight = t.x > s.x;
                                    const isBottom = t.y > s.y;
                                    
                                    lx = nodeLeft + segX + (isRight ? metrics.width : 0);
                                    ly = nodeTop + segY + (isBottom ? metrics.height : 0);
                                }
                                
                                x1 = lx;
                                y1 = ly;
                            } else {
                                // Fallback to old method if metrics fail (e.g. first render)
                                const elem = document.getElementById(`seg-${s.id}-${seg.key}`);
                                const scene = sceneRef.current;
                                if (elem && scene) {
                                    const r = elem.getBoundingClientRect();
                                    const sr = scene.getBoundingClientRect();
                                    
                                    let lx = (r.left + r.width/2 - sr.left) / transform.k;
                                    let ly = (r.top + r.height/2 - sr.top) / transform.k;

                                    if (settings?.minimalMode) {
                                        const isRight = t.x > s.x;
                                        const isBottom = t.y > s.y;
                                        lx = (isRight ? r.right : r.left) - sr.left;
                                        ly = (isBottom ? r.bottom : r.top) - sr.top;
                                        lx /= transform.k;
                                        ly /= transform.k;
                                    }
                                    x1 = lx;
                                    y1 = ly;
                                }
                            }
                        }

                        let x2 = t.x;
                        let y2 = t.y;
                        
                        const targetElem = document.getElementById(`node-${t.id}`);
                        if (targetElem) {
                            const rect = targetElem.getBoundingClientRect();
                            const w = rect.width / transform.k;
                            const h = rect.height / transform.k;
                            
                            const dx = x1 - t.x;
                            const dy = y1 - t.y;
                            
                            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                                const scale = Math.min(
                                    (w / 2) / Math.abs(dx), 
                                    (h / 2) / Math.abs(dy)
                                );
                                // Ensure we don't overshoot if source is inside (unlikely but safe)
                                const actualScale = Math.min(scale, 1.0); 
                                x2 = t.x + dx * actualScale;
                                y2 = t.y + dy * actualScale;
                            }
                        }

                        const isMinimal = settings?.minimalMode;
                        const dashArray = isMinimal ? undefined : (seg?.connectionDash === 'dashed' ? '4,4' : seg?.connectionDash === 'dotted' ? '1,3' : undefined);
                        const lineCap = seg?.connectionDash === 'dotted' ? 'round' : undefined;
                        
                        // Opacity logic: 50% if minimal mode and connected node is hovered
                        const isHovered = hoveredNodeId && (s.id === hoveredNodeId || t.id === hoveredNodeId);
                        const opacity = (isMinimal && isHovered) ? 0.5 : 1;
                        const strokeWidth = (isMinimal && isHovered) ? 2 : (isMinimal ? 1 : 2);

                        return (
                            <g key={i} className="text-[var(--border)]" style={{ opacity }}>
                                {isMinimal && seg?.key && (
                                    <circle 
                                        cx={x1} 
                                        cy={y1} 
                                        r={2} 
                                        fill={seg?.color || "currentColor"} 
                                    />
                                )}
                                <line 
                                    x1={x1} y1={y1} x2={x2} y2={y2} 
                                    className="link-line" 
                                    strokeDasharray={dashArray}
                                    strokeLinecap={lineCap}
                                    style={{ stroke: seg?.color || "currentColor" }}
                                    strokeWidth={strokeWidth}
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
                            settings={settings}
                            icons={icons}
                            onNodeHover={onNodeHover}
                            highlights={nodeHighlights[node.id]}
                            onFocusNode={onFocusNode}
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
                            settings={settings}
                            icons={icons}
                            onNodeHover={onNodeHover}
                            highlights={nodeHighlights[node.id]}
                            onFocusNode={onFocusNode}
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
                            settings={settings}
                            icons={icons}
                            onNodeHover={onNodeHover}
                            highlights={nodeHighlights[node.id]}
                            onFocusNode={onFocusNode}
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
