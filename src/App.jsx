import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import 'katex/dist/katex.min.css';

import { THEME_PRESETS, COLORS } from './theme';
import MathNode from './components/MathNode';
import NodeEditor from './components/NodeEditor';
import UIOverlay from './components/UIOverlay';
import { RichViewer } from './components/Common';

import localScene from '../scene.json';

const I18N = {
    en: {
        explorer: "Explorer", settings: "Settings", newNode: "New Node", sceneOutline: "SCENE OUTLINE",
        theme: "Theme", gravity: "Gravity", distance: "Distance", showTooltips: "Show Tooltips",
        language: "Language", export: "Export", import: "Import", editNode: "Edit Node Content",
        id: "Unique ID (Reference Key)", idHelp: "Only letters, numbers, and underscores.",
        title: "Title", type: "Type", color: "Color", template: "LaTeX Template",
        segments: "Interactive Segments", addSegment: "Add Segment", note: "Note (Markdown)",
        cancel: "Cancel", save: "Save Changes", delete: "Delete Node", tooltipSettings: "Tooltip Settings",
        types: { default: "Concept", axiom: "Axiom", constant: "Constant", parameter: "Parameter", note: "Note" }
    },
    zh: {
        explorer: "资源管理器", settings: "设置", newNode: "新建节点", sceneOutline: "场景大纲",
        theme: "主题", gravity: "引力强度", distance: "连线距离", showTooltips: "显示提示框",
        language: "语言", export: "导出", import: "导入", editNode: "编辑节点内容",
        id: "唯一 ID (引用键)", idHelp: "仅限字母、数字和下划线。",
        title: "标题", type: "类型", color: "颜色", template: "LaTeX 模板",
        segments: "交互片段", addSegment: "添加片段", note: "备注 (Markdown)",
        cancel: "取消", save: "保存更改", delete: "删除节点", tooltipSettings: "提示框设置",
        types: { default: "概念", axiom: "公理", constant: "常数", parameter: "参数", note: "便利贴" }
    }
};

const FALLBACK_LIBRARY = { "root": { title: "Start Here", type: "default", template: "\\text{Welcome}", note: "Click 'New Node' to begin.", segments: {} } };
const FALLBACK_NODES = [ { id: "node-root", contentId: "root", x: window.innerWidth / 2, y: window.innerHeight / 2, color: COLORS[0] } ];

const App = () => {
    const [library, setLibrary] = useState(localScene?.library || FALLBACK_LIBRARY);
    const [nodes, setNodes] = useState(localScene?.scene?.nodes || FALLBACK_NODES);
    const [links, setLinks] = useState(localScene?.scene?.links || []);
    const [expandedState, setExpandedState] = useState(localScene?.scene?.expandedState || {});
    
    const [transform, setTransform] = useState({ x: window.innerWidth/2, y: window.innerHeight/2, k: 1 });
    const [tooltip, setTooltip] = useState(null);
    const [editingNodeId, setEditingNodeId] = useState(null);
    const [settings, setSettings] = useState({ theme: 'classic', gravity: 300, distance: 350, showTooltips: true, lang: 'en' });
    
    const svgRef = useRef(null);
    const simulationRef = useRef(null);
    const graphData = useRef({ nodes: [...nodes], links: [...links] });

    useEffect(() => {
        const root = document.querySelector('.app-container');
        if (root) { const themeVars = THEME_PRESETS[settings.theme]; Object.entries(themeVars).forEach(([key, val]) => { root.style.setProperty(key, val); }); }
    }, [settings.theme]);

    // --- Physics Engine Setup ---
    useEffect(() => {
        simulationRef.current = d3.forceSimulation(graphData.current.nodes)
            .force("charge", d3.forceManyBody().strength(-settings.gravity))
            .force("link", d3.forceLink(graphData.current.links).id(d => d.id).distance(settings.distance))
            // Dynamic Collision Radius
            .force("collide", d3.forceCollide().radius(d => {
                const content = library[d.contentId];
                if (!content) return 150;
                
                // Base radius
                let r = 160; 
                
                // Type adjustments
                if (content.type === 'note') r += 40; // Notes are usually wider/taller
                if (content.type === 'axiom') r += 20;

                // Content adjustments (Rough estimation)
                const textLen = (content.template || "").length + (content.note || "").length;
                if (textLen > 100) r += 40;
                if (textLen > 300) r += 60;

                return r;
            }).strength(0.8).iterations(2)) // Higher iterations for better stability
            .on("tick", () => { setNodes([...graphData.current.nodes]); setLinks([...graphData.current.links]); });
        
        const zoom = d3.zoom().scaleExtent([0.1, 4]).on("zoom", e => setTransform(e.transform));
        d3.select(svgRef.current).call(zoom).on("dblclick.zoom", null);
        
        // Initial center if fresh load
        if (graphData.current.nodes.length > 0 && transform.k === 1 && transform.x === window.innerWidth/2) {
           // Keep initial center
        }

        return () => simulationRef.current.stop();
    }, []); // Run once on mount, but depends on library for collision calculation (handled below)

    // --- Update Physics Parameters ---
    useEffect(() => {
        if (simulationRef.current) { 
            simulationRef.current.force("charge").strength(-settings.gravity); 
            simulationRef.current.force("link").distance(settings.distance); 
            
            // Re-evaluate collision when library changes (content length changes)
            simulationRef.current.force("collide").radius(d => {
                const content = library[d.contentId];
                if (!content) return 150;
                let r = 160; 
                if (content.type === 'note') r += 40;
                if (content.type === 'axiom') r += 20;
                const textLen = (content.template || "").length + (content.note || "").length;
                if (textLen > 100) r += 40;
                if (textLen > 300) r += 60;
                return r;
            });

            simulationRef.current.alpha(0.3).restart(); 
        }
    }, [settings.gravity, settings.distance, library]); // Re-run when library updates to adjust sizes

    const handleAddNode = () => {
        const newContentId = `topic_${Date.now()}`; const newNodeId = `node_${Date.now()}`;
        setLibrary(prev => ({ ...prev, [newContentId]: { title: "New Topic", type: "default", template: "\\text{New Node}", note: "Edit this node to add content.", segments: {} } }));
        const newNode = { id: newNodeId, contentId: newContentId, x: -transform.x / transform.k + window.innerWidth/2, y: -transform.y / transform.k + window.innerHeight/2, color: COLORS[Math.floor(Math.random() * COLORS.length)], };
        graphData.current.nodes.push(newNode); simulationRef.current.nodes(graphData.current.nodes); simulationRef.current.alpha(1).restart(); setNodes([...graphData.current.nodes]);
    };

    const handleToggle = (parentId, segKey, targetContentId, color) => {
        const stateKey = `${parentId}-${segKey}`;
        const parent = graphData.current.nodes.find(n => n.id === parentId);
        const existingLinkIndex = graphData.current.links.findIndex(l => {
            const sourceId = l.source.id || l.source;
            const targetId = l.target.id || l.target;
            const targetNode = graphData.current.nodes.find(n => n.id === targetId);
            return sourceId === parentId && targetNode && targetNode.contentId === targetContentId;
        });

        if (existingLinkIndex !== -1) {
            const link = graphData.current.links[existingLinkIndex];
            const targetId = link.target.id || link.target;
            graphData.current.links.splice(existingLinkIndex, 1);
            const isOrphan = !graphData.current.links.some(l => (l.target.id || l.target) === targetId);
            if (isOrphan) graphData.current.nodes = graphData.current.nodes.filter(n => n.id !== targetId);
            const nextExp = {...expandedState}; delete nextExp[stateKey]; setExpandedState(nextExp);
        } else {
            const existingNode = graphData.current.nodes.find(n => n.contentId === targetContentId);
            if (existingNode) {
                graphData.current.links.push({ source: parent.id, target: existingNode.id });
                setExpandedState(prev => ({ ...prev, [stateKey]: existingNode.id }));
            } else {
                if (!library[targetContentId]) {
                    setLibrary(prev => ({ ...prev, [targetContentId]: { title: targetContentId, type: "default", template: "\\text{New Node}", note: "Auto-generated.", segments: {} } }));
                }
                const newId = `${targetContentId}_${Date.now()}`;
                const newNode = { id: newId, contentId: targetContentId, x: parent.x + (Math.random() - 0.5) * 50, y: parent.y + 150, color: color || parent.color };
                graphData.current.nodes.push(newNode);
                graphData.current.links.push({ source: parent.id, target: newNode.id });
                setExpandedState(prev => ({ ...prev, [stateKey]: newId }));
            }
        }
        simulationRef.current.nodes(graphData.current.nodes); simulationRef.current.force("link").links(graphData.current.links); simulationRef.current.alpha(1).restart(); 
        setNodes([...graphData.current.nodes]); setLinks([...graphData.current.links]);
    };

    const handleDragStart = (e, node) => {
        if (e.button !== 0 || e.target.closest('button')) return; e.stopPropagation();
        simulationRef.current.alphaTarget(0.3).restart(); node.fx = node.x; node.fy = node.y;
        const svg = svgRef.current;
        const move = (ev) => { const rect = svg.getBoundingClientRect(); node.fx = ((ev.clientX - rect.left) - transform.x) / transform.k; node.fy = ((ev.clientY - rect.top) - transform.y) / transform.k; };
        const up = () => { simulationRef.current.alphaTarget(0); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
        window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    };

    const handlePinNode = (node) => {
        if (node.fx != null) { 
            node.fx = null; node.fy = null; 
        } else { 
            node.fx = node.x; node.fy = node.y; 
        } 
        simulationRef.current.alpha(0.1).restart(); 
        setNodes([...graphData.current.nodes]);
    };

    const handleSaveNode = (nodeId, newContentId, newData, newColor) => {
        const node = graphData.current.nodes.find(n => n.id === nodeId);
        if (node) {
            const oldContentId = node.contentId;
            node.color = newColor;

            // 1. Forward Propagation
            if (newData.segments) {
                Object.values(newData.segments).forEach(seg => {
                    if (seg.type === 'link' && seg.target && seg.color) {
                        const childNodes = graphData.current.nodes.filter(n => n.contentId === seg.target);
                        childNodes.forEach(child => child.color = seg.color);
                    }
                });
            }

            // 2. Backward Propagation
            setLibrary(prev => {
                const newLib = { ...prev };
                if (newContentId !== oldContentId) { newLib[newContentId] = newData; delete newLib[oldContentId]; node.contentId = newContentId; } 
                else { newLib[oldContentId] = newData; }

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

    const handleDeleteNode = (nodeId) => {
        if (confirm("Delete this node?")) {
            graphData.current.nodes = graphData.current.nodes.filter(n => n.id !== nodeId);
            graphData.current.links = graphData.current.links.filter(l => (l.source.id || l.source) !== nodeId && (l.target.id || l.target) !== nodeId);
            simulationRef.current.nodes(graphData.current.nodes); simulationRef.current.force("link").links(graphData.current.links); simulationRef.current.alpha(1).restart();
            setNodes([...graphData.current.nodes]); setLinks([...graphData.current.links]);
            setEditingNodeId(null);
        }
    };

    const handleExport = () => {
        const data = { library, scene: { nodes: graphData.current.nodes.map(n => ({ id: n.id, contentId: n.contentId, x: n.x, y: n.y, fx: n.fx, fy: n.fy, color: n.color })), links: graphData.current.links.map(l => ({ source: l.source.id || l.source, target: l.target.id || l.target })), expandedState } };
        const blob = new Blob([JSON.stringify(data, null, 2)], {type : 'application/json'});
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'scene.mathmap'; a.click();
    };

    const handleImport = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.library && data.scene) {
                    setLibrary(data.library); setExpandedState(data.scene.expandedState || {});
                    graphData.current.nodes = data.scene.nodes; graphData.current.links = data.scene.links;
                    simulationRef.current.nodes(graphData.current.nodes); simulationRef.current.force("link").links(graphData.current.links); simulationRef.current.alpha(1).restart();
                    setNodes([...graphData.current.nodes]); setLinks([...graphData.current.links]);
                }
            } catch (err) { alert("Invalid MathMap file"); }
        };
        reader.readAsText(file);
    };

    return (
        <div className="app-container">
            <div className="grid-bg absolute inset-0 opacity-50 pointer-events-none"></div>
            
            <UIOverlay 
                nodes={nodes} library={library} transform={transform} svgRef={svgRef}
                settings={settings} setSettings={setSettings}
                onAddNode={handleAddNode} onExport={handleExport} onImport={handleImport}
                onTogglePin={handlePinNode}
                I18N={I18N}
            />

            {tooltip && settings.showTooltips && <div className="tooltip" style={{ top: tooltip.y + 15, left: tooltip.x + 15 }}><div className="tooltip-title">{tooltip.data.title}</div><RichViewer content={tooltip.data.content} type={tooltip.data.contentType || 'markdown'} /></div>}

            {editingNodeId && <NodeEditor node={nodes.find(n => n.id === editingNodeId)} content={library[nodes.find(n => n.id === editingNodeId).contentId]} onClose={() => setEditingNodeId(null)} onSave={handleSaveNode} onDelete={handleDeleteNode} lang={settings.lang} existingIds={Object.keys(library)} I18N={I18N} />}

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
                            onToggle={handleToggle} onHover={(e, data) => setTooltip(data ? { x: e.clientX, y: e.clientY, data } : null)} 
                            onDragStart={handleDragStart} onEdit={() => setEditingNodeId(node.id)} 
                            onPin={handlePinNode}
                            lang={settings.lang} I18N={I18N}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default App;