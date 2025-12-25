import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import 'katex/dist/katex.min.css';

import { THEME_PRESETS, COLORS } from './theme';
import MathNode from './components/MathNode';
import NodeEditor from './components/NodeEditor';
import UIOverlay from './components/UIOverlay';
import ExportModal from './components/ExportModal';
import ContextMenu from './components/ContextMenu';
import { RichViewer } from './components/Common';

// Import local scene data
import localScene from '../scene.json';

// --- Constants & I18N ---
const I18N = {
    en: {
        explorer: "Explorer", settings: "Settings", newNode: "New Node", sceneOutline: "SCENE OUTLINE",
        theme: "Theme", gravity: "Gravity", centering: "Centering", distance: "Distance", showTooltips: "Show Tooltips",
        showMinimap: "Show Minimap", PHYandLAY: "Physics & Layout",searchText: "Search...", livePreview: "Live Preview",
        language: "Language", export: "Export", import: "Import", editNode: "Edit Node Content",
        id: "Unique ID", idHelp: "Only letters, numbers, and underscores.",
        title: "Title", type: "Type", color: "Color", template: "LaTeX Template",
        segments: "Interactive Segments", addSegment: "Add Segment", note: "Note (Markdown)",
        cancel: "Cancel", save: "Save Changes", delete: "Delete Node", tooltipSettings: "Tooltip Settings",
        types: { default: "Default", axiom: "Axiom", constant: "Constant", parameter: "Parameter", note: "Note" }
    },
    zh: {
        explorer: "资源管理器", settings: "设置", newNode: "新建节点", sceneOutline: "场景大纲",
        theme: "主题", gravity: "斥力强度", centering: "引力强度", distance: "连线距离", showTooltips: "显示提示框",
        showMinimap: "显示小地图", PHYandLAY: "物理与布局",searchText: "搜索...",livePreview: "实时预览",
        language: "语言", export: "导出", import: "导入", editNode: "编辑节点内容",
        id: "ID", idHelp: "仅限字母、数字和下划线。",
        title: "标题", type: "类型", color: "颜色", template: "LaTeX 模板",
        segments: "交互片段", addSegment: "添加片段", note: "备注 (Markdown)",
        cancel: "取消", save: "保存更改", delete: "删除节点", tooltipSettings: "提示框设置",
        types: { default: "默认", axiom: "公理", constant: "常数", parameter: "参数", note: "注释" }
    }
};

const FALLBACK_LIBRARY = { "root": { title: "Start Here", type: "default", template: "\\text{Welcome}", note: "Click 'New Node' to begin.", segments: {} } };
const FALLBACK_NODES = [ { id: "node-root", contentId: "root", x: window.innerWidth / 2, y: window.innerHeight / 2, color: COLORS[0] } ];

const App = () => {
    // --- State ---
    const [library, setLibrary] = useState(localScene?.library || FALLBACK_LIBRARY);
    const [nodes, setNodes] = useState(localScene?.scene?.nodes || FALLBACK_NODES);
    const [links, setLinks] = useState(localScene?.scene?.links || []);
    const [expandedState, setExpandedState] = useState(localScene?.scene?.expandedState || {});
    
    const [transform, setTransform] = useState({ x: window.innerWidth/2, y: window.innerHeight/2, k: 1 });
    const [tooltip, setTooltip] = useState(null);
    const [editingNodeId, setEditingNodeId] = useState(null);
    
    // UI & Logic State
    const [showExportModal, setShowExportModal] = useState(false);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, type: 'canvas', targetId: null });
    const [clipboard, setClipboard] = useState(null);

    const [settings, setSettings] = useState({ 
        theme: 'classic', gravity: 400, centering: 10, distance: 350, 
        showTooltips: true, showMinimap: true, lang: 'en' 
    });
    
    // --- Refs ---
    const svgRef = useRef(null);
    const simulationRef = useRef(null);
    const zoomBehavior = useRef(null);
    // Mutable graph data for D3 to avoid React state sync issues during ticks
    const graphData = useRef({ nodes: [...nodes], links: [...links] });

    // --- Helpers ---
    const updateSimulation = useCallback(() => {
        if (!simulationRef.current) return;
        simulationRef.current.nodes(graphData.current.nodes);
        simulationRef.current.force("link").links(graphData.current.links);
        simulationRef.current.alpha(1).restart();
        // Trigger React Render
        setNodes([...graphData.current.nodes]);
        setLinks([...graphData.current.links]);
    }, []);

    const getDescendants = (rootId, currentLinks) => {
        const descendants = new Set();
        const queue = [rootId];
        while (queue.length > 0) {
            const currId = queue.shift();
            const outgoing = currentLinks.filter(l => {
                const sId = typeof l.source === 'object' ? l.source.id : l.source;
                return sId === currId;
            });
            outgoing.forEach(l => {
                const tId = typeof l.target === 'object' ? l.target.id : l.target;
                if (!descendants.has(tId)) {
                    descendants.add(tId);
                    queue.push(tId);
                }
            });
        }
        return descendants;
    };

    // --- Effects ---
    
    // 1. Theme Application
    useEffect(() => {
        const root = document.querySelector('.app-container');
        if (root) { 
            const themeVars = THEME_PRESETS[settings.theme]; 
            Object.entries(themeVars).forEach(([key, val]) => root.style.setProperty(key, val)); 
        }
    }, [settings.theme]);

    // 2. D3 Initialization
    useEffect(() => {
        // Simulation
        simulationRef.current = d3.forceSimulation(graphData.current.nodes)
            .force("charge", d3.forceManyBody().strength(-settings.gravity))
            .force("x", d3.forceX(0).strength(settings.centering / 2000))
            .force("y", d3.forceY(0).strength(settings.centering / 2000))
            .force("link", d3.forceLink(graphData.current.links).id(d => d.id).distance(settings.distance))
            .force("collide", d3.forceCollide().radius(d => {
                const content = library[d.contentId];
                if (!content) return 150;
                let r = 160; 
                if (content.type === 'note') r += 40;
                if (content.type === 'axiom') r += 20;
                const textLen = (content.template || "").length + (content.note || "").length;
                if (textLen > 100) r += 40;
                return r;
            }).strength(0.8).iterations(2))
            .on("tick", () => { 
                setNodes([...graphData.current.nodes]); 
                setLinks([...graphData.current.links]); 
            });
        
        // Zoom
        zoomBehavior.current = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (e) => setTransform(e.transform));

        d3.select(svgRef.current)
            .call(zoomBehavior.current)
            .on("dblclick.zoom", null)
            // Attach Canvas Context Menu here
            .on("contextmenu", handleCanvasContextMenu); 
        
        // Initial Center
        if (graphData.current.nodes.length > 0 && transform.k === 1) {
           d3.select(svgRef.current).call(zoomBehavior.current.transform, d3.zoomIdentity.translate(window.innerWidth/2, window.innerHeight/2));
        }

        return () => simulationRef.current.stop();
    }, []); // Run once

    // 3. Update Physics Settings
    useEffect(() => {
        if (simulationRef.current) { 
            simulationRef.current.force("charge").strength(-settings.gravity); 
            simulationRef.current.force("x").strength(settings.centering / 2000);
            simulationRef.current.force("y").strength(settings.centering / 2000);
            simulationRef.current.force("link").distance(settings.distance); 
            simulationRef.current.alpha(0.3).restart(); 
        }
    }, [settings.gravity, settings.centering, settings.distance, library]);

    // --- Context Menu Handlers ---
    
    // Handler for Canvas (Background)
    const handleCanvasContextMenu = (e) => {
        e.preventDefault();
        // Check if target is actually the svg or scene layer, not a UI element
        // (Though UI elements are usually siblings, safety check doesn't hurt)
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            type: 'canvas',
            targetId: null
        });
    };

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

    const handleContextAction = (action) => {
        const { x, y, targetId } = contextMenu;
        setContextMenu(prev => ({ ...prev, visible: false }));

        // Helper: Spawn Node
        const spawnNode = (contentId, posX, posY, parentId = null) => {
            const newNodeId = `node_${Date.now()}`;
            const graphX = (posX - transform.x) / transform.k;
            const graphY = (posY - transform.y) / transform.k;
            
            const newNode = { 
                id: newNodeId, 
                contentId: contentId, 
                x: graphX, y: graphY, 
                color: COLORS[Math.floor(Math.random() * COLORS.length)] 
            };
            
            graphData.current.nodes.push(newNode);
            if (parentId) {
                graphData.current.links.push({ source: parentId, target: newNodeId });
            }
            updateSimulation();
        };

        switch (action) {
            case 'new':
                // Create new node at mouse position if available, else center
                const newContentId = `topic_${Date.now()}`; 
                setLibrary(prev => ({ 
                    ...prev, 
                    [newContentId]: { title: "New Topic", type: "default", template: "\\text{New Node}", note: "Edit this node to add content.", segments: {} } 
                }));
                spawnNode(newContentId, x, y);
                break;
            case 'refresh':
                d3.select(svgRef.current).transition().duration(750)
                    .call(zoomBehavior.current.transform, d3.zoomIdentity.translate(window.innerWidth/2, window.innerHeight/2).scale(1));
                simulationRef.current.alpha(1).restart();
                break;
            case 'collapse':
                if (confirm("Collapse all to root nodes?")) {
                    // Keep nodes that have NO incoming links (roots)
                    const rootNodes = graphData.current.nodes.filter(n => {
                        const incoming = graphData.current.links.some(l => {
                            const t = typeof l.target === 'object' ? l.target.id : l.target;
                            return t === n.id;
                        });
                        return !incoming;
                    });
                    
                    // Fallback if circular or something
                    const safeNodes = rootNodes.length > 0 ? rootNodes : [graphData.current.nodes[0]];
                    
                    graphData.current.nodes = safeNodes;
                    graphData.current.links = [];
                    setExpandedState({});
                    updateSimulation();
                }
                break;
            case 'copy':
                if (targetId) {
                    const node = graphData.current.nodes.find(n => n.id === targetId);
                    if (node && library[node.contentId]) {
                        setClipboard({ content: library[node.contentId], color: node.color });
                    }
                }
                break;
            case 'cut':
                if (targetId) {
                    const node = graphData.current.nodes.find(n => n.id === targetId);
                    if (node && library[node.contentId]) {
                        setClipboard({ content: library[node.contentId], color: node.color });
                        handleDeleteNode(targetId);
                    }
                }
                break;
            case 'paste':
                if (clipboard) {
                    const copyId = `copy_${Date.now()}`;
                    setLibrary(prev => ({ ...prev, [copyId]: { ...clipboard.content, title: clipboard.content.title + " (Copy)" } }));
                    spawnNode(copyId, x, y);
                }
                break;
            case 'paste_connect':
                if (clipboard && targetId) {
                    const copyId = `copy_${Date.now()}`;
                    setLibrary(prev => ({ ...prev, [copyId]: { ...clipboard.content, title: clipboard.content.title + " (Copy)" } }));
                    spawnNode(copyId, x + 50, y + 50, targetId);
                }
                break;
            case 'edit':
                if (targetId) setEditingNodeId(targetId);
                break;
            case 'hide':
                if (targetId) {
                    const node = graphData.current.nodes.find(n => n.id === targetId);
                    if(node) handleToggleVisibility(node.contentId);
                }
                break;
            case 'delete':
                if (targetId) handleDeleteNode(targetId);
                break;
            default: break;
        }
    };

    // --- Core Handlers ---

    const handleAddNode = () => {
        const newContentId = `topic_${Date.now()}`; 
        const newNodeId = `node_${Date.now()}`;
        setLibrary(prev => ({ 
            ...prev, 
            [newContentId]: { title: "New Topic", type: "default", template: "\\text{New Node}", note: "Edit this node to add content.", segments: {} } 
        }));
        
        const newNode = { 
            id: newNodeId, 
            contentId: newContentId, 
            x: -transform.x / transform.k + window.innerWidth/2, 
            y: -transform.y / transform.k + window.innerHeight/2, 
            color: COLORS[Math.floor(Math.random() * COLORS.length)] 
        };
        
        graphData.current.nodes.push(newNode); 
        updateSimulation();
    };

    const handleToggle = (parentId, segKey, targetContentId, color) => {
        const stateKey = `${parentId}-${segKey}`;
        const parent = graphData.current.nodes.find(n => n.id === parentId);
        
        // Check if link exists
        const existingLinkIndex = graphData.current.links.findIndex(l => {
            const sourceId = l.source.id || l.source;
            const targetId = l.target.id || l.target;
            const targetNode = graphData.current.nodes.find(n => n.id === targetId);
            return sourceId === parentId && targetNode && targetNode.contentId === targetContentId;
        });

        if (existingLinkIndex !== -1) {
            // --- COLLAPSE ---
            const link = graphData.current.links[existingLinkIndex];
            const targetId = link.target.id || link.target;
            
            graphData.current.links.splice(existingLinkIndex, 1);
            
            // Check if orphan (no other incoming links)
            const hasOtherIncoming = graphData.current.links.some(l => (l.target.id || l.target) === targetId);
            
            if (!hasOtherIncoming) {
                // Recursively remove target and its descendants
                const toRemove = getDescendants(targetId, graphData.current.links);
                toRemove.add(targetId);
                
                graphData.current.nodes = graphData.current.nodes.filter(n => !toRemove.has(n.id));
                graphData.current.links = graphData.current.links.filter(l => {
                    const s = typeof l.source === 'object' ? l.source.id : l.source;
                    const t = typeof l.target === 'object' ? l.target.id : l.target;
                    return !toRemove.has(s) && !toRemove.has(t);
                });
            }
            
            const nextExp = {...expandedState}; 
            delete nextExp[stateKey]; 
            setExpandedState(nextExp);

        } else {
            // --- EXPAND ---
            const existingNode = graphData.current.nodes.find(n => n.contentId === targetContentId);
            
            if (existingNode) {
                // Connect to existing
                graphData.current.links.push({ source: parent.id, target: existingNode.id });
                setExpandedState(prev => ({ ...prev, [stateKey]: existingNode.id }));
            } else {
                // Create new
                if (!library[targetContentId]) {
                    setLibrary(prev => ({ ...prev, [targetContentId]: { title: targetContentId, type: "default", template: "\\text{New Node}", note: "Auto-generated.", segments: {} } }));
                }
                const newId = `${targetContentId}_${Date.now()}`;
                const newNode = { 
                    id: newId, 
                    contentId: targetContentId, 
                    x: parent.x + (Math.random() - 0.5) * 50, 
                    y: parent.y + 150, 
                    color: color || parent.color 
                };
                
                graphData.current.nodes.push(newNode);
                graphData.current.links.push({ source: parent.id, target: newNode.id });
                setExpandedState(prev => ({ ...prev, [stateKey]: newId }));
            }
        }
        updateSimulation();
    };

    const handleToggleVisibility = (contentId) => {
        const existingNode = graphData.current.nodes.find(n => n.contentId === contentId);
        
        if (existingNode) {
            // HIDE: Recursive
            const toRemove = getDescendants(existingNode.id, graphData.current.links);
            toRemove.add(existingNode.id);
            
            graphData.current.nodes = graphData.current.nodes.filter(n => !toRemove.has(n.id));
            graphData.current.links = graphData.current.links.filter(l => {
                const s = typeof l.source === 'object' ? l.source.id : l.source;
                const t = typeof l.target === 'object' ? l.target.id : l.target;
                return !toRemove.has(s) && !toRemove.has(t);
            });
        } else {
            // SHOW
            const newNode = { 
                id: `node_${Date.now()}`, 
                contentId: contentId, 
                x: -transform.x / transform.k + window.innerWidth/2, 
                y: -transform.y / transform.k + window.innerHeight/2, 
                color: COLORS[Math.floor(Math.random() * COLORS.length)] 
            };
            graphData.current.nodes.push(newNode);
        }
        updateSimulation();
    };

    const handleDeleteNode = (nodeId) => {
        if (confirm("Delete this node?")) {
            graphData.current.nodes = graphData.current.nodes.filter(n => n.id !== nodeId);
            graphData.current.links = graphData.current.links.filter(l => (l.source.id || l.source) !== nodeId && (l.target.id || l.target) !== nodeId);
            updateSimulation();
            setEditingNodeId(null);
        }
    };

    const handleSaveNode = (nodeId, newContentId, newData, newColor) => {
        const node = graphData.current.nodes.find(n => n.id === nodeId);
        if (node) {
            const oldContentId = node.contentId;
            node.color = newColor;
            
            // Propagate color to children if defined in segments
            if (newData.segments) {
                Object.values(newData.segments).forEach(seg => {
                    if (seg.type === 'link' && seg.target && seg.color) {
                        const childNodes = graphData.current.nodes.filter(n => n.contentId === seg.target);
                        childNodes.forEach(child => child.color = seg.color);
                    }
                });
            }

            // Update Library
            setLibrary(prev => {
                const newLib = { ...prev };
                if (newContentId !== oldContentId) { 
                    newLib[newContentId] = newData; 
                    delete newLib[oldContentId]; 
                    node.contentId = newContentId; 
                } else { 
                    newLib[oldContentId] = newData; 
                }
                
                // Update references in other nodes
                Object.keys(newLib).forEach(key => {
                    const item = newLib[key];
                    if (item.segments) {
                        let changed = false;
                        const updatedSegments = { ...item.segments };
                        Object.keys(updatedSegments).forEach(segKey => {
                            const seg = updatedSegments[segKey];
                            if (seg.type === 'link' && (seg.target === newContentId || seg.target === oldContentId)) {
                                if (seg.color !== newColor) { 
                                    updatedSegments[segKey] = { ...seg, color: newColor, target: newContentId }; 
                                    changed = true; 
                                }
                            }
                        });
                        if (changed) newLib[key] = { ...item, segments: updatedSegments };
                    }
                });
                return newLib;
            });
            setNodes([...graphData.current.nodes]);
        }
        setEditingNodeId(null);
    };

    // --- Interaction Handlers ---
    const handleDragStart = (e, node) => {
        if (e.button !== 0 || e.target.closest('button')) return; 
        e.stopPropagation();
        simulationRef.current.alphaTarget(0.3).restart(); 
        node.fx = node.x; node.fy = node.y;
        
        const svg = svgRef.current;
        const move = (ev) => { 
            const rect = svg.getBoundingClientRect(); 
            node.fx = ((ev.clientX - rect.left) - transform.x) / transform.k; 
            node.fy = ((ev.clientY - rect.top) - transform.y) / transform.k; 
        };
        const up = () => { 
            simulationRef.current.alphaTarget(0); 
            window.removeEventListener('mousemove', move); 
            window.removeEventListener('mouseup', up); 
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
                onAddNode={handleAddNode} onExport={handleExportClick} onImport={handleImport}
                onTogglePin={handlePinNode} onEditNode={setEditingNodeId} onDeleteNode={handleDeleteNode}
                onToggleVisibility={handleToggleVisibility} onFocusNode={handleFocusNode} I18N={I18N}
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

            {editingNodeId && (
                <NodeEditor 
                    node={nodes.find(n => n.id === editingNodeId)} 
                    content={library[nodes.find(n => n.id === editingNodeId).contentId]} 
                    onClose={() => setEditingNodeId(null)} 
                    onSave={handleSaveNode} onDelete={handleDeleteNode} 
                    lang={settings.lang} existingIds={Object.keys(library)} I18N={I18N} 
                />
            )}

            {/* Canvas Container */}
            <div ref={svgRef} className="w-full h-full cursor-move">
                <div className="scene-layer" style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})` }}>
                    <svg className="link-layer">
                        {links.map((l, i) => { 
                            const s = typeof l.source === 'object' ? l.source : nodes.find(n => n.id === l.source); 
                            const t = typeof l.target === 'object' ? l.target : nodes.find(n => n.id === l.target); 
                            if(!s || !t) return null; 
                            return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} className="link-line" />; 
                        })}
                    </svg>
                    {nodes.map(node => (
                        <MathNode 
                            key={node.id} node={node} content={library[node.contentId]} 
                            onToggle={handleToggle} 
                            onHover={(e, data) => setTooltip(data ? { x: e.clientX, y: e.clientY, data } : null)} 
                            onDragStart={handleDragStart} 
                            onEdit={() => setEditingNodeId(node.id)} 
                            onPin={handlePinNode}
                            // Pass specific node context handler
                            onContextMenu={(e) => handleNodeContextMenu(e, node)}
                            lang={settings.lang} I18N={I18N}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default App;