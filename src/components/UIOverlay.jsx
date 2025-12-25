import React, { useState, useMemo } from 'react';
import * as d3 from 'd3';
import { THEME_PRESETS } from '../theme';

const UIOverlay = ({ 
    nodes, library, transform, svgRef, 
    settings, setSettings, 
    onAddNode, onExport, onImport, onTogglePin,
    I18N 
}) => {
    const [navOpen, setNavOpen] = useState(true);
    const [ctrlOpen, setCtrlOpen] = useState(true);
    const [physicsOpen, setPhysicsOpen] = useState(false); // Collapsible physics settings
    const [searchTerm, setSearchTerm] = useState("");
    
    const t = I18N[settings.lang];

    // --- Explorer Logic ---
    const explorerItems = useMemo(() => {
        // 1. Map all content from library
        const allContent = Object.entries(library).map(([cId, content]) => {
            // Check if this content exists in the scene (find the node)
            const activeNode = nodes.find(n => n.contentId === cId);
            return {
                cId,
                content,
                activeNode, // If undefined, it's not in the scene
                isPinned: activeNode ? (activeNode.fx !== null && activeNode.fx !== undefined) : false
            };
        });

        // 2. Filter by search
        return allContent.filter(item => 
            item.content.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.cId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [library, nodes, searchTerm]);

    const handleZoomToNode = (node) => {
        if (!node) return;
        const svg = d3.select(svgRef.current);
        const tr = d3.zoomIdentity
            .translate(window.innerWidth/2 - node.x * transform.k, window.innerHeight/2 - node.y * transform.k)
            .scale(transform.k);
        svg.transition().duration(750).call(d3.zoom().transform, tr);
    };

    return (
        <>
            {/* Nav Panel (Explorer) */}
            <div className={`ui-panel nav-panel ${navOpen ? 'w-72' : 'w-12 h-12'}`}>
                <div className="ui-header" onClick={() => setNavOpen(!navOpen)}>
                    <div className="flex items-center gap-2"><i className="ri-menu-2-line text-lg"></i> {navOpen && t.explorer}</div>
                    {navOpen && <i className="ri-arrow-up-s-line"></i>}
                </div>
                
                {navOpen && (
                    <div className="flex flex-col h-[calc(80vh-48px)]">
                        {/* Action Button */}
                        <div className="p-3 border-b border-slate-100">
                            <button className="btn btn-primary w-full" onClick={onAddNode}>
                                <i className="ri-add-circle-line"></i> {t.newNode}
                            </button>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            <div className="label-text opacity-50 px-2 mb-2">{t.sceneOutline}</div>
                            
                            {explorerItems.map(item => (
                                <div 
                                    key={item.cId} 
                                    className={`
                                        group flex items-center gap-3 p-2 rounded text-sm transition-all
                                        ${item.activeNode ? 'hover:bg-slate-100 cursor-pointer' : 'opacity-50 grayscale'}
                                    `}
                                    onClick={() => item.activeNode && handleZoomToNode(item.activeNode)}
                                >
                                    {/* Status Dot */}
                                    <div 
                                        className={`w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0 ${!item.activeNode ? 'bg-gray-300' : ''}`} 
                                        style={item.activeNode ? { background: item.activeNode.color || '#555' } : {}}
                                    ></div>
                                    
                                    {/* Title */}
                                    <div className="flex-1 min-w-0">
                                        <div className="truncate font-medium">{item.content.title || "Untitled"}</div>
                                        <div className="text-[10px] text-gray-400 truncate font-mono">{item.cId}</div>
                                    </div>

                                    {/* Pin Icon (Only for active nodes) */}
                                    {item.activeNode && (
                                        <button 
                                            className={`
                                                w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 transition-colors
                                                ${item.isPinned ? 'text-blue-600' : 'text-gray-300 opacity-0 group-hover:opacity-100'}
                                            `}
                                            onClick={(e) => { e.stopPropagation(); onTogglePin(item.activeNode); }}
                                            title={item.isPinned ? "Unpin" : "Pin"}
                                        >
                                            <i className={item.isPinned ? "ri-pushpin-fill" : "ri-pushpin-line"}></i>
                                        </button>
                                    )}
                                </div>
                            ))}
                            
                            {explorerItems.length === 0 && (
                                <div className="text-center text-gray-400 text-xs py-4">No matching nodes</div>
                            )}
                        </div>

                        {/* Search Bar */}
                        <div className="p-3 border-t border-slate-100 bg-slate-50 rounded-b-lg">
                            <div className="relative">
                                <i className="ri-search-line absolute left-2.5 top-2 text-gray-400 text-xs"></i>
                                <input 
                                    className="w-full pl-8 pr-2 py-1.5 text-xs rounded border border-slate-200 outline-none focus:border-blue-400 transition-colors"
                                    placeholder="Search nodes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Control Panel (Settings) */}
            <div className={`ui-panel control-panel ${ctrlOpen ? 'w-64' : 'w-12 h-12'}`}>
                <div className="ui-header" onClick={() => setCtrlOpen(!ctrlOpen)}>
                    <div className="flex items-center gap-2"><i className="ri-settings-3-line text-lg"></i> {ctrlOpen && t.settings}</div>
                    {ctrlOpen && <i className="ri-arrow-down-s-line"></i>}
                </div>
                
                {ctrlOpen && (
                    <div className="ui-content space-y-4">
                        {/* Basic Settings */}
                        <div>
                            <label className="label-text">{t.language}</label>
                            <select className="input-field" value={settings.lang} onChange={e => setSettings({...settings, lang: e.target.value})}>
                                <option value="en">English</option>
                                <option value="zh">中文</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-text">{t.theme}</label>
                            <div className="flex gap-2 mt-1">
                                {Object.keys(THEME_PRESETS).map(key => (
                                    <div 
                                        key={key} 
                                        className={`w-8 h-8 rounded border cursor-pointer transition-transform hover:scale-110 ${settings.theme === key ? 'ring-2 ring-blue-500 scale-110' : ''}`} 
                                        style={{ background: THEME_PRESETS[key]['--bg'] }} 
                                        onClick={() => setSettings({...settings, theme: key})} 
                                        title={key} 
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Collapsible Physics Settings */}
                        <div className="border rounded border-slate-200 overflow-hidden">
                            <div 
                                className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 cursor-pointer flex justify-between items-center hover:bg-slate-100"
                                onClick={() => setPhysicsOpen(!physicsOpen)}
                            >
                                <span>PHYSICS & LAYOUT</span>
                                <i className={`ri-arrow-down-s-line transition-transform ${physicsOpen ? 'rotate-180' : ''}`}></i>
                            </div>
                            
                            {physicsOpen && (
                                <div className="p-3 space-y-3 bg-white">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1 text-gray-500">
                                            <span>{t.gravity}</span>
                                            <span>{settings.gravity}</span>
                                        </div>
                                        <input type="range" className="w-full accent-blue-600 h-1" min="50" max="1000" value={settings.gravity} onChange={e => setSettings({...settings, gravity: +e.target.value})} />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1 text-gray-500">
                                            <span>{t.distance}</span>
                                            <span>{settings.distance}</span>
                                        </div>
                                        <input type="range" className="w-full accent-blue-600 h-1" min="100" max="600" value={settings.distance} onChange={e => setSettings({...settings, distance: +e.target.value})} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" id="tooltip-check" checked={settings.showTooltips} onChange={e => setSettings({...settings, showTooltips: e.target.checked})} />
                            <label htmlFor="tooltip-check" className="text-sm cursor-pointer select-none">{t.showTooltips}</label>
                        </div>
                        
                        <div className="pt-4 border-t flex gap-2">
                            <button className="btn flex-1 text-xs" onClick={onExport}><i className="ri-download-line"></i> {t.export}</button>
                            <label className="btn flex-1 text-xs cursor-pointer">
                                <i className="ri-upload-line"></i> {t.import}
                                <input type="file" className="hidden" accept=".json,.mathmap" onChange={onImport} />
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default UIOverlay;