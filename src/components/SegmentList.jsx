import React from 'react';
import ColorPalette from './ColorPalette';
import { StyleIcons, DashIcons } from './StyleIcons';

const SegmentList = ({ segments, onUpdate, onDelete, onAdd, t }) => {
    const inputClass = "w-full px-3 py-2 rounded text-sm outline-none transition-colors bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] focus:border-[var(--accent)]";

    return (
        <div className="space-y-3 p-4 rounded border border-[var(--border)] bg-[var(--input-bg)] flex-1 overflow-y-auto min-h-[400px]">
            {segments.length === 0 && (
                <div className="text-center opacity-40 text-xs py-8 italic select-none text-[var(--text)]">No segments defined.</div>
            )}
            
            {segments.map((seg, idx) => (
                <div key={idx} className="p-3 rounded shadow-sm text-sm border border-[var(--border)] bg-[var(--panel-bg)]">
                    <div className="flex gap-2 mb-2 items-center">
                        <div className="flex items-center bg-[var(--input-bg)] border border-[var(--border)] rounded px-2">
                            <span className="opacity-50 text-[12px] mr-1">{'{{'}</span>
                            <input 
                                className="bg-transparent outline-none w-5 font-mono font-bold text-xs text-[var(--text)] text-center" 
                                value={seg.key} 
                                onChange={e => onUpdate(idx, 'key', e.target.value)}
                                placeholder="key"
                            />
                            <span className="opacity-50 text-[12px] ml-1">{'}}'}</span>
                        </div>

                        <input className={`${inputClass} py-1`} placeholder="LaTeX" value={seg.text} onChange={e => onUpdate(idx, 'text', e.target.value)} />
                        <select className={`${inputClass} w-24 py-1`} value={seg.type} onChange={e => onUpdate(idx, 'type', e.target.value)}>
                            <option value="text">Text</option><option value="link">Link</option>
                        </select>
                        <button className="text-red-400 hover:text-red-600 px-2 transition-colors" onClick={() => onDelete(idx)}><i className="ri-delete-bin-line"></i></button>
                    </div>
                    
                    {seg.type === 'link' && (
                        <div className="mb-3 pl-4 border-l-2 border-[var(--accent)] ml-1 space-y-3 mt-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold opacity-50 uppercase mb-1 block text-[var(--text)]">Target ID</label>
                                    <input className={`${inputClass} py-1`} placeholder="Target Content ID" value={seg.target || ''} onChange={e => onUpdate(idx, 'target', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold opacity-50 uppercase mb-1 block text-[var(--text)]">Link Color</label>
                                    <ColorPalette selectedColor={seg.color} onSelect={(c) => onUpdate(idx, 'color', c)} size="sm" />
                                </div>
                            </div>

                            {/* Connection Settings Toggle */}
                            <div className="flex items-center justify-between pt-1 border-t border-[var(--border)] border-dashed mt-2">
                                <span className="text-xs font-bold opacity-70 uppercase text-[var(--text)]">Connection Style</span>
                                <button 
                                    className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${seg._connSettingsOpen ? 'bg-[var(--accent)] text-white' : 'bg-[var(--input-bg)] text-[var(--muted)] hover:bg-[var(--border)]'}`}
                                    onClick={() => onUpdate(idx, '_connSettingsOpen', !seg._connSettingsOpen)}
                                    title="Customize Connection"
                                >
                                    <i className="ri-settings-3-fill text-xs"></i>
                                </button>
                            </div>

                            {/* Connection Settings Panel */}
                            {seg._connSettingsOpen && (
                                <div className="p-3 bg-[var(--bg)] rounded border border-[var(--border)] space-y-3 animate-in fade-in slide-in-from-top-1">
                                    <div>
                                        <label className="text-[10px] font-bold opacity-50 uppercase mb-1 block text-[var(--text)]">{t.edgeLabel || "Edge Label"}</label>
                                        <textarea 
                                            className={`${inputClass} min-h-[40px] font-mono text-xs`} 
                                            placeholder="e.g. \implies"
                                            value={seg.connectionLabel || ''}
                                            onChange={e => onUpdate(idx, 'connectionLabel', e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold opacity-50 uppercase mb-2 block text-[var(--text)]">{t.endpoint || "Endpoint"}</label>
                                            <div className="flex gap-1 flex-wrap">
                                                {['arrow', 'hollow', 'line', 'circle', 'diamond'].map(style => (
                                                    <div 
                                                        key={style}
                                                        onClick={() => onUpdate(idx, 'connectionStyle', style)}
                                                        className={`
                                                            w-8 h-8 rounded border cursor-pointer flex items-center justify-center transition-all
                                                            ${(seg.connectionStyle === style || (!seg.connectionStyle && style === 'arrow')) 
                                                                ? 'border-[var(--accent)] bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]' 
                                                                : 'border-[var(--border)] hover:bg-[var(--input-bg)]'}
                                                        `}
                                                        title={style}
                                                    >
                                                        <div className="transform scale-75 origin-center">
                                                            {StyleIcons[style]}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold opacity-50 uppercase mb-2 block text-[var(--text)]">{t.stroke || "Stroke"}</label>
                                            <div className="flex gap-1 flex-wrap">
                                                {['solid', 'dashed', 'dotted'].map(style => (
                                                    <div 
                                                        key={style}
                                                        onClick={() => onUpdate(idx, 'connectionDash', style)}
                                                        className={`
                                                            w-8 h-8 rounded border cursor-pointer flex items-center justify-center transition-all
                                                            ${(seg.connectionDash === style || (!seg.connectionDash && style === 'solid')) 
                                                                ? 'border-[var(--accent)] bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]' 
                                                                : 'border-[var(--border)] hover:bg-[var(--input-bg)]'}
                                                        `}
                                                        title={style}
                                                    >
                                                        <div className="transform scale-75 origin-center">
                                                            {DashIcons[style]}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <details className="pl-10">
                        <summary className="text-xs opacity-50 hover:text-[var(--accent)] cursor-pointer select-none transition-colors text-[var(--text)]">{t.tooltipSettings}</summary>
                        <div className="pt-2 grid gap-2">
                            <input className={`${inputClass} py-1`} placeholder="Title" value={seg.tooltip?.title || ''} onChange={e => onUpdate(idx, 'tooltip.title', e.target.value)} />
                            <select className={`${inputClass} py-1`} value={seg.tooltip?.contentType || 'markdown'} onChange={e => onUpdate(idx, 'tooltip.contentType', e.target.value)}>
                                <option value="markdown">Markdown</option>
                                <option value="latex">LaTeX</option>
                                <option value="svg">SVG</option>
                            </select>
                            <textarea className={`${inputClass} py-1`} rows="2" placeholder="Content..." value={seg.tooltip?.content || ''} onChange={e => onUpdate(idx, 'tooltip.content', e.target.value)} />
                        </div>
                    </details>
                </div>
            ))}
            <button className="btn w-full border-dashed border-[var(--border)] text-[var(--muted)] hover:bg-[var(--panel-bg)] hover:text-[var(--text)] hover:border-[var(--text)] transition-all" onClick={onAdd}>
                <i className="ri-add-line"></i> {t.addSegment}
            </button>
        </div>
    );
};

export default SegmentList;
