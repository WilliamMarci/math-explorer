import React, { useEffect, useRef } from 'react';

const ContextMenu = ({ x, y, type, visible, onAction, onClose, hasClipboard, lang = 'en' }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        // Close on window resize or scroll or click outside
        window.addEventListener('click', handleClickOutside);
        window.addEventListener('resize', onClose);
        window.addEventListener('scroll', onClose);
        return () => {
            window.removeEventListener('click', handleClickOutside);
            window.removeEventListener('resize', onClose);
            window.removeEventListener('scroll', onClose);
        };
    }, [onClose]);

    if (!visible) return null;

    const t = {
        en: {
            new: "New Node",
            refresh: "Refresh View",
            collapse: "Collapse All",
            paste: "Paste Node",
            copy: "Copy",
            cut: "Cut",
            edit: "Edit Content",
            hide: "Hide Branch",
            delete: "Delete",
            connectPaste: "Paste & Connect"
        },
        zh: {
            new: "新建节点",
            refresh: "刷新视图",
            collapse: "折叠全部",
            paste: "粘贴节点",
            copy: "复制",
            cut: "剪切",
            edit: "编辑内容",
            hide: "隐藏分支",
            delete: "删除",
            connectPaste: "粘贴并连接"
        }
    };

    const labels = t[lang] || t.en;

    // Adjust position to not overflow screen
    const style = {
        top: y,
        left: x,
    };
    
    // Basic boundary detection
    if (typeof window !== 'undefined') {
        if (window.innerHeight - y < 280) style.top = y - 280; // Shift up if close to bottom
        if (window.innerWidth - x < 180) style.left = x - 180; // Shift left if close to right
    }

    return (
        <div 
            ref={menuRef} 
            className="context-menu"
            style={style}
            onContextMenu={(e) => e.preventDefault()} // Prevent browser menu on custom menu
        >
            {type === 'canvas' ? (
                /* --- Canvas Context Menu --- */
                <>
                    <div className="context-menu-item" onClick={() => onAction('new')}>
                        <span>{labels.new}</span>
                        <span className="opacity-50 text-xs">N</span>
                    </div>
                    <div className="context-menu-item" onClick={() => onAction('refresh')}>
                        <span>{labels.refresh}</span>
                        <span className="opacity-50 text-xs">R</span>
                    </div>
                    <div className="context-divider"></div>
                    <div className="context-menu-item" onClick={() => onAction('collapse')}>
                        <span>{labels.collapse}</span>
                    </div>
                    <div 
                        className={`context-menu-item ${!hasClipboard ? 'disabled' : ''}`} 
                        onClick={() => hasClipboard && onAction('paste')}
                    >
                        <span>{labels.paste}</span>
                        <span className="opacity-50 text-xs">Ctrl+V</span>
                    </div>
                </>
            ) : (
                /* --- Node Context Menu --- */
                <>
                    <div className="context-menu-item" onClick={() => onAction('copy')}>
                        <span>{labels.copy}</span>
                        <span className="opacity-50 text-xs">Ctrl+C</span>
                    </div>
                    <div className="context-menu-item" onClick={() => onAction('cut')}>
                        <span>{labels.cut}</span>
                        <span className="opacity-50 text-xs">Ctrl+X</span>
                    </div>
                    <div 
                        className={`context-menu-item ${!hasClipboard ? 'disabled' : ''}`} 
                        onClick={() => hasClipboard && onAction('paste_connect')}
                    >
                        <span>{labels.connectPaste}</span>
                    </div>
                    <div className="context-divider"></div>
                    <div className="context-menu-item" onClick={() => onAction('edit')}>
                        <span>{labels.edit}</span>
                        <span className="opacity-50 text-xs">DblClick</span>
                    </div>
                    <div className="context-menu-item" onClick={() => onAction('hide')}>
                        <span>{labels.hide}</span>
                    </div>
                    <div className="context-divider"></div>
                    <div className="context-menu-item danger" onClick={() => onAction('delete')}>
                        <span>{labels.delete}</span>
                        <span className="opacity-50 text-xs">Del</span>
                    </div>
                </>
            )}
        </div>
    );
};

export default ContextMenu;