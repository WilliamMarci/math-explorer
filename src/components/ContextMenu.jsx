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
            expandAll: "Expand All",
            collapse: "Collapse All",
            paste: "Paste Node",
            copy: "Copy",
            cut: "Cut",
            edit: "Edit Content",
            hide: "Hide Branch",
            delete: "Delete"
        },
        zh: {
            new: "新建节点",
            refresh: "刷新视图",
            expandAll: "展开全部",
            collapse: "折叠全部",
            paste: "粘贴节点",
            copy: "复制",
            cut: "剪切",
            edit: "编辑内容",
            hide: "隐藏分支",
            delete: "删除"
        }
    };

    const labels = t[lang] || t.en;

    // Adjust position to not overflow screen
    const style = {
        position: 'fixed', // Ensure fixed positioning relative to viewport
        zIndex: 9999 // Ensure it's on top
    };
    
    // Smart boundary detection
    if (typeof window !== 'undefined') {
        const estimatedWidth = 200;
        const estimatedHeight = 300;
        
        // Horizontal: if close to right edge, align right to x
        if (x + estimatedWidth > window.innerWidth) {
            style.left = 'auto';
            style.right = window.innerWidth - x;
        } else {
            style.left = x;
            style.right = 'auto';
        }

        // Vertical: if close to bottom edge, align bottom to y
        if (y + estimatedHeight > window.innerHeight) {
            style.top = 'auto';
            style.bottom = window.innerHeight - y;
        } else {
            style.top = y;
            style.bottom = 'auto';
        }
    } else {
        style.top = y;
        style.left = x;
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
                    <div className="context-menu-item" onClick={() => onAction('expand_all')}>
                        <span>{labels.expandAll || "Expand All"}</span>
                    </div>
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