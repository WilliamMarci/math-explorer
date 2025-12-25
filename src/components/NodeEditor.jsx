import React, { useState } from 'react';
import { COLORS, NODE_TYPES } from '../theme';

// Reusable Color Palette Component
const ColorPalette = ({ selectedColor, onSelect, size = 'md' }) => (
    <div className="flex gap-1.5 flex-wrap">
        {COLORS.map(c => (
            <div 
                key={c} 
                className={`
                    rounded cursor-pointer border-2 transition-transform hover:scale-110
                    ${selectedColor === c ? 'border-gray-900 scale-110' : 'border-transparent'}
                    ${size === 'sm' ? 'w-5 h-5' : 'w-8 h-8'}
                `} 
                style={{ background: c }} 
                onClick={() => onSelect(c)} 
                title={c}
            />
        ))}
        {/* Custom Color Input disguised as a swatch */}
        <label className={`
            relative rounded cursor-pointer border-2 border-gray-200 flex items-center justify-center overflow-hidden
            ${size === 'sm' ? 'w-5 h-5' : 'w-8 h-8'}
        `}>
            <span className="text-gray-400 text-xs">+</span>
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
        title: content.title || "", type: content.type || "default", template: content.template || "", note: content.note || "",
        segments: Object.entries(content.segments || {}).map(([key, val]) => ({ key, ...val }))
    });
    const [color, setColor] = useState(node.color || COLORS[0]);

    const handleSave = () => {
        if (!/^[a-zA-Z0-9_]+$/.test(contentId)) { alert("ID must contain only letters, numbers, and underscores."); return; }
        if (contentId !== node.contentId && existingIds.includes(contentId)) { alert("ID already exists."); return; }
        const segObj = {};
        data.segments.forEach(s => { const { key, ...rest } = s; segObj[key] = rest; });
        onSave(node.id, contentId, { ...data, segments: segObj }, color);
    };

    const updateSegment = (idx, field, val) => {
        const newSegs = [...data.segments];
        if (field.includes('.')) { const [p, c] = field.split('.'); if (!newSegs[idx][p]) newSegs[idx][p] = {}; newSegs[idx][p][c] = val; } 
        else { newSegs[idx][field] = val; }
        setData({ ...data, segments: newSegs });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="editor-modal" onClick={e => e.stopPropagation()}>
                <div className="editor-header">
                    <h3 className="text-lg font-bold flex items-center gap-2"><i className="ri-edit-circle-line text-blue-600"></i> {t.editNode}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500"><i className="ri-close-line text-2xl"></i></button>
                </div>
                
                <div className="editor-body grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-5">
                        <div>
                            <label className="label-text">{t.id}</label>
                            <input className="input-field font-mono font-bold text-blue-700" value={contentId} onChange={e => setContentId(e.target.value)} />
                            <div className="text-xs text-gray-400 mt-1">{t.idHelp}</div>
                        </div>
                        <div>
                            <label className="label-text">{t.title}</label>
                            <input className="input-field" value={data.title} onChange={e => setData({...data, title: e.target.value})} />
                        </div>
                        
                        <div className="p-4 bg-slate-50 rounded border border-slate-100">
                            <label className="label-text mt-0 mb-2">{t.type}</label>
                            <select className="input-field mb-4" value={data.type} onChange={e => setData({...data, type: e.target.value})}>
                                {NODE_TYPES.map(type => <option key={type} value={type}>{t.types[type]}</option>)}
                            </select>

                            <label className="label-text mt-0 mb-2">{t.color}</label>
                            <ColorPalette selectedColor={color} onSelect={setColor} size="md" />
                            <div className="text-xs text-gray-400 mt-2">
                                Changing this color will update parent links pointing to this node.
                            </div>
                        </div>

                        <div>
                            <label className="label-text">{t.template}</label>
                            <textarea className="input-field font-mono text-sm h-32" value={data.template} onChange={e => setData({...data, template: e.target.value})} placeholder="\frac{ {{0}} }{ {{1}} }" />
                            {data.type === 'note' && <div className="text-xs text-orange-500 mt-1">Leave template empty for a pure sticky note.</div>}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <label className="label-text">{t.segments}</label>
                        <div className="space-y-3 bg-slate-50 p-4 rounded border border-slate-200 max-h-[500px] overflow-y-auto">
                            {data.segments.map((seg, idx) => (
                                <div key={idx} className="p-3 border rounded bg-white shadow-sm text-sm">
                                    <div className="flex gap-2 mb-2 items-center">
                                        <span className="font-mono font-bold text-xs bg-slate-200 px-2 py-1 rounded">{'{{' + seg.key + '}}'}</span>
                                        <input className="input-field py-1" placeholder="LaTeX" value={seg.text} onChange={e => updateSegment(idx, 'text', e.target.value)} />
                                        <select className="input-field w-24 py-1" value={seg.type} onChange={e => updateSegment(idx, 'type', e.target.value)}>
                                            <option value="text">Text</option><option value="link">Link</option>
                                        </select>
                                        <button className="text-red-400 hover:text-red-600 px-2" onClick={() => setData({...data, segments: data.segments.filter((_, i) => i !== idx)})}><i className="ri-delete-bin-line"></i></button>
                                    </div>
                                    
                                    {/* Link Settings */}
                                    {seg.type === 'link' && (
                                        <div className="mb-3 pl-10 border-l-2 border-blue-100 ml-2">
                                            <div className="mb-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase">Target ID</label>
                                                <input className="input-field py-1" placeholder="Target Content ID" value={seg.target || ''} onChange={e => updateSegment(idx, 'target', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Link Color</label>
                                                <ColorPalette selectedColor={seg.color} onSelect={(c) => updateSegment(idx, 'color', c)} size="sm" />
                                            </div>
                                        </div>
                                    )}

                                    <details className="pl-10"><summary className="text-xs text-gray-500 hover:text-blue-500 cursor-pointer">{t.tooltipSettings}</summary><div className="pt-2 grid gap-2"><input className="input-field py-1" placeholder="Title" value={seg.tooltip?.title || ''} onChange={e => updateSegment(idx, 'tooltip.title', e.target.value)} /><select className="input-field py-1" value={seg.tooltip?.contentType || 'markdown'} onChange={e => updateSegment(idx, 'tooltip.contentType', e.target.value)}><option value="markdown">Markdown</option><option value="latex">LaTeX</option><option value="svg">SVG</option></select><textarea className="input-field py-1" rows="2" placeholder="Content..." value={seg.tooltip?.content || ''} onChange={e => updateSegment(idx, 'tooltip.content', e.target.value)} /></div></details>
                                </div>
                            ))}
                            <button className="btn w-full border-dashed" onClick={() => setData({...data, segments: [...data.segments, { key: data.segments.length.toString(), text: "?", type: "text" }]})}><i className="ri-add-line"></i> {t.addSegment}</button>
                        </div>
                        <div>
                            <label className="label-text">{t.note}</label>
                            <textarea className="input-field font-mono" rows="4" value={data.note} onChange={e => setData({...data, note: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="editor-footer">
                    <button className="btn btn-danger" onClick={() => onDelete(node.id)}>{t.delete}</button>
                    <div className="flex gap-3">
                        <button className="btn" onClick={onClose}>{t.cancel}</button>
                        <button className="btn btn-primary" onClick={handleSave}>{t.save}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NodeEditor;