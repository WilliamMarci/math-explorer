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
import { useSimulation } from './hooks/useSimulation';
import { useGraphState } from './hooks/useGraphState';
import { useGraphActions } from './hooks/useGraphActions';
import { useContextMenuActions } from './hooks/useContextMenuActions';

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
        showEdgeLabels: true, edgeLabelMode: 'side', edgeLabelBg: 'none'
    });
    
    // --- Refs ---
    const svgRef = useRef(null);

    const handleCanvasContextMenu = (e) => {
        e.preventDefault();
        // Only show context menu if not dragging (simple check: if we are here, it's a click)
        // But with right-drag enabled, we might need to be careful.
        // D3 zoom filter might prevent this event if it consumes the right click?
        // Actually, if D3 consumes it for zoom, this might not fire.
        // We'll see. For now, keep it.
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type: 'canvas', targetId: null });
    };

    const { simulationRef, zoomBehavior } = useSimulation(graphData, svgRef, settings, library, setNodes, setLinks, setTransform, handleCanvasContextMenu, isSpacePressed, viewModeRef);

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

    const actions = useGraphActions({
        graphData,
        setLibrary,
        setExpandedState,
        setNodes,
        updateSimulation,
        setEditingNodeId,
        library,
        setNodeOrder
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
        actions
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
    const handleDragStart = (e, node) => {
        if (e.button !== 0 || e.target.closest('button')) return; 
        e.stopPropagation();
        setFocusedNodeId(node.id);
        simulationRef.current.alphaTarget(0.3).restart(); 
        
        // Store initial pin state
        const wasPinned = node.fx !== null && node.fx !== undefined;
        
        // Set initial fixed position to current position (to start drag)
        node.fx = node.x; 
        node.fy = node.y;
        
        const isCtrlPressed = e.ctrlKey;
        
        const svg = svgRef.current;
        const rect = svg.getBoundingClientRect();
        
        // Calculate offset from node center to mouse click
        const mouseX = ((e.clientX - rect.left) - transform.x) / transform.k;
        const mouseY = ((e.clientY - rect.top) - transform.y) / transform.k;
        const offsetX = node.x - mouseX;
        const offsetY = node.y - mouseY;

        const move = (ev) => { 
            const curX = ((ev.clientX - rect.left) - transform.x) / transform.k;
            const curY = ((ev.clientY - rect.top) - transform.y) / transform.k;
            node.fx = curX + offsetX; 
            node.fy = curY + offsetY; 
        };
        
        const up = () => { 
            simulationRef.current.alphaTarget(0); 
            window.removeEventListener('mousemove', move); 
            window.removeEventListener('mouseup', up); 
            
            // If Ctrl was pressed, keep it pinned.
            // If Ctrl was NOT pressed, restore original pin state.
            // If it was NOT pinned originally, unpin it (set fx/fy to null).
            // If it WAS pinned originally, keep it pinned (fx/fy remain set to new pos).
            if (!isCtrlPressed && !wasPinned) {
                node.fx = null;
                node.fy = null;
            }
        };
        window.addEventListener('mousemove', move); 
        window.addEventListener('mouseup', up);
    };

    const handlePinNode = (node) => {
        if (node.fx != null) { node.fx = null; node.fy = null; } 
        else { node.fx = node.x; node.fy = node.y; } 
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
    const performExport = (filename) => {
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
    };

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
        <div className="app-container">
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
            />
            
            <ExportModal 
                isOpen={showExportModal} onClose={() => setShowExportModal(false)} 
                onConfirm={performExport} lang={settings.lang} 
            />

            <ContextMenu 
                visible={contextMenu.visible} x={contextMenu.x} y={contextMenu.y} 
                type={contextMenu.type} targetId={contextMenu.targetId}
                hasClipboard={!!clipboard} onAction={handleContextAction} 
                onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
                lang={settings.lang}
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
            />
        </div>
    );
};

export default App;