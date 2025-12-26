import React, { useState, useEffect } from 'react';
import Icon from './Icon';

const ExportModal = ({ isOpen, onClose, onConfirm, defaultName = "scene", lang = 'en', settings, icons }) => {
    const [fileName, setFileName] = useState(defaultName);
    const [format, setFormat] = useState('json');
    const isPixelMode = settings?.pixelMode;

    useEffect(() => {
        if (isOpen) {
            setFileName(defaultName);
            setFormat('json');
        }
    }, [isOpen, defaultName]);

    if (!isOpen) return null;

    const texts = {
        en: { title: "Export Scene", label: "File Name", format: "Format", cancel: "Cancel", confirm: "Export", placeholder: "Enter filename..." },
        zh: { title: "导出场景", label: "文件名", format: "格式", cancel: "取消", confirm: "导出", placeholder: "请输入文件名..." }
    };
    const t = texts[lang] || texts.en;

    const handleConfirm = () => {
        onConfirm(fileName, format);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-2xl w-96 p-6 border border-slate-200 transform transition-all scale-100">
                <h3 className="text-lg font-bold mb-4 text-slate-800">{t.title}</h3>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                        {t.label}
                    </label>
                    <div className="flex items-center shadow-sm rounded-md">
                        <input 
                            type="text" 
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder={t.placeholder}
                            autoFocus
                        />
                        <span className="px-3 py-2 bg-slate-100 border border-l-0 border-slate-300 rounded-r-md text-slate-500 text-sm font-mono">
                            .{format === 'json' ? 'mathmap' : format}
                        </span>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                        {t.format}
                    </label>
                    <select 
                        value={format} 
                        onChange={(e) => setFormat(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                    >
                        <option value="json">MathMap (JSON)</option>
                        <option value="png">Image (PNG)</option>
                        <option value="svg">Vector (SVG)</option>
                    </select>
                </div>

                <div className="flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                    >
                        {t.cancel}
                    </button>
                    <button 
                        onClick={handleConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                    >
                        {t.confirm}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;