import React, { useState, useMemo, useEffect, useRef } from 'react';
import { THEME_PRESETS } from '../theme';

// --- Minimap Component ---
const Minimap = ({ nodes, links, transform, visible, labelType, library }) => {
    const [size, setSize] = useState({ w: 240, h: 160 });
    const [isResizing, setIsResizing] = useState(false);

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
                        <circle cx={mapX(n.x)} cy={mapY(n.y)} r={3} fill={n.color || '#94a3b8'} />
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
                <rect x={mapX(viewX)} y={mapY(viewY)} width={viewportW * scale} height={viewportH * scale} className="minimap-viewport" style={{ stroke: 'var(--text)', strokeOpacity: 0.5, fill: 'none' }} />
            </svg>
            <div className="minimap-resize-handle" onMouseDown={handleMouseDown} title="Drag to resize" />
        </div>
    );
};

// --- Context Menu ---
const ContextMenu = ({ x, y, item, onClose, onAction, hoverClass }) => {
    const menuRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Smart positioning
    const style = { position: 'fixed', zIndex: 9999 };
    if (typeof window !== 'undefined') {
        const estimatedWidth = 200;
        const estimatedHeight = 250;
        
        if (x + estimatedWidth > window.innerWidth) {
            style.left = 'auto';
            style.right = window.innerWidth - x;
        } else {
            style.left = x;
            style.right = 'auto';
        }

        if (y + estimatedHeight > window.innerHeight) {
            style.top = 'auto';
            style.bottom = window.innerHeight - y;
        } else {
            style.top = y;
            style.bottom = 'auto';
        }
    } else {
        style.top = y;
        style.left = x;
    }

    // if (!item) return null; // REMOVED: Allow menu without item (for panel context)
    return (
        <div ref={menuRef} className="context-menu shadow-xl bg-[var(--panel-bg)] text-[var(--text)] border border-[var(--border)]" style={style} onClick={(e) => e.stopPropagation()}>
            {item ? (
                item.activeNode ? (
                <>
                    {['focus', 'edit', 'pin', 'hide'].map(act => (
                        <div key={act} className={`context-menu-item ${hoverClass}`} onClick={() => { onAction(act, item.activeNode); onClose(); }}>
                            <i className={`ri-${act === 'focus' ? 'focus-3' : act === 'edit' ? 'edit' : act === 'pin' ? (item.isPinned ? 'unpin' : 'pushpin') : 'eye-off'}-line`}></i> 
                            {act === 'pin' ? (item.isPinned ? "Unpin" : "Pin") : act.charAt(0).toUpperCase() + act.slice(1)} {act !== 'focus' && "Node"}
                        </div>
                    ))}
                    <div className="my-1 border-t border-[var(--border)]"></div>
                    <div className="context-menu-item danger hover:bg-red-500/10 hover:text-red-500" onClick={() => { onAction('delete', item.activeNode); onClose(); }}><i className="ri-delete-bin-line"></i> Delete</div>
                </>
            ) : (
                <div className={`context-menu-item ${hoverClass}`} onClick={() => { onAction('show', item.cId); onClose(); }}><i className="ri-eye-line"></i> Show Node</div>
            )
            ) : (
                <div className={`context-menu-item ${hoverClass}`} onClick={() => { onAction('auto_arrange'); onClose(); }}><i className="ri-layout-grid-line"></i> Auto Arrange</div>
            )}
        </div>
    );
};

// --- Git Graph Sidebar Component ---
const GraphSidebar = ({ items, links, nodes, rowHeight = 32 }) => {
    const nodeIndexMap = useMemo(() => { const map = new Map(); items.forEach((item, index) => map.set(item.cId, index)); return map; }, [items]);
    const activeNodeMap = useMemo(() => { const map = new Map(); nodes.forEach(n => map.set(n.contentId, n)); return map; }, [nodes]);

    const paths = useMemo(() => {
        const result = [];
        if (!links) return result;
        links.forEach(link => {
            const srcIdx = nodeIndexMap.get(link.source);
            const tgtIdx = nodeIndexMap.get(link.target);
            if (srcIdx !== undefined && tgtIdx !== undefined && srcIdx !== tgtIdx) {
                const y1 = srcIdx * rowHeight + rowHeight / 2;
                const y2 = tgtIdx * rowHeight + rowHeight / 2;
                const xAnchor = 20; const dist = Math.abs(srcIdx - tgtIdx);
                const controlX = xAnchor - Math.min(24, 10 + dist * 2);
                const d = `M ${xAnchor} ${y1} C ${controlX} ${y1}, ${controlX} ${y2}, ${xAnchor} ${y2}`;
                const targetNode = activeNodeMap.get(link.target);
                result.push({ d, color: targetNode ? (targetNode.color || '#cbd5e1') : '#cbd5e1', key: `${link.source}-${link.target}` });
            }
        });
        return result;
    }, [links, nodeIndexMap, activeNodeMap, rowHeight]);

    const height = Math.max(items.length * rowHeight, 100);

    return (
        <svg width="40" height={height} className="absolute top-0 left-0 pointer-events-none z-0" style={{ overflow: 'visible' }}>
            {paths.map(p => <path key={p.key} d={p.d} fill="none" stroke={p.color} strokeWidth="1.5" strokeOpacity="0.6" strokeLinecap="round" />)}
            {items.map((item, idx) => (
                <circle key={item.cId} cx="20" cy={idx * rowHeight + rowHeight / 2} r={item.activeNode ? 4 : 2.5} fill={item.activeNode ? (item.activeNode.color || '#94a3b8') : '#cbd5e1'} stroke="var(--panel-bg)" strokeWidth="1.5" />
            ))}
        </svg>
    );
};

const UIOverlay = ({ nodes, library, transform, settings, setSettings, onAddNode, onExport, onImport, onTogglePin, onEditNode, onDeleteNode, onToggleVisibility, onFocusNode, onAutoArrange, I18N, nodeOrder, setNodeOrder }) => {
    const [navOpen, setNavOpen] = useState(false);
    const [ctrlOpen, setCtrlOpen] = useState(false);
    const [physicsOpen, setPhysicsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [contextMenu, setContextMenu] = useState(null); 
    const [showNewNodeMenu, setShowNewNodeMenu] = useState(false);
    const newNodeMenuRef = useRef(null);
    const t = I18N[settings.lang];

    const isDarkTheme = ['blackboard', 'blueprint'].includes(settings.theme);
    const hoverClass = isDarkTheme ? 'hover:bg-white/10' : 'hover:bg-black/5';

    useEffect(() => {
        const currentIds = Object.keys(library);
        setNodeOrder(prev => {
            const next = prev.filter(id => library[id]);
            currentIds.forEach(id => { if (!next.includes(id)) next.push(id); });
            return next;
        });
    }, [library, setNodeOrder]);

    const virtualLinks = useMemo(() => {
        const links = [];
        Object.entries(library).forEach(([sourceId, content]) => {
            Object.values(content.segments || {}).forEach(seg => {
                if (seg.type === 'link' && seg.target && library[seg.target]) links.push({ source: sourceId, target: seg.target });
            });
        });
        return links;
    }, [library]);

    const explorerItems = useMemo(() => {
        const allContent = nodeOrder.map(cId => {
            const content = library[cId];
            if (!content) return null;
            const activeNode = nodes.find(n => n.contentId === cId);
            return { cId, content, activeNode, isPinned: activeNode ? (activeNode.fx !== null && activeNode.fx !== undefined) : false };
        }).filter(Boolean);
        if (!searchTerm) return allContent.reverse();
        return allContent.filter(item => item.content.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.cId.toLowerCase().includes(searchTerm.toLowerCase())).reverse();
    }, [library, nodes, searchTerm, nodeOrder]);

    const dragItem = useRef(null);
    const dragOverItem = useRef(null);
    const handleDragStart = (e, index) => { 
        // Convert visual index (reversed) to real index in nodeOrder
        const realIndex = nodeOrder.length - 1 - index;
        dragItem.current = realIndex; 
        e.dataTransfer.effectAllowed = "move"; 
    };
    const handleDragEnter = (e, index) => { 
        const realIndex = nodeOrder.length - 1 - index;
        dragOverItem.current = realIndex; 
    };
    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const copy = [...nodeOrder];
            const itemContent = copy[dragItem.current];
            copy.splice(dragItem.current, 1);
            copy.splice(dragOverItem.current, 0, itemContent);
            setNodeOrder(copy);
        }
        dragItem.current = null; dragOverItem.current = null;
    };

    useEffect(() => {
        const handleClickOutside = (e) => { if (newNodeMenuRef.current && !newNodeMenuRef.current.contains(e.target)) setShowNewNodeMenu(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleContextMenu = (e, item) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, item }); };
    const handlePanelContextMenu = (e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, item: null }); };
    const handleMenuAction = (action, target) => {
        if (action === 'focus') onFocusNode(target);
        if (action === 'edit') onEditNode(target.id);
        if (action === 'pin') onTogglePin(target);
        if (action === 'delete') onDeleteNode(target.id);
        if (action === 'hide') onToggleVisibility(target.contentId);
        if (action === 'show') onToggleVisibility(target);
        if (action === 'auto_arrange') onAutoArrange && onAutoArrange(); 
    };
    const handleAddWithType = (type) => { onAddNode(type); setShowNewNodeMenu(false); };

    return (
        <>
            {contextMenu && <ContextMenu {...contextMenu} onClose={() => setContextMenu(null)} onAction={handleMenuAction} hoverClass={hoverClass} />}
            <Minimap nodes={nodes} links={settings.linksRef || []} transform={transform} visible={settings.showMinimap} labelType={settings.minimapLabelType} library={library} />

            {/* Nav Panel (Explorer) */}
            <div className={`ui-panel nav-panel ${navOpen ? 'w-64 h-[80vh] open' : 'w-10 h-10'} bg-[var(--panel-bg)] border-r border-[var(--border)] text-[var(--text)]`}>
                <div className="ui-header border-b border-[var(--border)] bg-[var(--panel-bg)]" onClick={() => setNavOpen(!navOpen)}>
                    <div className="flex items-center gap-2"><i className="ri-git-branch-line text-lg"></i> {navOpen && t.explorer}</div>
                    {navOpen && <i className="ri-arrow-up-s-line"></i>}
                </div>
                
                <div className="panel-content-wrapper flex flex-col h-full">
                    <div className="p-2 flex gap-2 items-center z-10 border-b border-[var(--border)] bg-[var(--panel-bg)]">
                        <div className="relative flex-1">
                            <i className="ri-search-line absolute left-2 top-1.5 text-[var(--muted)] text-xs"></i>
                            {/* UPDATED: 使用 t.searchText */}
                            <input className="w-full pl-7 pr-2 py-1.5 text-xs rounded outline-none border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:border-[var(--accent)]" placeholder={t.searchText} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="relative" ref={newNodeMenuRef}>
                            <div className="split-btn-group h-[28px]">
                                <div className="split-btn-main" onClick={() => handleAddWithType('default')} title={t.newNode}><i className="ri-add-line"></i></div>
                                <div className="split-btn-arrow" onClick={() => setShowNewNodeMenu(!showNewNodeMenu)}><i className="ri-arrow-down-s-line text-[10px]"></i></div>
                            </div>
                            {showNewNodeMenu && (
                                <div className="split-dropdown bg-[var(--panel-bg)] border border-[var(--border)]">
                                    {['default', 'axiom', 'constant', 'parameter', 'note'].map(type => (
                                        <div key={type} className={`split-dropdown-item ${hoverClass}`} onClick={() => handleAddWithType(type)}>
                                            <div className={`w-2 h-2 rounded-full ${type === 'default' ? 'bg-blue-500' : type === 'axiom' ? 'bg-red-500' : type === 'constant' ? 'bg-yellow-500' : type === 'parameter' ? 'bg-green-500' : 'bg-gray-400'}`}></div> 
                                            <span className="capitalize">{type}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto relative" onContextMenu={handlePanelContextMenu}>
                        <GraphSidebar items={explorerItems} links={virtualLinks} nodes={nodes} rowHeight={32} />
                        <div className="relative z-10 pb-24">
                            {explorerItems.map((item, index) => (
                                <div key={item.cId} draggable={!searchTerm} onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}
                                    className={`group flex items-center gap-2 pl-10 pr-2 h-[32px] cursor-pointer transition-colors ${hoverClass}`}
                                    onDoubleClick={() => item.activeNode && onFocusNode(item.activeNode)} onContextMenu={(e) => handleContextMenu(e, item)}
                                >
                                    <div className={`flex-1 min-w-0 flex items-center justify-between ${!item.activeNode ? 'opacity-50' : ''}`}>
                                        <div className="truncate text-xs font-medium leading-tight select-none text-[var(--text)]">{item.content.title || "Untitled"}</div>
                                        {item.activeNode && item.isPinned && <i className="ri-pushpin-fill text-[10px] text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity"></i>}
                                    </div>
                                </div>
                            ))}
                            {explorerItems.length === 0 && <div className="text-center opacity-40 text-xs py-4 pl-8">No nodes found</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Control Panel (Settings) */}
            <div className={`ui-panel control-panel ${ctrlOpen ? 'w-64 open' : 'w-10 h-10'} bg-[var(--panel-bg)] border-l border-[var(--border)] text-[var(--text)]`}>
                <div className="panel-content-wrapper p-4 pb-12 space-y-5 overflow-y-auto h-full">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label-text mt-0 text-[var(--text)]">{t.language}</label>
                            <select className="input-field mt-1 bg-[var(--input-bg)] border-[var(--border)] text-[var(--text)]" value={settings.lang} onChange={e => setSettings({...settings, lang: e.target.value})}><option value="en">English</option><option value="zh">中文</option></select>
                        </div>
                        <div>
                            <label className="label-text mt-0 text-[var(--text)]">{t.theme}</label>
                            <div className="flex gap-1 mt-1">{Object.keys(THEME_PRESETS).map(key => (<div key={key} className={`w-6 h-6 rounded-full border border-[var(--border)] cursor-pointer transition-transform hover:scale-110 ${settings.theme === key ? 'ring-2 ring-offset-1 ring-[var(--accent)]' : ''}`} style={{ background: THEME_PRESETS[key]['--bg'] }} onClick={() => setSettings({...settings, theme: key})} title={key} />))}</div>
                        </div>
                    </div>

                    <div className="rounded-lg overflow-hidden border border-[var(--border)]">
                        {/* UPDATED: 使用 t.PHYandLAY */}
                        <div className={`px-3 py-2 text-[10px] font-bold opacity-70 cursor-pointer flex justify-between items-center ${hoverClass} select-none bg-[var(--input-bg)]`} onClick={() => setPhysicsOpen(!physicsOpen)}><span>{t.PHYandLAY}</span><i className={`ri-arrow-down-s-line transition-transform ${physicsOpen ? 'rotate-180' : ''}`}></i></div>
                        {physicsOpen && (
                            <div className="p-3 space-y-4 bg-transparent">
                                <div><div className="flex justify-between text-[10px] mb-1 opacity-60 uppercase font-bold"><span>{t.gravity} (Repel)</span><span>{settings.gravity}</span></div><input type="range" className="modern-range" min="50" max="1000" value={settings.gravity} onChange={e => setSettings({...settings, gravity: +e.target.value})} /></div>
                                <div><div className="flex justify-between text-[10px] mb-1 opacity-60 uppercase font-bold"><span>{t.centering} (Attract)</span><span>{settings.centering}</span></div><input type="range" className="modern-range" min="0" max="100" step="5" value={settings.centering} onChange={e => setSettings({...settings, centering: +e.target.value})} /></div>
                                <div><div className="flex justify-between text-[10px] mb-1 opacity-60 uppercase font-bold"><span>{t.distance} (Link)</span><span>{settings.distance}</span></div><input type="range" className="modern-range" min="100" max="600" value={settings.distance} onChange={e => setSettings({...settings, distance: +e.target.value})} /></div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between"><label htmlFor="tooltip-check" className="text-xs font-bold cursor-pointer select-none">{t.showTooltips}</label><input type="checkbox" id="tooltip-check" className="toggle-switch" checked={settings.showTooltips} onChange={e => setSettings({...settings, showTooltips: e.target.checked})} /></div>
                        <div className="flex items-center justify-between"><label htmlFor="edgelabel-check" className="text-xs font-bold cursor-pointer select-none">{t.showEdgeLabels}</label><input type="checkbox" id="edgelabel-check" className="toggle-switch" checked={settings.showEdgeLabels} onChange={e => setSettings({...settings, showEdgeLabels: e.target.checked})} /></div>
                        
                        {settings.showEdgeLabels && (
                            <div className="pl-2 space-y-2 border-l-2 border-[var(--border)] ml-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold opacity-70 uppercase">{t.edgeLabelMode || "Position"}</label>
                                    <div className="flex bg-[var(--input-bg)] rounded border border-[var(--border)] p-0.5">
                                        <button className={`px-2 py-0.5 text-[10px] rounded ${settings.edgeLabelMode === 'center' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'}`} onClick={() => setSettings({...settings, edgeLabelMode: 'center'})}>Center</button>
                                        <button className={`px-2 py-0.5 text-[10px] rounded ${settings.edgeLabelMode === 'side' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'}`} onClick={() => setSettings({...settings, edgeLabelMode: 'side'})}>Side</button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold opacity-70 uppercase">{t.edgeLabelBg || "Background"}</label>
                                    <div className="flex bg-[var(--input-bg)] rounded border border-[var(--border)] p-0.5">
                                        <button className={`px-2 py-0.5 text-[10px] rounded ${settings.edgeLabelBg === 'box' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'}`} onClick={() => setSettings({...settings, edgeLabelBg: 'box'})}>Box</button>
                                        <button className={`px-2 py-0.5 text-[10px] rounded ${settings.edgeLabelBg === 'none' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'}`} onClick={() => setSettings({...settings, edgeLabelBg: 'none'})}>None</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* UPDATED: 使用 t.showMinimap */}
                        <div className="flex items-center justify-between"><label htmlFor="minimap-check" className="text-xs font-bold cursor-pointer select-none">{t.showMinimap}</label><input type="checkbox" id="minimap-check" className="toggle-switch" checked={settings.showMinimap} onChange={e => setSettings({...settings, showMinimap: e.target.checked})} /></div>
                        
                        {settings.showMinimap && (
                            <div className="pl-2 space-y-2 border-l-2 border-[var(--border)] ml-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold opacity-70 uppercase">{t.minimapLabel || "Label"}</label>
                                    <select 
                                        className="bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)] text-[10px] rounded px-1 py-0.5 outline-none"
                                        value={settings.minimapLabelType || 'none'}
                                        onChange={e => setSettings({...settings, minimapLabelType: e.target.value})}
                                    >
                                        <option value="none">{t.none || "None"}</option>
                                        <option value="id">{t.id || "ID"}</option>
                                        <option value="title">{t.title || "Title"}</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-4 flex gap-2 border-t border-[var(--border)]">
                        <button className="btn flex-1 text-xs bg-[var(--input-bg)] border border-[var(--border)] hover:bg-[var(--bg)]" onClick={onExport}><i className="ri-download-line"></i> {t.export}</button>
                        <label className="btn flex-1 text-xs cursor-pointer bg-[var(--input-bg)] border border-[var(--border)] hover:bg-[var(--bg)]"><i className="ri-upload-line"></i> {t.import}<input type="file" className="hidden" accept=".json,.mathmap" onChange={onImport} /></label>
                    </div>
                </div>

                <div className="ui-header absolute bottom-0 left-0 w-full border-t border-[var(--border)] bg-[var(--panel-bg)]" onClick={() => setCtrlOpen(!ctrlOpen)}>
                    <div className="flex items-center gap-2"><i className="ri-settings-3-line text-lg"></i> {ctrlOpen && t.settings}</div>
                    {ctrlOpen && <i className="ri-arrow-down-s-line"></i>}
                </div>
            </div>
        </>
    );
};

export default UIOverlay;