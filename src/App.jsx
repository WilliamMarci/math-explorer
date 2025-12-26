import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import 'katex/dist/katex.min.css';

import { THEME_PRESETS, COLORS } from './theme';
import NodeEditor from './components/NodeEditor';
import UIOverlay from './components/UIOverlay';
import ExportModal from './components/ExportModal';
import ContextMenu from './components/ContextMenu';
import { RichViewer } from './components/Common';
import Canvas from './components/Canvas';

import { I18N } from './constants';
import { ICONS, PIXEL_ICONS } from './icons';
import { useSimulation } from './hooks/useSimulation';
import { useGraphState } from './hooks/useGraphState';
import { useGraphActions } from './hooks/useGraphActions';
import { useContextMenuActions } from './hooks/useContextMenuActions';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { useHistory } from './hooks/useHistory';

// Import local scene data
import localScene from '../scene.json';

const App = () => {
    // --- State ---
    const {
        library, setLibrary,
        nodes, setNodes,
        links, setLinks,
        expandedState, setExpandedState,
        graphData
    } = useGraphState(localScene);
    
    const [transform, setTransform] = useState({ x: window.innerWidth/2, y: window.innerHeight/2, k: 1 });
    const [tooltip, setTooltip] = useState(null);
    const [editingNodeId, setEditingNodeId] = useState(null);
    const [focusedNodeId, setFocusedNodeId] = useState(null);
    const [hoveredNodeId, setHoveredNodeId] = useState(null);
    
    // UI & Logic State
    const [showExportModal, setShowExportModal] = useState(false);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, type: 'canvas', targetId: null });
    const [clipboard, setClipboard] = useState(null);
    const [nodeOrder, setNodeOrder] = useState([]);
    const [selectedNodeIds, setSelectedNodeIds] = useState([]);
    const isSpacePressed = useRef(false);
    
    const [viewMode, setViewMode] = useState(false);
    const viewModeRef = useRef(false);
    useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

    const [shortcuts, setShortcuts] = useState({
        'new': 'n',
        'refresh': 'r',
        'copy': 'c',
        'paste': 'v',
        'cut': 'x',
        'delete': 'delete',
        'toggleViewMode': 'e'
    });

    const [settings, setSettings] = useState({ 
        theme: 'auto', gravity: 400, centering: 10, distance: 350, 
        showTooltips: true, showMinimap: true, lang: 'en',
        showEdgeLabels: true, edgeLabelMode: 'side', edgeLabelBg: 'none',
        minimalMode: false,
        segmentHighlights: true,
        minimalGapRatio: 0.5,
        collisionPadding: 10,
        pixelMode: false,
        pixelFont: true,
        pixelMath: true
    });
    
    const icons = settings.pixelMode ? PIXEL_ICONS : ICONS;
    
    // --- History ---
    const { pushState, undo, redo, canUndo, canRedo } = useHistory({
        library: localScene.library,
        nodes: localScene.scene.nodes,
        links: localScene.scene.links,
        expandedState: localScene.scene.expandedState || {}
    });

    // --- Refs ---
    const svgRef = useRef(null);
    const libraryRef = useRef(library);
    const expandedStateRef = useRef(expandedState);

    useEffect(() => { libraryRef.current = library; }, [library]);
    useEffect(() => { expandedStateRef.current = expandedState; }, [expandedState]);

    const handleCanvasContextMenu = (e) => {
        e.preventDefault();
        // Only show context menu if not dragging (simple check: if we are here, it's a click)
        // But with right-drag enabled, we might need to be careful.
        // D3 zoom filter might prevent this event if it consumes the right click?
        // Actually, if D3 consumes it for zoom, this might not fire.
        // We'll see. For now, keep it.
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type: 'canvas', targetId: null });
    };

    const { simulationRef, zoomBehavior } = useSimulation(graphData, svgRef, settings, library, setNodes, setLinks, setTransform, handleCanvasContextMenu, isSpacePressed, viewModeRef, hoveredNodeId);

    // --- Helpers ---
    const updateSimulation = useCallback(() => {
        if (!simulationRef.current) return;
        simulationRef.current.nodes(graphData.current.nodes);
        simulationRef.current.force("link").links(graphData.current.links);
        simulationRef.current.alpha(1).restart();
        // Trigger React Render
        setNodes([...graphData.current.nodes]);
        setLinks([...graphData.current.links]);
    }, [simulationRef, setNodes, setLinks, graphData]);

    const handleUndo = useCallback(() => {
        const state = undo();
        if (state) {
            setLibrary(state.library);
            setExpandedState(state.expandedState);
            setNodes(state.nodes);
            setLinks(state.links);
            graphData.current.nodes = state.nodes.map(n => ({...n})); // Re-create objects for D3
            graphData.current.links = state.links.map(l => ({...l}));
            updateSimulation();
        }
    }, [undo, setLibrary, setExpandedState, setNodes, setLinks, graphData, updateSimulation]);

    const handleRedo = useCallback(() => {
        const state = redo();
        if (state) {
            setLibrary(state.library);
            setExpandedState(state.expandedState);
            setNodes(state.nodes);
            setLinks(state.links);
            graphData.current.nodes = state.nodes.map(n => ({...n}));
            graphData.current.links = state.links.map(l => ({...l}));
            updateSimulation();
        }
    }, [redo, setLibrary, setExpandedState, setNodes, setLinks, graphData, updateSimulation]);

    const saveHistory = useCallback(() => {
        // Use refs to get latest state without closure staleness
        // We need to ensure this runs AFTER state updates have been reflected in refs
        pushState({
            library: JSON.parse(JSON.stringify(libraryRef.current)),
            nodes: graphData.current.nodes.map(n => ({ ...n })),
            links: graphData.current.links.map(l => ({ 
                ...l, 
                source: typeof l.source === 'object' ? l.source.id : l.source, 
                target: typeof l.target === 'object' ? l.target.id : l.target 
            })),
            expandedState: { ...expandedStateRef.current }
        });
    }, [pushState, graphData]); // Stable dependencies

    // --- Interaction Hook ---
    const { selectionBox, handleMouseDown: handleCanvasMouseDown, handleDragStart } = useCanvasInteraction({
        svgRef,
        transform,
        nodes,
        selectedNodeIds,
        setSelectedNodeIds,
        simulationRef,
        setFocusedNodeId,
        viewMode,
        isSpacePressed,
        onDragEnd: saveHistory
    });

    const actions = useGraphActions({
        graphData,
        setLibrary,
        setExpandedState,
        setNodes,
        updateSimulation,
        setEditingNodeId,
        library,
        setNodeOrder,
        saveHistory
    });

    const { addNode, deleteNode, toggleVisibility, handleToggle, handleSaveNode } = actions;

    const handleContextAction = useContextMenuActions({
        contextMenu,
        setContextMenu,
        graphData,
        library,
        setLibrary,
        clipboard,
        setClipboard,
        setEditingNodeId,
        updateSimulation,
        svgRef,
        zoomBehavior,
        expandedState,
        setExpandedState,
        transform,
        actions,
        selectedNodeIds
    });

    // --- Effects ---

    // 0. Global Keyboard Handlers (Shortcuts & Space Key)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (editingNodeId) return; // Don't trigger shortcuts when editing

            if (e.code === 'Space') {
                isSpacePressed.current = true;
                // Optional: Change cursor style
                if (svgRef.current) svgRef.current.style.cursor = 'grab';
            }

            const key = e.key.toLowerCase();

            // Single key shortcuts
            if (key === shortcuts.new.toLowerCase()) {
                addNode(transform);
            }
            if (key === shortcuts.refresh.toLowerCase()) {
                updateSimulation();
            }
            if (key === (shortcuts.toggleViewMode || 'e').toLowerCase()) {
                setViewMode(prev => !prev);
            }

            // Shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch(key) {
                    case shortcuts.copy.toLowerCase():
                        // Copy
                        if (selectedNodeIds.length > 0) {
                            // Copy logic for multiple? Or just focused?
                            // For now, let's use focused or first selected
                            const targetId = focusedNodeId || selectedNodeIds[0];
                            if (targetId) handleContextAction('copy', targetId);
                        }
                        break;
                    case shortcuts.paste.toLowerCase():
                        // Paste
                        handleContextAction('paste');
                        break;
                    case shortcuts.cut.toLowerCase():
                        // Cut
                        if (selectedNodeIds.length > 0) {
                             // Handle multiple cut?
                             const targetId = focusedNodeId || selectedNodeIds[0];
                             if (targetId) handleContextAction('cut', targetId);
                        }
                        break;
                    case 's':
                        e.preventDefault();
                        // Save?
                        break;
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) handleRedo();
                        else handleUndo();
                        break;
                    case 'y':
                        e.preventDefault();
                        handleRedo();
                        break;
                }
            }
            
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (editingNodeId) return; // Don't delete if editing text
                if (selectedNodeIds.length > 0) {
                    selectedNodeIds.forEach(id => deleteNode(id));
                    setSelectedNodeIds([]);
                    setFocusedNodeId(null);
                } else if (focusedNodeId) {
                    deleteNode(focusedNodeId);
                    setFocusedNodeId(null);
                }
            }
        };

        const handleKeyUp = (e) => {
            if (e.code === 'Space') {
                isSpacePressed.current = false;
                if (svgRef.current) svgRef.current.style.cursor = 'default';
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedNodeIds, focusedNodeId, editingNodeId, handleContextAction, deleteNode]);
    
    // 1. Theme Application
    useEffect(() => {
        const root = document.body;
        if (!root) return;

        const applyTheme = (themeName) => {
            let targetTheme = themeName;
            if (themeName === 'auto') {
                targetTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'blackboard' : 'classic';
            }
            const themeVars = THEME_PRESETS[targetTheme] || THEME_PRESETS['classic'];
            Object.entries(themeVars).forEach(([key, val]) => root.style.setProperty(key, val));
        };

        applyTheme(settings.theme);

        if (settings.theme === 'auto') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme('auto');
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [settings.theme]);

    // --- Context Menu Handlers ---
    
    // Handler for Nodes
    const handleNodeContextMenu = (e, node) => {
        e.preventDefault();
        e.stopPropagation(); // CRITICAL: Stop bubbling to canvas
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            type: 'node',
            targetId: node.id
        });
    };

    // --- Interaction Handlers ---
    // handleDragStart is now provided by useCanvasInteraction

    const handlePinNode = (node) => {
        if (node.fx != null && !node._tempFixed) { node.fx = null; node.fy = null; } 
        else { node.fx = node.x; node.fy = node.y; node._tempFixed = false; } 
        simulationRef.current.alpha(0.1).restart(); 
        setNodes([...graphData.current.nodes]);
    };

    const handleFocusNode = (nodeOrId) => {
        const node = typeof nodeOrId === 'string' 
            ? graphData.current.nodes.find(n => n.id === nodeOrId) 
            : nodeOrId;
        
        if (!node || !svgRef.current || !zoomBehavior.current) return;

        setFocusedNodeId(node.id);

        const width = window.innerWidth;
        const height = window.innerHeight;
        const t = d3.zoomIdentity.translate(width / 2, height / 2).scale(1.2).translate(-node.x, -node.y);

        d3.select(svgRef.current).transition().duration(1000).call(zoomBehavior.current.transform, t);
    };

    // --- Export/Import ---
    const handleExportClick = () => setShowExportModal(true);
    const performExport = (filename, format = 'json') => {
        if (format === 'json') {
            if (!filename.toLowerCase().endsWith('.mathmap') && !filename.toLowerCase().endsWith('.json')) filename += '.mathmap';
            const data = { 
                library, 
                scene: { 
                    nodes: graphData.current.nodes.map(n => ({ id: n.id, contentId: n.contentId, x: n.x, y: n.y, fx: n.fx, fy: n.fy, color: n.color })), 
                    links: graphData.current.links.map(l => ({ source: l.source.id || l.source, target: l.target.id || l.target })), 
                    expandedState 
                } 
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], {type : 'application/json'});
            const url = URL.createObjectURL(blob); 
            const a = document.createElement('a'); 
            a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
        } else if (format === 'svg' || format === 'png') {
            // Basic SVG/PNG Export using foreignObject
            // Note: This requires styles to be inline or available. 
            // Since we use Tailwind, styles are computed.
            // This is a best-effort implementation without external libraries.
            
            const svg = svgRef.current;
            if (!svg) return;

            const width = svg.clientWidth;
            const height = svg.clientHeight;
            
            // Clone the node to avoid modifying the DOM
            const clone = svg.cloneNode(true);
            
            // Wrap in SVG
            const data = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                <foreignObject width="100%" height="100%">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;background-color:var(--bg);color:var(--text)">
                        ${new XMLSerializer().serializeToString(clone)}
                    </div>
                </foreignObject>
            </svg>
            `;

            if (format === 'svg') {
                const blob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = filename + '.svg'; a.click(); URL.revokeObjectURL(url);
            } else {
                const img = new Image();
                const blob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
                const url = URL.createObjectURL(blob);
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg') || 'white';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0);
                    const pngUrl = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = pngUrl; a.download = filename + '.png'; a.click();
                    URL.revokeObjectURL(url);
                };
                img.src = url;
            }
        }
    };

    // Auto-save
    useEffect(() => {
        const timer = setTimeout(() => {
            const data = {
                library,
                scene: {
                    nodes: graphData.current.nodes.map(n => ({ id: n.id, contentId: n.contentId, x: n.x, y: n.y, fx: n.fx, fy: n.fy, color: n.color })),
                    links: graphData.current.links.map(l => ({ source: l.source.id || l.source, target: l.target.id || l.target })),
                    expandedState
                }
            };
            localStorage.setItem('mathmap_autosave', JSON.stringify(data));
        }, 2000);
        return () => clearTimeout(timer);
    }, [library, expandedState, nodes, links]); // Debounced auto-save

    const handleImport = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.library && data.scene) {
                    setLibrary(data.library); 
                    setExpandedState(data.scene.expandedState || {});
                    graphData.current.nodes = data.scene.nodes; 
                    graphData.current.links = data.scene.links;
                    updateSimulation();
                }
            } catch (err) { alert("Invalid MathMap file"); }
        };
        reader.readAsText(file);
    };

    return (
        <div className={`app-container ${settings.pixelMode ? 'pixel-mode' : ''} ${settings.pixelMode && settings.pixelFont !== false ? 'use-pixel-font' : ''} ${settings.pixelMode && settings.pixelMath !== false ? 'use-pixel-math' : ''}`}>
            <div className="grid-bg absolute inset-0 opacity-50 pointer-events-none"></div>
            
            {/* UI Overlay: Sibling of SVG, so right-clicks here won't bubble to SVG */}
            <UIOverlay 
                nodes={nodes} library={library} transform={transform} svgRef={svgRef}
                settings={{...settings, linksRef: links}} setSettings={setSettings}
                onAddNode={(type) => addNode(transform, type)} onExport={handleExportClick} onImport={handleImport}
                onTogglePin={handlePinNode} onEditNode={setEditingNodeId} onDeleteNode={deleteNode}
                onToggleVisibility={(id) => toggleVisibility(id, transform)} onFocusNode={handleFocusNode} 
                onAutoArrange={() => simulationRef.current.alpha(1).restart()}
                I18N={I18N}
                nodeOrder={nodeOrder} setNodeOrder={setNodeOrder}
                viewMode={viewMode} setViewMode={setViewMode}
                shortcuts={shortcuts} setShortcuts={setShortcuts}
                selectedNodeIds={selectedNodeIds}
                setSelectedNodeIds={setSelectedNodeIds}
                icons={icons}
            />
            
            <ExportModal 
                isOpen={showExportModal} onClose={() => setShowExportModal(false)} 
                onConfirm={performExport} lang={settings.lang} 
                settings={settings}
                icons={icons}
            />

            <ContextMenu 
                visible={contextMenu.visible} x={contextMenu.x} y={contextMenu.y} 
                type={contextMenu.type} targetId={contextMenu.targetId}
                hasClipboard={!!clipboard} onAction={handleContextAction} 
                onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
                lang={settings.lang}
                selectedCount={selectedNodeIds.length}
                settings={settings}
                icons={icons}
            />

            {tooltip && settings.showTooltips && (
                <div className="tooltip" style={{ top: tooltip.y + 15, left: tooltip.x + 15 }}>
                    <div className="tooltip-title">{tooltip.data.title}</div>
                    <RichViewer content={tooltip.data.content} type={tooltip.data.contentType || 'markdown'} />
                </div>
            )}

            {editingNodeId && (() => {
                const node = nodes.find(n => n.id === editingNodeId);
                const content = node ? library[node.contentId] : null;
                if (node && content) {
                    return (
                        <NodeEditor 
                            node={node} 
                            content={content} 
                            onClose={() => setEditingNodeId(null)} 
                            onSave={handleSaveNode} onDelete={deleteNode} 
                            lang={settings.lang} existingIds={Object.keys(library)} I18N={I18N} 
                            settings={settings}
                            icons={icons}
                        />
                    );
                }
                return null;
            })()}

            {/* Canvas Container */}
            <Canvas 
                svgRef={svgRef}
                transform={transform}
                links={links}
                nodes={nodes}
                library={library}
                onToggle={handleToggle}
                onHover={(e, data) => setTooltip(data ? { x: e.clientX, y: e.clientY, data } : null)}
                onDragStart={handleDragStart}
                onEdit={setEditingNodeId}
                editingNodeId={editingNodeId}
                focusedNodeId={focusedNodeId}
                selectedNodeIds={selectedNodeIds}
                onSelectionChange={setSelectedNodeIds}
                onPin={handlePinNode}
                onContextMenu={handleNodeContextMenu}
                lang={settings.lang}
                I18N={I18N}
                settings={settings}
                nodeOrder={nodeOrder}
                isSpacePressed={isSpacePressed}
                viewMode={viewMode}
                selectionBox={selectionBox}
                onCanvasMouseDown={handleCanvasMouseDown}
                hoveredNodeId={hoveredNodeId}
                onNodeHover={setHoveredNodeId}
                onFocusNode={handleFocusNode}
                icons={icons}
            />
        </div>
    );
};

export default App;