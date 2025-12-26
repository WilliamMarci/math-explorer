import React from 'react';

const AppearanceSettings = ({ settings, setSettings, t }) => {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label htmlFor="pixel-check" className="text-xs font-bold cursor-pointer select-none">{t.pixelMode || "Pixel Mode"}</label>
                <input 
                    type="checkbox" 
                    id="pixel-check" 
                    className="toggle-switch" 
                    checked={settings.pixelMode} 
                    onChange={e => setSettings({...settings, pixelMode: e.target.checked})} 
                />
            </div>

            {settings.pixelMode && (
                <div className="pl-2 space-y-2 border-l-2 border-[var(--border)] ml-1 mb-2">
                    <div className="flex items-center justify-between">
                        <label htmlFor="pixel-font-check" className="text-[10px] font-bold opacity-70 uppercase cursor-pointer select-none">{t.pixelFont || "Use Pixel Font"}</label>
                        <input 
                            type="checkbox" 
                            id="pixel-font-check" 
                            className="toggle-switch scale-75 origin-right" 
                            checked={settings.pixelFont !== false} 
                            onChange={e => setSettings({...settings, pixelFont: e.target.checked})} 
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="pixel-math-check" className="text-[10px] font-bold opacity-70 uppercase cursor-pointer select-none">{t.pixelMath || "Use Pixel Math"}</label>
                        <input 
                            type="checkbox" 
                            id="pixel-math-check" 
                            className="toggle-switch scale-75 origin-right" 
                            checked={settings.pixelMath !== false} 
                            onChange={e => setSettings({...settings, pixelMath: e.target.checked})} 
                        />
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <label htmlFor="minimal-check" className="text-xs font-bold cursor-pointer select-none">{t.minimalMode || "Minimal Mode"}</label>
                <input 
                    type="checkbox" 
                    id="minimal-check" 
                    className="toggle-switch" 
                    checked={settings.minimalMode} 
                    onChange={e => setSettings({...settings, minimalMode: e.target.checked})} 
                />
            </div>

            {settings.minimalMode && (
                <div className="pl-2 space-y-2 border-l-2 border-[var(--border)] ml-1 mb-2">
                    <div className="flex items-center justify-between">
                        <label htmlFor="segment-highlight-check" className="text-[10px] font-bold opacity-70 uppercase cursor-pointer select-none">{t.segmentHighlights || "Show Highlights"}</label>
                        <input 
                            type="checkbox" 
                            id="segment-highlight-check" 
                            className="toggle-switch scale-75 origin-right" 
                            checked={settings.segmentHighlights !== false} 
                            onChange={e => setSettings({...settings, segmentHighlights: e.target.checked})} 
                        />
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <label htmlFor="tooltip-check" className="text-xs font-bold cursor-pointer select-none">{t.showTooltips}</label>
                <input 
                    type="checkbox" 
                    id="tooltip-check" 
                    className="toggle-switch" 
                    checked={settings.showTooltips} 
                    onChange={e => setSettings({...settings, showTooltips: e.target.checked})} 
                />
            </div>
            
            <div className="flex items-center justify-between">
                <label htmlFor="edgelabel-check" className="text-xs font-bold cursor-pointer select-none">{t.showEdgeLabels}</label>
                <input 
                    type="checkbox" 
                    id="edgelabel-check" 
                    className="toggle-switch" 
                    checked={settings.showEdgeLabels} 
                    onChange={e => setSettings({...settings, showEdgeLabels: e.target.checked})} 
                />
            </div>
            
            {settings.showEdgeLabels && (
                <div className="pl-2 space-y-2 border-l-2 border-[var(--border)] ml-1">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold opacity-70 uppercase">{t.edgeLabelMode || "Position"}</label>
                        <div className="flex bg-[var(--input-bg)] rounded border border-[var(--border)] p-0.5">
                            <button 
                                className={`px-2 py-0.5 text-[10px] rounded ${settings.edgeLabelMode === 'center' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'}`} 
                                onClick={() => setSettings({...settings, edgeLabelMode: 'center'})}
                            >
                                Center
                            </button>
                            <button 
                                className={`px-2 py-0.5 text-[10px] rounded ${settings.edgeLabelMode === 'side' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'}`} 
                                onClick={() => setSettings({...settings, edgeLabelMode: 'side'})}
                            >
                                Side
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold opacity-70 uppercase">{t.edgeLabelBg || "Background"}</label>
                        <div className="flex bg-[var(--input-bg)] rounded border border-[var(--border)] p-0.5">
                            <button 
                                className={`px-2 py-0.5 text-[10px] rounded ${settings.edgeLabelBg === 'box' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'}`} 
                                onClick={() => setSettings({...settings, edgeLabelBg: 'box'})}
                            >
                                Box
                            </button>
                            <button 
                                className={`px-2 py-0.5 text-[10px] rounded ${settings.edgeLabelBg === 'none' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'}`} 
                                onClick={() => setSettings({...settings, edgeLabelBg: 'none'})}
                            >
                                None
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <label htmlFor="minimap-check" className="text-xs font-bold cursor-pointer select-none">{t.showMinimap}</label>
                <input 
                    type="checkbox" 
                    id="minimap-check" 
                    className="toggle-switch" 
                    checked={settings.showMinimap} 
                    onChange={e => setSettings({...settings, showMinimap: e.target.checked})} 
                />
            </div>
            
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
    );
};

export default AppearanceSettings;
