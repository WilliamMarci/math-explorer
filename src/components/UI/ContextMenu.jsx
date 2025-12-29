import React, { useEffect, useRef } from 'react';
import Icon from './Icon';
import { useMenuPosition } from '../../hooks/useMenuPosition';

const ContextMenu = ({ x, y, type, visible, onAction, onClose, hasClipboard, lang = 'en', selectedCount = 0, settings, icons }) => {
    const menuRef = useRef(null);
    const isPixelMode = settings?.pixelMode;
    const position = useMenuPosition(menuRef, visible, x, y);

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
            delete: "Delete",
            align: "Align",
            alignLeft: "Left",
            alignRight: "Right",
            alignTop: "Top",
            alignBottom: "Bottom",
            alignCenterH: "Center H",
            alignCenterV: "Center V",
            distributeH: "Distribute H",
            distributeV: "Distribute V"
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
            delete: "删除",
            align: "对齐与分布",
            alignLeft: "左对齐",
            alignRight: "右对齐",
            alignTop: "顶对齐",
            alignBottom: "底对齐",
            alignCenterH: "水平居中",
            alignCenterV: "垂直居中",
            distributeH: "水平分布",
            distributeV: "垂直分布"
        }
    };

    const labels = t[lang] || t.en;

    // Adjust position to not overflow screen
    const style = {
        position: 'fixed', // Ensure fixed positioning relative to viewport
        zIndex: 9999, // Ensure it's on top
        top: position.top,
        left: position.left
    };
    
    // Smart boundary detection removed here as it is handled in useEffect

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
                        <span className="flex items-center gap-2"><Icon icon={icons?.add} /> {labels.new}</span>
                        <span className="opacity-50 text-xs">N</span>
                    </div>
                    <div className="context-menu-item" onClick={() => onAction('refresh')}>
                        <span className="flex items-center gap-2"><Icon icon={icons?.refresh} /> {labels.refresh}</span>
                        <span className="opacity-50 text-xs">R</span>
                    </div>
                    <div className="context-divider"></div>
                    <div className="context-menu-item" onClick={() => onAction('expand_all')}>
                        <span className="flex items-center gap-2"><Icon icon={icons?.expandAll} /> {labels.expandAll || "Expand All"}</span>
                    </div>
                    <div className="context-menu-item" onClick={() => onAction('collapse')}>
                        <span className="flex items-center gap-2"><Icon icon={icons?.collapse} /> {labels.collapse}</span>
                    </div>
                    <div 
                        className={`context-menu-item ${!hasClipboard ? 'disabled' : ''}`} 
                        onClick={() => hasClipboard && onAction('paste')}
                    >
                        <span className="flex items-center gap-2"><Icon icon={icons?.paste} /> {labels.paste}</span>
                        <span className="opacity-50 text-xs">Ctrl+V</span>
                    </div>
                </>
            ) : (
                /* --- Node Context Menu --- */
                <>
                    {selectedCount > 1 && (
                        <>
                            <div className="context-menu-header text-xs font-bold px-3 py-1 text-gray-500 uppercase tracking-wider">
                                {labels.align}
                            </div>
                            <div className="grid grid-cols-4 gap-1 px-2 pb-2">
                                <button className="p-1 hover:bg-gray-100 rounded text-xs border" onClick={() => onAction('align_left')} title={labels.alignLeft}>
                                    <Icon icon={icons?.alignLeft} />
                                </button>
                                <button className="p-1 hover:bg-gray-100 rounded text-xs border" onClick={() => onAction('align_center_h')} title={labels.alignCenterH}>
                                    <Icon icon={icons?.alignCenterH} />
                                </button>
                                <button className="p-1 hover:bg-gray-100 rounded text-xs border" onClick={() => onAction('align_right')} title={labels.alignRight}>
                                    <Icon icon={icons?.alignRight} />
                                </button>
                                <button className="p-1 hover:bg-gray-100 rounded text-xs border" onClick={() => onAction('distribute_h')} title={labels.distributeH}>
                                    <Icon icon={icons?.distributeH} />
                                </button>

                                <button className="p-1 hover:bg-gray-100 rounded text-xs border" onClick={() => onAction('align_top')} title={labels.alignTop}>
                                    <Icon icon={icons?.alignTop} />
                                </button>
                                <button className="p-1 hover:bg-gray-100 rounded text-xs border" onClick={() => onAction('align_center_v')} title={labels.alignCenterV}>
                                    <Icon icon={icons?.alignCenterV} />
                                </button>
                                <button className="p-1 hover:bg-gray-100 rounded text-xs border" onClick={() => onAction('align_bottom')} title={labels.alignBottom}>
                                    <Icon icon={icons?.alignBottom} />
                                </button>
                                <button className="p-1 hover:bg-gray-100 rounded text-xs border" onClick={() => onAction('distribute_v')} title={labels.distributeV}>
                                    <Icon icon={icons?.distributeV} />
                                </button>
                            </div>
                            <div className="context-divider"></div>
                        </>
                    )}

                    <div className="context-menu-item" onClick={() => onAction('copy')}>
                        <span className="flex items-center gap-2"><Icon icon={icons?.copy} /> {labels.copy}</span>
                        <span className="opacity-50 text-xs">Ctrl+C</span>
                    </div>
                    <div className="context-menu-item" onClick={() => onAction('cut')}>
                        <span className="flex items-center gap-2"><Icon icon={icons?.cut} /> {labels.cut}</span>
                        <span className="opacity-50 text-xs">Ctrl+X</span>
                    </div>
                    <div className="context-divider"></div>
                    <div className="context-menu-item" onClick={() => onAction('edit')}>
                        <span className="flex items-center gap-2"><Icon icon={icons?.edit} /> {labels.edit}</span>
                        <span className="opacity-50 text-xs">DblClick</span>
                    </div>
                    <div className="context-menu-item" onClick={() => onAction('hide')}>
                        <span className="flex items-center gap-2"><Icon icon={icons?.hide} /> {labels.hide}</span>
                    </div>
                    <div className="context-divider"></div>
                    <div className="context-menu-item danger" onClick={() => onAction('delete')}>
                        <span className="flex items-center gap-2"><Icon icon={icons?.delete} /> {labels.delete}</span>
                        <span className="opacity-50 text-xs">Del</span>
                    </div>
                </>
            )}
        </div>
    );
};

export default ContextMenu;