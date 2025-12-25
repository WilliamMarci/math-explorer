import React, { useState, useMemo } from 'react';
import { COLORS, NODE_TYPES } from '../theme';
import { InteractiveMath, RichViewer } from './Common';

const ColorPalette = ({ selectedColor, onSelect, size = 'md' }) => (
    <div className="flex gap-1.5 flex-wrap content-start">
        {COLORS.map(c => (
            <div 
                key={c} 
                className={`
                    rounded cursor-pointer border-2 transition-transform hover:scale-110
                    ${selectedColor === c ? 'border-[var(--text)] scale-110' : 'border-transparent'}
                    ${size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'}
                `} 
                style={{ background: c }} 
                onClick={() => onSelect(c)} 
            />
        ))}
        <label className={`
            relative rounded cursor-pointer border flex items-center justify-center overflow-hidden hover:opacity-80
            bg-[var(--input-bg)] border-[var(--border)]
            ${size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'}
        `}>
            <span className="text-[var(--text)] opacity-50 text-xs">+</span>
            <input 
                type="color" 
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                value={selectedColor || '#000000'}
                onChange={(e) => onSelect(e.target.value)}
            />
        </label>
    </div>
);

const NodeEditor = ({ node, content, onClose, onSave, onDelete, lang, existingIds, I18N }) => {
    const t = I18N[lang];
    const [contentId, setContentId] = useState(node.contentId);
    const [data, setData] = useState({
        title: content.title || "", 
        type: content.type || "default", 
        template: content.template || "", 
        note: content.note || "",
        segments: Object.entries(content.segments || {}).map(([key, val]) => ({ key, ...val }))
    });
    const [color, setColor] = useState(node.color || COLORS[0]);

    const previewSegments = useMemo(() => {
        return data.segments.reduce((acc, seg) => {
            acc[seg.key] = seg;
            return acc;
        }, {});
    }, [data.segments]);

    const handleSave = () => {
        if (!/^[a-zA-Z0-9_]+$/.test(contentId)) { alert("ID must contain only letters, numbers, and underscores."); return; }
        if (contentId !== node.contentId && existingIds.includes(contentId)) { alert("ID already exists."); return; }
        
        const segObj = {};
        data.segments.forEach(s => { const { key, ...rest } = s; segObj[key] = rest; });
        onSave(node.id, contentId, { ...data, segments: segObj }, color);
    };

    const updateSegment = (idx, field, val) => {
        const newSegs = [...data.segments];
        if (field.includes('.')) { 
            const [p, c] = field.split('.'); 
            if (!newSegs[idx][p]) newSegs[idx][p] = {}; 
            newSegs[idx][p][c] = val; 
        } else { 
            newSegs[idx][field] = val; 
        }
        setData({ ...data, segments: newSegs });
    };

    const inputClass = "w-full px-3 py-2 rounded text-sm outline-none transition-colors bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] focus:border-[var(--accent)]";

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className="editor-modal flex flex-col max-h-[90vh] w-[900px] rounded-xl overflow-hidden shadow-2xl border border-[var(--border)]" 
                onClick={e => e.stopPropagation()}
                style={{ backgroundColor: 'var(--panel-bg)', color: 'var(--text)' }}
            >
                {/* Header */}
                <div className="px-6 py-4 flex justify-between items-center shrink-0 border-b border-[var(--border)]" style={{ backgroundColor: 'var(--panel-bg)' }}>
                    <h3 className="text-lg font-bold flex items-center gap-2 select-none text-[var(--text)]">
                        <i className="ri-edit-circle-line text-[var(--accent)]"></i> {t.editNode}
                    </h3>
                    <button onClick={onClose} className="text-[var(--muted)] hover:text-red-500 transition-colors">
                        <i className="ri-close-line text-2xl"></i>
                    </button>
                </div>
                
                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6" style={{ backgroundColor: 'var(--panel-bg)' }}>
                    
                    {/* Live Preview */}
                    <div className="w-full rounded-lg p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[160px] shrink-0 border border-[var(--border)]"
                         style={{ backgroundColor: 'var(--bg)' }}>
                        
                        <div className="absolute inset-0 opacity-50 pointer-events-none" 
                             style={{ backgroundImage: 'linear-gradient(to right, var(--grid) 1px, transparent 1px), linear-gradient(to bottom, var(--grid) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                        </div>
                        
                        {/* UPDATED: 使用 t.livePreview */}
                        <div className="absolute top-2 left-3 text-[10px] font-bold text-[var(--text)] opacity-30 uppercase tracking-widest pointer-events-none">{t.livePreview}</div>
                        
                        <div className={`math-card node-type-${data.type} z-10 shadow-lg`} style={{ '--node-color': color, transform: 'scale(1)' }}>
                            <div className="node-header">
                                {data.type !== 'default' && data.type !== 'note' && (
                                    <span className="type-badge" style={{ backgroundColor: color }}>{I18N[lang]?.types[data.type] || data.type}</span>
                                )}
                                <RichViewer content={data.title || "Untitled"} className="node-title" inline={true} />
                            </div>
                            <div className="node-body">
                                {data.type !== 'note' && <InteractiveMath template={data.template} segments={previewSegments} nodeId="preview" onToggle={() => {}} onHover={() => {}} />}
                                {data.note && <RichViewer content={data.note} type="markdown" />}
                            </div>
                        </div>
                    </div>

                    {/* Form Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold mb-1 opacity-70 uppercase text-[var(--text)]">{t.title}</label>
                                <input className={inputClass} value={data.title} onChange={e => setData({...data, title: e.target.value})} />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1 flex flex-col gap-4">
                                    <div>
                                        <label className="block text-xs font-bold mb-1 opacity-70 uppercase text-[var(--text)]">{t.id}</label>
                                        <input className={`${inputClass} font-mono font-bold !text-[var(--accent)]`} value={contentId} onChange={e => setContentId(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 opacity-70 uppercase text-[var(--text)]">{t.type}</label>
                                        <select className={inputClass} value={data.type} onChange={e => setData({...data, type: e.target.value})}>
                                            {NODE_TYPES.map(type => <option key={type} value={type}>{t.types[type]}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="w-36 flex flex-col">
                                    <label className="block text-xs font-bold mb-1 opacity-70 uppercase text-[var(--text)]">{t.color}</label>
                                    <div className="flex-1 p-3 rounded border border-[var(--border)] bg-[var(--input-bg)]">
                                        <ColorPalette selectedColor={color} onSelect={setColor} size="sm" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold mb-1 opacity-70 uppercase text-[var(--text)]">{t.template}</label>
                                <textarea className={`${inputClass} font-mono text-sm h-24`} value={data.template} onChange={e => setData({...data, template: e.target.value})} placeholder="\frac{ {{0}} }{ {{1}} }" />
                                {data.type === 'note' && <div className="text-xs text-orange-500 mt-1">Leave template empty for a pure sticky note.</div>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold mb-1 opacity-70 uppercase text-[var(--text)]">{t.note}</label>
                                <textarea className={`${inputClass} font-mono`} rows="4" value={data.note} onChange={e => setData({...data, note: e.target.value})} />
                            </div>
                        </div>

                        {/* Right Column: Segments */}
                        <div className="flex flex-col h-full">
                            <label className="block text-xs font-bold mb-1 opacity-70 uppercase text-[var(--text)]">{t.segments}</label>
                            
                            <div className="space-y-3 p-4 rounded border border-[var(--border)] bg-[var(--input-bg)] flex-1 overflow-y-auto min-h-[400px]">
                                {data.segments.length === 0 && (
                                    <div className="text-center opacity-40 text-xs py-8 italic select-none text-[var(--text)]">No segments defined.</div>
                                )}
                                
                                {data.segments.map((seg, idx) => (
                                    <div key={idx} className="p-3 rounded shadow-sm text-sm border border-[var(--border)] bg-[var(--panel-bg)]">
                                        <div className="flex gap-2 mb-2 items-center">
                                            <span className="font-mono font-bold text-xs px-2 py-1 rounded select-none bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]">{'{{' + seg.key + '}}'}</span>
                                            <input className={`${inputClass} py-1`} placeholder="LaTeX" value={seg.text} onChange={e => updateSegment(idx, 'text', e.target.value)} />
                                            <select className={`${inputClass} w-24 py-1`} value={seg.type} onChange={e => updateSegment(idx, 'type', e.target.value)}>
                                                <option value="text">Text</option><option value="link">Link</option>
                                            </select>
                                            <button className="text-red-400 hover:text-red-600 px-2 transition-colors" onClick={() => setData({...data, segments: data.segments.filter((_, i) => i !== idx)})}><i className="ri-delete-bin-line"></i></button>
                                        </div>
                                        
                                        {seg.type === 'link' && (
                                            <div className="mb-3 pl-10 border-l-2 border-[var(--accent)] ml-2">
                                                <div className="mb-2">
                                                    <label className="text-xs font-bold opacity-40 uppercase text-[var(--text)]">Target ID</label>
                                                    <input className={`${inputClass} py-1`} placeholder="Target Content ID" value={seg.target || ''} onChange={e => updateSegment(idx, 'target', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold opacity-40 uppercase mb-1 block text-[var(--text)]">Link Color</label>
                                                    <ColorPalette selectedColor={seg.color} onSelect={(c) => updateSegment(idx, 'color', c)} size="sm" />
                                                </div>
                                            </div>
                                        )}
                                        
                                        <details className="pl-10">
                                            <summary className="text-xs opacity-50 hover:text-[var(--accent)] cursor-pointer select-none transition-colors text-[var(--text)]">{t.tooltipSettings}</summary>
                                            <div className="pt-2 grid gap-2">
                                                <input className={`${inputClass} py-1`} placeholder="Title" value={seg.tooltip?.title || ''} onChange={e => updateSegment(idx, 'tooltip.title', e.target.value)} />
                                                <select className={`${inputClass} py-1`} value={seg.tooltip?.contentType || 'markdown'} onChange={e => updateSegment(idx, 'tooltip.contentType', e.target.value)}>
                                                    <option value="markdown">Markdown</option>
                                                    <option value="latex">LaTeX</option>
                                                    <option value="svg">SVG</option>
                                                </select>
                                                <textarea className={`${inputClass} py-1`} rows="2" placeholder="Content..." value={seg.tooltip?.content || ''} onChange={e => updateSegment(idx, 'tooltip.content', e.target.value)} />
                                            </div>
                                        </details>
                                    </div>
                                ))}
                                <button className="btn w-full border-dashed border-[var(--border)] text-[var(--muted)] hover:bg-[var(--panel-bg)] hover:text-[var(--text)] hover:border-[var(--text)] transition-all" onClick={() => setData({...data, segments: [...data.segments, { key: data.segments.length.toString(), text: "?", type: "text" }]})}>
                                    <i className="ri-add-line"></i> {t.addSegment}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 flex justify-between items-center shrink-0 border-t border-[var(--border)]" style={{ backgroundColor: 'var(--panel-bg)' }}>
                    <button className="btn bg-transparent text-red-500 border border-red-500 hover:bg-red-500 hover:text-white transition-colors" onClick={() => onDelete(node.id)}>{t.delete}</button>
                    <div className="flex gap-3">
                        <button className="btn bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)] hover:brightness-95" onClick={onClose}>{t.cancel}</button>
                        <button className="btn btn-primary bg-[var(--accent)] text-white border-none hover:brightness-110" onClick={handleSave}>{t.save}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NodeEditor;