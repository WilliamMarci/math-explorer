import React, { useState, useMemo } from 'react';
import { COLORS, NODE_TYPES } from '../../theme';
import { InteractiveMath, RichViewer } from '../Common';
import ColorPalette from '../UI/ColorPalette';
import SegmentList from '../UI/SegmentList';
import Icon from '../UI/Icon';
import { usePanelResize } from '../../hooks/usePanelResize';

const NodeEditor = ({ node, content, onClose, onSave, onDelete, lang, existingIds, I18N, settings, icons }) => {
    const t = I18N[lang];
    const [contentId, setContentId] = useState(node.contentId);
    const isPixelMode = settings?.pixelMode;
    const { width, handleMouseDown } = usePanelResize(900, 600, 1400, 'right');
    
    const [data, setData] = useState({
        title: content.title || "", 
        type: content.type || "default", 
        template: content.template || "", 
        note: content.note || "",
        tags: content.tags || [],
        folder: content.folder || "",
        segments: Object.entries(content.segments || {}).map(([key, val]) => ({ 
            key, 
            ...val,
            // 自动检测是否展开
            _connSettingsOpen: !!(val.connectionLabel || val.connectionStyle || val.connectionDash || val.connectionMarker)
        }))
    });
    const [color, setColor] = useState(node.color || COLORS[0]);

    const previewSegments = useMemo(() => {
        return data.segments.reduce((acc, seg) => {
            if (seg.key) acc[seg.key] = seg;
            return acc;
        }, {});
    }, [data.segments]);

    const handleSave = () => {
        if (!/^[a-zA-Z0-9_]+$/.test(contentId)) { alert("ID must contain only letters, numbers, and underscores."); return; }
        if (contentId !== node.contentId && existingIds.includes(contentId)) { alert("ID already exists."); return; }
        
        const segObj = {};
        const seenKeys = new Set();
        for (const s of data.segments) {
            if (!s.key) continue;
            if (seenKeys.has(s.key)) {
                alert(`Duplicate segment key: ${s.key}`);
                return;
            }
            seenKeys.add(s.key);
            
            const { key, _connSettingsOpen, ...rest } = s; 
        
            if (!_connSettingsOpen) {
                delete rest.connectionLabel;
                delete rest.connectionStyle;
                delete rest.connectionDash;
                delete rest.connectionMarker;
            }
            // -------------------------------------------

            segObj[key] = rest; 
        }
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
        <div className="modal-overlay">
            <div 
                className="editor-modal flex flex-col max-h-[90vh] rounded-xl overflow-hidden shadow-2xl border border-[var(--border)] relative" 
                onClick={e => e.stopPropagation()}
                style={{ backgroundColor: 'var(--panel-bg)', color: 'var(--text)', width }}
            >
                <div 
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-[var(--accent)] z-10 transition-colors"
                    onMouseDown={handleMouseDown}
                ></div>

                {/* Header */}
                <div className="px-6 py-4 flex justify-between items-center shrink-0 border-b border-[var(--border)]" style={{ backgroundColor: 'var(--panel-bg)' }}>
                    <h3 className="text-lg font-bold flex items-center gap-2 select-none text-[var(--text)]">
                        <Icon icon={icons?.editCircle} className="text-[var(--accent)]" /> {t.editNode}
                    </h3>
                    <button onClick={onClose} className="text-[var(--muted)] hover:text-red-500 transition-colors">
                        <Icon icon={icons?.close} className="text-2xl" />
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
                                {data.note && <RichViewer content={data.note} type="markdown" className="text-[var(--text)]" />}
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

                            {data.type !== 'note' && (
                            <div>
                                <label className="block text-xs font-bold mb-1 opacity-70 uppercase text-[var(--text)]">{t.template}</label>
                                <textarea className={`${inputClass} font-mono text-sm h-24`} value={data.template} onChange={e => setData({...data, template: e.target.value})} placeholder="\frac{ {{num}} }{ {{den}} }" />
                            </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold mb-1 opacity-70 uppercase text-[var(--text)]">{t.note}</label>
                                <textarea className={`${inputClass} font-mono`} rows="4" value={data.note} onChange={e => setData({...data, note: e.target.value})} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold mb-1 opacity-70 uppercase text-[var(--text)]">{t.tags || "Tags"}</label>
                                <input 
                                    className={inputClass} 
                                    value={data.tags.join(', ')} 
                                    onChange={e => setData({...data, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} 
                                    placeholder="tag1, tag2" 
                                />
                            </div>
                        </div>

                        {/* Right Column: Segments */}
                        <div className="flex flex-col h-full">
                            <label className="block text-xs font-bold mb-1 opacity-70 uppercase text-[var(--text)]">{t.segments}</label>
                            
                            <SegmentList 
                                segments={data.segments} 
                                onUpdate={updateSegment} 
                                onDelete={(idx) => setData({...data, segments: data.segments.filter((_, i) => i !== idx)})}
                                onAdd={() => setData({...data, segments: [...data.segments, { key: data.segments.length.toString(), text: "?", type: "text" }]})}
                                t={t}
                                settings={settings}
                                icons={icons}
                            />
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