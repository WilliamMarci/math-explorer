import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../UI/Icon';
import { usePanelResize } from '../../hooks/usePanelResize';
import { useMenuPosition } from '../../hooks/useMenuPosition';
import ConfirmModal from '../Modals/ConfirmModal';

const GraphSidebar = React.memo(({ items, links, nodes, rowHeight = 32 }) => {
    const nodeIndexMap = useMemo(() => { const map = new Map(); items.forEach((item, index) => map.set(item.cId, index)); return map; }, [items]);
    const activeNodeMap = useMemo(() => { const map = new Map(); nodes.forEach(n => map.set(n.contentId, n)); return map; }, [nodes]);

    const paths = useMemo(() => {
        const result = [];
        
        items.forEach((sourceItem, srcIdx) => {
            if (!sourceItem.content || !sourceItem.content.segments) return;
            
            Object.values(sourceItem.content.segments).forEach(seg => {
                if (seg.type === 'link' && seg.target) {
                    const targetContentId = seg.target;
                    const tgtIdx = nodeIndexMap.get(targetContentId);
                    
                    if (tgtIdx !== undefined && srcIdx !== tgtIdx) {
                        const y1 = srcIdx * rowHeight + rowHeight / 2;
                        const y2 = tgtIdx * rowHeight + rowHeight / 2;
                        const xAnchor = 20; 
                        const dist = Math.abs(srcIdx - tgtIdx);
                        const controlX = xAnchor - Math.min(24, 10 + dist * 2);
                        const d = `M ${xAnchor} ${y1} C ${controlX} ${y1}, ${controlX} ${y2}, ${xAnchor} ${y2}`;
                        
                        const sourceActive = activeNodeMap.has(sourceItem.cId);
                        const targetActive = activeNodeMap.has(targetContentId);
                        const targetNode = activeNodeMap.get(targetContentId);
                        
                        let color;
                        let opacity;
                        let width;
                        
                        if (sourceActive && targetActive) {
                            color = targetNode ? (targetNode.color || '#cbd5e1') : '#94a3b8';
                            opacity = 0.6;
                            width = 1.5;
                        } else {
                            color = 'var(--muted)';
                            opacity = 0.3;
                            width = 1;
                        }
                        
                        result.push({ d, color, opacity, width, key: `${sourceItem.cId}-${targetContentId}` });
                    }
                }
            });
        });
        return result;
    }, [items, nodeIndexMap, activeNodeMap, rowHeight]);

    const height = Math.max(items.length * rowHeight, 100);

    return (
        <svg width="40" height={height} className="absolute top-0 left-0 pointer-events-none z-0" style={{ overflow: 'visible' }}>
            {paths.map(p => <path key={p.key} d={p.d} fill="none" stroke={p.color} strokeWidth={p.width} strokeOpacity={p.opacity} strokeLinecap="round" />)}
            {items.map((item, idx) => (
                <circle key={item.cId} cx="20" cy={idx * rowHeight + rowHeight / 2} r={item.activeNode ? 4 : 2.5} fill={item.activeNode ? (item.activeNode.color || '#94a3b8') : '#94a3b8'} stroke="var(--panel-bg)" strokeWidth="1.5" />
            ))}
        </svg>
    );
});


const ExplorerItem = React.memo(({ 
    item, index, isSelected, hoverClass, icons, t, searchTerm,
    onDragStart, onDragEnter, onDragEnd, onClick, onContextMenu 
}) => {
    return (
        <div draggable={!searchTerm} 
            onDragStart={(e) => onDragStart(e, index)} 
            onDragEnter={(e) => onDragEnter(e, index)} 
            onDragEnd={onDragEnd} 
            onDragOver={(e) => e.preventDefault()}
            className={`group flex items-center gap-2 pl-10 pr-2 h-[32px] cursor-pointer transition-colors ${isSelected ? 'bg-blue-500/20' : hoverClass}`}
            onClick={(e) => onClick(e, item)}
            onContextMenu={(e) => onContextMenu(e, item)}
        >
            <div className={`flex-1 min-w-0 flex items-center justify-between ${!item.activeNode ? 'opacity-50 grayscale' : ''}`}>
                <div className="truncate text-xs font-medium leading-tight select-none text-[var(--text)]">{item.content.title || "Untitled"}</div>
                {item.activeNode && item.isPinned && <Icon icon={icons?.unpin} className="text-[10px] text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
        </div>
    );
});

const Explorer = ({ 
    nodes, library, sceneLibrary, links, 
    onFocusNode, onTogglePin, onToggleVisibility, onEditNode, onDeleteNode, onAddNode, onAutoArrange,
    t, nodeOrder, setNodeOrder,
    viewMode, setViewMode,
    hoverClass,
    selectedNodeIds = [],
    setSelectedNodeIds,
    settings,
    icons
}) => {
    const [navOpen, setNavOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [contextMenu, setContextMenu] = useState(null);
    const [showNewNodeMenu, setShowNewNodeMenu] = useState(false);
    const [lastCreatedType, setLastCreatedType] = useState('default');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '', position: null });
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const newNodeMenuRef = useRef(null);
    const portalMenuRef = useRef(null);
    const panelRef = useRef(null);
    const { width: panelWidth, handleMouseDown: handleMouseDownResize } = usePanelResize(256, 160, 600, 'right');

    const isPixelMode = settings?.pixelMode;

    // Prepare Explorer Items
    const explorerItems = useMemo(() => {
        // Create a map for fast lookup of active nodes
        const activeNodeMap = new Map();
        nodes.forEach(n => activeNodeMap.set(n.contentId, n));

        // Use sceneLibrary keys as the source of truth for "Scene Nodes"
        // This ensures hidden nodes (which are in sceneLibrary but not in nodes) are included.
        // And it ensures User Library nodes (which are in library but not sceneLibrary) are excluded.
        let allIds = sceneLibrary ? Object.keys(sceneLibrary) : [];

        // Apply Sort Order
        if (nodeOrder && nodeOrder.length > 0) {
            const orderMap = new Map(nodeOrder.map((id, i) => [id, i]));
            
            allIds.sort((a, b) => {
                const idxA = orderMap.has(a) ? orderMap.get(a) : -1;
                const idxB = orderMap.has(b) ? orderMap.get(b) : -1;
                
                // We want reverse order of nodeOrder (Top Z = Top List)
                if (idxA !== -1 && idxB !== -1) return idxB - idxA; 
                if (idxA !== -1) return -1; // a has order, b doesn't -> a first (top)
                if (idxB !== -1) return 1; // b has order, a doesn't -> b first (top)
                return 0;
            });
        }

        // Map to item objects
        const items = allIds.map(cId => {
            const activeNode = activeNodeMap.get(cId);
            const content = library[cId];
            if (!content) return null;

            return {
                cId,
                content,
                activeNode, // If null, it's hidden/inactive
                isPinned: activeNode ? (activeNode.fx !== null && activeNode.fx !== undefined) : false
            };
        }).filter(item => item !== null);

        // Filter by search
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            return items.filter(i => i.content.title.toLowerCase().includes(lower));
        }

        return items;
    }, [nodes, library, sceneLibrary, nodeOrder, searchTerm]);

    // Refs for stable callbacks
    const selectedNodeIdsRef = useRef(selectedNodeIds);
    const explorerItemsRef = useRef(explorerItems);

    useEffect(() => { selectedNodeIdsRef.current = selectedNodeIds; }, [selectedNodeIds]);
    useEffect(() => { explorerItemsRef.current = explorerItems; }, [explorerItems]);

    // Drag and Drop Handlers
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleDragStart = useCallback((e, position) => {
        dragItem.current = position;
        e.dataTransfer.effectAllowed = 'move';
        // e.dataTransfer.setDragImage(new Image(), 0, 0); // Optional: Hide ghost image
    }, []);

    const handleDragEnter = useCallback((e, position) => {
        dragOverItem.current = position;
    }, []);

    const handleDragEnd = useCallback((e) => {
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const copy = [...explorerItemsRef.current];
            const itemToMove = copy[dragItem.current];
            
            // Remove from old pos
            copy.splice(dragItem.current, 1);
            // Insert at new pos
            copy.splice(dragOverItem.current, 0, itemToMove);
            
            // Update nodeOrder
            // Remember: explorerItems is REVERSED nodeOrder (Top of list = Top Z = Last in nodeOrder array)
            // So we need to reverse the list back to get the new nodeOrder
            const newOrder = copy.map(item => item.cId).reverse();
            
            setNodeOrder(newOrder);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    }, [setNodeOrder]);

    const handleItemClick = useCallback((e, item) => {
        if (!item.activeNode) return;
        
        // Custom Double Click Logic
        const now = Date.now();
        if (item.lastClickTime && now - item.lastClickTime < 200) {
             if (item.activeNode) onFocusNode(item.activeNode);
             item.lastClickTime = 0; // Reset
             return;
        }
        item.lastClickTime = now;

        const currentSelectedIds = selectedNodeIdsRef.current;
        const currentItems = explorerItemsRef.current;

        if (e.ctrlKey || e.metaKey) {
            // Toggle selection
            if (currentSelectedIds.includes(item.activeNode.id)) {
                setSelectedNodeIds(prev => prev.filter(id => id !== item.activeNode.id));
            } else {
                setSelectedNodeIds(prev => [...prev, item.activeNode.id]);
            }
        } else if (e.shiftKey) {
            // Range selection
            if (currentSelectedIds.length > 0) {
                const lastSelectedId = currentSelectedIds[currentSelectedIds.length - 1];
                const lastIdx = currentItems.findIndex(i => i.activeNode && i.activeNode.id === lastSelectedId);
                const currentIdx = currentItems.findIndex(i => i.cId === item.cId);
                
                if (lastIdx !== -1 && currentIdx !== -1) {
                    const start = Math.min(lastIdx, currentIdx);
                    const end = Math.max(lastIdx, currentIdx);
                    const rangeIds = currentItems.slice(start, end + 1).map(i => i.activeNode?.id).filter(Boolean);
                    const newSet = new Set([...currentSelectedIds, ...rangeIds]);
                    setSelectedNodeIds(Array.from(newSet));
                }
            } else {
                setSelectedNodeIds([item.activeNode.id]);
            }
        } else {
            // Single select
            setSelectedNodeIds([item.activeNode.id]);
            onFocusNode(item.activeNode);
        }
    }, [onFocusNode, setSelectedNodeIds]);

    // Context Menu
    const handleContextMenu = useCallback((e, item) => {
        e.preventDefault();
        e.stopPropagation();
        
        const currentSelectedIds = selectedNodeIdsRef.current;

        // If item is not in selection, select it (and clear others unless ctrl)
        if (item.activeNode && !currentSelectedIds.includes(item.activeNode.id)) {
             setSelectedNodeIds([item.activeNode.id]);
        }
        
        setContextMenu({ x: e.clientX, y: e.clientY, item });
    }, [setSelectedNodeIds]);

    const handlePanelContextMenu = (e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, item: null });
    };
    
    // Click Outside
    useEffect(() => {
        const handleClickOutside = (e) => { 
            if (newNodeMenuRef.current && !newNodeMenuRef.current.contains(e.target) && 
                (!portalMenuRef.current || !portalMenuRef.current.contains(e.target))) {
                setShowNewNodeMenu(false); 
            }
            if (contextMenu && !e.target.closest('.context-menu')) setContextMenu(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [contextMenu, showNewNodeMenu]);

    const handleAddWithType = (type) => { 
        onAddNode(type); 
        setLastCreatedType(type);
        setShowNewNodeMenu(false); 
    };

    const handleSelectType = (type) => {
        setLastCreatedType(type);
        setShowNewNodeMenu(false);
    };

    useEffect(() => {
        if (showNewNodeMenu && newNodeMenuRef.current) {
            const rect = newNodeMenuRef.current.getBoundingClientRect();
            setMenuPos({ top: rect.bottom + 2, left: rect.left - 80 }); 
        }
    }, [showNewNodeMenu]);

    const NODE_COLORS = {
        default: 'bg-blue-500',
        axiom: 'bg-red-500',
        constant: 'bg-yellow-500',
        parameter: 'bg-green-500',
        note: 'bg-gray-400'
    };

    const ExplorerContextMenu = ({ x, y, item, onClose }) => {
        const menuRef = useRef(null);
        const position = useMenuPosition(menuRef, true, x, y);
        
        return (
        <div ref={menuRef} className="context-menu" style={{ top: position.top, left: position.left }}>
            {item && item.activeNode ? (
                <>
                    <div className="context-menu-item" onClick={() => { onFocusNode(item.activeNode); onClose(); }}>
                        <Icon icon={icons?.focus} /> {t.focus}
                    </div>
                    <div className="context-menu-item" onClick={() => { onEditNode(item.activeNode.id); onClose(); }}>
                        <Icon icon={icons?.edit} /> {t.edit}
                    </div>
                    <div className="context-menu-item" onClick={() => { onTogglePin(item.activeNode); onClose(); }}>
                        <Icon icon={item.isPinned ? icons?.unpin : icons?.pin} /> {item.isPinned ? t.unpin : t.pin}
                    </div>
                    <div className="context-menu-item" onClick={() => { onToggleVisibility(item.activeNode.contentId); onClose(); }}>
                        <Icon icon={icons?.hide} /> {t.hide}
                    </div>
                    <div className="h-px bg-[var(--border)] my-1"></div>
                    <div className="context-menu-item danger" onClick={() => { 
                        setDeleteModal({
                            isOpen: true,
                            id: item.activeNode.id,
                            title: item.content.title,
                            position: { x, y }
                        });
                        onClose(); 
                    }}>
                        <Icon icon={icons?.delete} /> {t.delete}
                    </div>
                </>
            ) : item ? (
                // For inactive items (in library but not on canvas)
                <>
                     <div className="context-menu-item" onClick={() => { onToggleVisibility(item.cId); onClose(); }}>
                        <Icon icon={icons?.view} /> {t.show}
                    </div>
                </>
            ) : (
                <div className="context-menu-item" onClick={() => { onAutoArrange(); onClose(); }}>
                    <Icon icon={icons?.autoArrange} /> {t.autoArrange}
                </div>
            )}
        </div>
        );
    };

    return (
        <>
            {contextMenu && <ExplorerContextMenu {...contextMenu} onClose={() => setContextMenu(null)} />}
            
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={() => onDeleteNode(deleteModal.id)}
                title={t.delete || "Delete"}
                message={`${t.deleteConfirmation || "Are you sure you want to delete"} "${deleteModal.title}"?`}
                icons={icons}
                position={deleteModal.position}
            />

            <div 
                ref={panelRef}
                className={`ui-panel nav-panel ${navOpen ? 'h-[80vh] open' : 'w-10 h-10'} bg-[var(--panel-bg)] border-r border-[var(--border)] text-[var(--text)]`}
                style={{ width: navOpen ? panelWidth : 40 }}
            >
                {navOpen && (
                    <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-[var(--accent)] z-10 transition-colors"
                        onMouseDown={handleMouseDownResize}
                    ></div>
                )}
                <div className={`ui-header border-b border-[var(--border)] flex justify-between items-center pl-2 ${!navOpen && viewMode ? 'bg-[var(--accent)] text-white' : 'bg-[var(--panel-bg)]'}`}>
                    <div className={`flex items-center gap-2 cursor-pointer transition-colors h-full w-full justify-start`} onClick={() => setNavOpen(!navOpen)}>
                        <Icon icon={icons?.explorer} className="text-lg" /> {navOpen && t.explorer}
                    </div>
                    {navOpen && (
                        <div className="flex items-center gap-2">
                             <button 
                                className={`btn-icon w-6 h-6 flex items-center justify-center rounded ${viewMode ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                                onClick={() => setViewMode(!viewMode)}
                                title={viewMode ? (t.viewModeReadOnly || "View Mode (Read Only)") : (t.editMode || "Edit Mode")}
                             >
                                <Icon icon={viewMode ? icons?.view : icons?.edit} />
                             </button>
                             <Icon icon={icons?.arrowUp} className="cursor-pointer" onClick={() => setNavOpen(!navOpen)} />
                        </div>
                    )}
                </div>
                
                {navOpen && (
                <div className="panel-content-wrapper flex flex-col h-full">
                    <div className="p-2 flex gap-2 items-center z-10 border-b border-[var(--border)] bg-[var(--panel-bg)]">
                        <div className="relative flex-1">
                            <div className="absolute left-2 top-1.5 text-[var(--muted)] text-xs pointer-events-none">
                                <Icon icon={icons?.search} />
                            </div>
                            <input className="w-full pl-7 pr-2 py-1.5 text-xs rounded outline-none border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:border-[var(--accent)]" placeholder={t.searchText} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="relative" ref={newNodeMenuRef}>
                            <div className="split-btn-group h-[28px] flex items-center border border-[var(--border)] rounded overflow-hidden bg-[var(--input-bg)]">
                                <div 
                                    className={`split-btn-main px-2 h-full flex items-center justify-center cursor-pointer hover:opacity-90 text-white ${NODE_COLORS[lastCreatedType]}`} 
                                    onClick={() => handleAddWithType(lastCreatedType)} 
                                    title={`${t.newNode} (${t.types[lastCreatedType] || lastCreatedType})`}
                                >
                                    <Icon icon={icons?.add} />
                                </div>
                                <div className="w-px h-full bg-white/20"></div>
                                <div 
                                    className={`split-btn-arrow px-1 h-full flex items-center justify-center cursor-pointer hover:opacity-90 text-white ${NODE_COLORS[lastCreatedType]}`} 
                                    onClick={() => setShowNewNodeMenu(!showNewNodeMenu)}
                                >
                                    <Icon icon={icons?.arrowDown} className="text-[10px]" />
                                </div>
                            </div>
                            {showNewNodeMenu && createPortal(
                                <div 
                                    ref={portalMenuRef}
                                    className="fixed bg-[var(--panel-bg)] border border-[var(--border)] shadow-lg rounded z-[9999] w-32 flex flex-col py-1"
                                    style={{ top: menuPos.top, left: menuPos.left }}
                                >
                                    {Object.keys(NODE_COLORS).map(type => (
                                        <div key={type} className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--hover-bg)] transition-colors`} onClick={() => handleSelectType(type)}>
                                            <div className={`w-2 h-2 rounded-full ${NODE_COLORS[type]}`}></div> 
                                            <span className="capitalize text-xs text-[var(--text)]">{t.types[type] || type}</span>
                                        </div>
                                    ))}
                                </div>,
                                document.body
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto relative" onContextMenu={handlePanelContextMenu}>
                        <GraphSidebar items={explorerItems} links={links} nodes={nodes} rowHeight={32} />
                        <div className="relative z-10 pb-24">
                            {explorerItems.map((item, index) => {
                                const isSelected = item.activeNode && selectedNodeIds.includes(item.activeNode.id);
                                return (
                                    <ExplorerItem 
                                        key={item.cId}
                                        item={item}
                                        index={index}
                                        isSelected={isSelected}
                                        hoverClass={hoverClass}
                                        icons={icons}
                                        t={t}
                                        searchTerm={searchTerm}
                                        onDragStart={handleDragStart}
                                        onDragEnter={handleDragEnter}
                                        onDragEnd={handleDragEnd}
                                        onClick={handleItemClick}
                                        onContextMenu={handleContextMenu}
                                    />
                                );
                            })}
                            {explorerItems.length === 0 && <div className="text-center opacity-40 text-xs py-4 pl-8">{t.noNodes || "No nodes found"}</div>}
                        </div>
                    </div>
                </div>
                )}
            </div>
        </>
    );
};

export default Explorer;
