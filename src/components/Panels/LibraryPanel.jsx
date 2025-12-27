import React, { useState, useMemo, useRef, useEffect } from 'react';
import Icon from '../UI/Icon';
import { COLORS } from '../../theme';
import { InteractiveMath } from '../Common';
import NodeTemplateEditor from '../Modals/NodeTemplateEditor';
import InputModal from '../Modals/InputModal';
import ConfirmModal from '../Modals/ConfirmModal';
import { usePanelResize } from '../../hooks/usePanelResize';
import { I18N } from '../../constants';

const FileItem = ({ file, viewMode, onDragStart, onContextMenu, hoverClass, icons }) => {
    const { content, cId } = file;
    
    // Type indicator style
    const getTypeStyle = (type) => {
        switch (type) {
            case 'axiom': return { borderLeft: `3px solid ${COLORS[1]}` };
            case 'constant': return { borderLeft: `3px solid ${COLORS[2]}` };
            case 'parameter': return { borderLeft: `3px solid ${COLORS[3]}` };
            case 'note': return { borderLeft: `3px solid ${COLORS[4]}` };
            default: return { borderLeft: `3px solid ${content.color || COLORS[0]}` };
        }
    };

    if (viewMode === 'grid') {
        return (
            <div 
                draggable
                onDragStart={(e) => onDragStart(e, cId)}
                onContextMenu={(e) => onContextMenu(e, { type: 'file', ...file })}
                className={`group relative flex flex-col cursor-grab ${hoverClass} bg-[var(--input-bg)] rounded overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] transition-all`}
                style={{ height: '100px' }}
            >
                <div className="flex-1 flex items-center justify-center overflow-hidden opacity-80 group-hover:opacity-100 bg-[var(--bg)]">
                    <div className="scale-50 origin-center pointer-events-none">
                        <InteractiveMath 
                            template={content.template} 
                            segments={content.segments} 
                            nodeId={`lib-${cId}`} 
                            onToggle={() => {}} 
                            onHover={() => {}} 
                        />
                    </div>
                </div>
                <div className="px-2 py-1 text-[10px] font-bold truncate bg-[var(--panel-bg)] border-t border-[var(--border)]" style={getTypeStyle(content.type)}>
                    {content.title || "Untitled"}
                </div>
            </div>
        );
    }

    if (viewMode === 'minimal') {
        return (
            <div 
                draggable
                onDragStart={(e) => onDragStart(e, cId)}
                onContextMenu={(e) => onContextMenu(e, { type: 'file', ...file })}
                className={`group flex items-center gap-2 py-1 px-2 cursor-grab ${hoverClass} text-xs text-[var(--text)] border-b border-[var(--border)] last:border-0 hover:bg-[var(--hover-bg)]`}
                style={getTypeStyle(content.type)}
            >
                <Icon icon={icons?.file || icons?.code} className="text-[10px] opacity-70" />
                <span className="truncate flex-1">{content.title || "Untitled"}</span>
            </div>
        );
    }

    // List View (Default) - Tight Layout
    return (
        <div 
            draggable
            onDragStart={(e) => onDragStart(e, cId)}
            onContextMenu={(e) => onContextMenu(e, { type: 'file', ...file })}
            className={`group flex gap-2 py-1.5 px-2 cursor-grab ${hoverClass} text-xs text-[var(--text)] border-b border-[var(--border)] last:border-0 hover:bg-[var(--hover-bg)]`}
            style={getTypeStyle(content.type)}
        >
            <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                <div className="flex items-center gap-2">
                    <span className="truncate font-bold">{content.title || "Untitled"}</span>
                    {content.tags && content.tags.length > 0 && (
                        <div className="flex gap-1">
                            {content.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[8px] px-1 rounded bg-[var(--border)] opacity-70">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
                {content.note && (
                    <div className="text-[9px] opacity-50 truncate">{content.note}</div>
                )}
            </div>
            
            {/* Preview - No border, smaller */}
            <div className="w-16 h-8 bg-[var(--bg)] rounded flex items-center justify-center overflow-hidden opacity-60 group-hover:opacity-100 transition-opacity relative">
                 <div className="scale-[0.3] origin-center pointer-events-none absolute inset-0 flex items-center justify-center">
                    <InteractiveMath 
                        template={content.template} 
                        segments={content.segments} 
                        nodeId={`lib-${cId}`} 
                        onToggle={() => {}} 
                        onHover={() => {}} 
                    />
                </div>
            </div>
        </div>
    );
};

const FolderItem = ({ name, data, level, expanded, onToggle, onDragStart, onDrop, onContextMenu, hoverClass, icons, viewMode }) => {
    const isExpanded = expanded[name];
    
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('bg-[var(--accent)]', 'bg-opacity-20');
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('bg-[var(--accent)]', 'bg-opacity-20');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('bg-[var(--accent)]', 'bg-opacity-20');
        const cId = e.dataTransfer.getData('application/mathmap-node');
        if (cId) {
            onDrop(cId, name);
        }
    };

    return (
        <div className="select-none">
            <div 
                className={`flex items-center gap-2 px-2 py-1 cursor-pointer ${hoverClass} text-xs font-bold opacity-80 transition-colors hover:bg-[var(--hover-bg)]`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => onToggle(name)}
                onContextMenu={(e) => onContextMenu(e, { type: 'folder', path: name })}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <Icon icon={isExpanded ? icons?.arrowDown : icons?.arrowRight || icons?.arrowDown} className="text-[10px]" />
                <Icon icon={icons?.folder || icons?.explorer} className="text-[14px] text-[var(--accent)]" />
                <span>{name.split('/').pop()}</span>
            </div>
            {isExpanded && (
                <div className={viewMode === 'grid' ? "grid grid-cols-3 gap-2 p-2" : ""}>
                    {Object.keys(data.folders).map(folderName => (
                        <FolderItem 
                            key={folderName} 
                            name={`${name}/${folderName}`} 
                            data={data.folders[folderName]} 
                            level={level + 1} 
                            expanded={expanded}
                            onToggle={onToggle}
                            onDragStart={onDragStart}
                            onDrop={onDrop}
                            onContextMenu={onContextMenu}
                            hoverClass={hoverClass}
                            icons={icons}
                            viewMode={viewMode}
                        />
                    ))}
                    {data.files.map(file => (
                        <FileItem 
                            key={file.cId}
                            file={file}
                            viewMode={viewMode}
                            onDragStart={onDragStart}
                            onContextMenu={onContextMenu}
                            hoverClass={hoverClass}
                            icons={icons}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const LibraryPanel = ({ 
    library, 
    onImportLibrary, 
    onExportLibrary, 
    onUpdateItem, 
    onDeleteItem,
    settings,
    I18N: PropI18N,
    icons
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTags, setSelectedTags] = useState([]);
    const [expandedFolders, setExpandedFolders] = useState({});
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [renameModal, setRenameModal] = useState({ isOpen: false, cId: null, currentName: '', position: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, cId: null, title: '', position: null });
    const [viewMode, setViewMode] = useState('list'); // 'list', 'grid', 'minimal'
    
    const panelRef = useRef(null);
    const { panelWidth, handleMouseDownResize } = usePanelResize(300, 200, 600, 'left');
    
    const t = PropI18N?.[settings.lang] || I18N[settings.lang] || I18N.en;

    const allTags = useMemo(() => {
        const tags = new Set();
        Object.values(library).forEach(item => {
            if (item.tags) item.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags);
    }, [library]);

    const tree = useMemo(() => {
        const root = { files: [], folders: {} };
        
        Object.entries(library).forEach(([cId, content]) => {
            if (searchTerm && !content.title.toLowerCase().includes(searchTerm.toLowerCase())) return;
            
            if (selectedTags.length > 0) {
                const itemTags = content.tags || [];
                if (!selectedTags.every(t => itemTags.includes(t))) return;
            }

            const parts = (content.folder || "").split('/').filter(Boolean);
            let current = root;
            
            if (parts.length === 0) {
                root.files.push({ cId, content });
            } else {
                parts.forEach(part => {
                    if (!current.folders[part]) current.folders[part] = { files: [], folders: {} };
                    current = current.folders[part];
                });
                current.files.push({ cId, content });
            }
        });
        
        return root;
    }, [library, searchTerm, selectedTags]);

    const handleDragStart = (e, cId) => {
        e.dataTransfer.setData('application/mathmap-node', cId);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDropOnFolder = (cId, folderPath) => {
        onUpdateItem(cId, { folder: folderPath });
    };

    const toggleFolder = (path) => {
        setExpandedFolders(prev => ({
            ...prev,
            [path]: !prev[path]
        }));
    };

    const handleContextMenu = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            item
        });
    };

    const handlePanelContextMenu = (e) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            item: { type: 'panel' }
        });
    };

    const handleContextAction = (action) => {
        if (!contextMenu) return;
        const { item } = contextMenu;
        
        if (action === 'edit_template') {
            setEditingTemplateId(item.cId);
        } else if (action === 'rename') {
            setRenameModal({ 
                isOpen: true, 
                cId: item.cId, 
                currentName: item.content.title,
                position: { x: contextMenu.x, y: contextMenu.y }
            });
        } else if (action === 'delete') {
            setDeleteModal({ 
                isOpen: true, 
                cId: item.cId, 
                title: item.content.title,
                position: { x: contextMenu.x, y: contextMenu.y }
            });
        } else if (action === 'view_list') {
            setViewMode('list');
        } else if (action === 'view_grid') {
            setViewMode('grid');
        } else if (action === 'view_minimal') {
            setViewMode('minimal');
        }
        
        setContextMenu(null);
    };

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const renderTree = (node, path = "") => {
        return (
            <div className={viewMode === 'grid' && !path ? "grid grid-cols-3 gap-2 p-2" : ""}>
                {Object.keys(node.folders).map(folderName => (
                    <FolderItem 
                        key={folderName} 
                        name={path ? `${path}/${folderName}` : folderName} 
                        data={node.folders[folderName]} 
                        level={path.split('/').filter(Boolean).length} 
                        expanded={expandedFolders}
                        onToggle={toggleFolder}
                        onDragStart={handleDragStart}
                        onDrop={handleDropOnFolder}
                        onContextMenu={handleContextMenu}
                        hoverClass="hover:bg-[var(--hover-bg)]"
                        icons={icons}
                        viewMode={viewMode}
                    />
                ))}
                {node.files.map(file => (
                    <FileItem 
                        key={file.cId}
                        file={file}
                        viewMode={viewMode}
                        onDragStart={handleDragStart}
                        onContextMenu={handleContextMenu}
                        hoverClass="hover:bg-[var(--hover-bg)]"
                        icons={icons}
                    />
                ))}
            </div>
        );
    };

    return (
        <>
            {contextMenu && (
                <div 
                    className="fixed bg-[var(--panel-bg)] text-[var(--text)] border border-[var(--border)] shadow-lg rounded py-1 z-[10000] min-w-[120px]" 
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    {contextMenu.item.type === 'file' ? (
                        <>
                            <div className="px-4 py-2 text-xs cursor-pointer hover:bg-[var(--hover-bg)] flex items-center gap-2" onClick={() => handleContextAction('edit_template')}>
                                <Icon icon={icons?.edit} /> {t.editTemplate || "Edit Template"}
                            </div>
                            <div className="px-4 py-2 text-xs cursor-pointer hover:bg-[var(--hover-bg)] flex items-center gap-2" onClick={() => handleContextAction('rename')}>
                                <Icon icon={icons?.edit} /> {t.rename || "Rename"}
                            </div>
                            <div className="h-px bg-[var(--border)] my-1"></div>
                            <div className="px-4 py-2 text-xs cursor-pointer text-red-500 hover:bg-[var(--hover-bg)] flex items-center gap-2" onClick={() => handleContextAction('delete')}>
                                <Icon icon={icons?.delete} /> {t.delete}
                            </div>
                        </>
                    ) : contextMenu.item.type === 'folder' ? (
                        <div className="px-4 py-2 text-xs opacity-50">Folder Actions (Coming Soon)</div>
                    ) : (
                        <>
                            <div className="px-4 py-2 text-xs font-bold opacity-50 border-b border-[var(--border)] mb-1">View Mode</div>
                            <div className={`px-4 py-2 text-xs cursor-pointer hover:bg-[var(--hover-bg)] flex items-center gap-2 ${viewMode === 'list' ? 'text-[var(--accent)]' : ''}`} onClick={() => handleContextAction('view_list')}>
                                <Icon icon={icons?.list} /> List
                            </div>
                            <div className={`px-4 py-2 text-xs cursor-pointer hover:bg-[var(--hover-bg)] flex items-center gap-2 ${viewMode === 'grid' ? 'text-[var(--accent)]' : ''}`} onClick={() => handleContextAction('view_grid')}>
                                <Icon icon={icons?.grid} /> Grid
                            </div>
                            <div className={`px-4 py-2 text-xs cursor-pointer hover:bg-[var(--hover-bg)] flex items-center gap-2 ${viewMode === 'minimal' ? 'text-[var(--accent)]' : ''}`} onClick={() => handleContextAction('view_minimal')}>
                                <Icon icon={icons?.menu} /> Minimal
                            </div>
                        </>
                    )}
                </div>
            )}

            <div 
                ref={panelRef}
                className={`ui-panel library-panel ${isOpen ? 'open' : ''} bg-[var(--panel-bg)] border-l border-[var(--border)] text-[var(--text)]`}
                style={{ width: isOpen ? panelWidth : 40 }}
                onContextMenu={handlePanelContextMenu}
            >
                {isOpen && (
                    <div 
                        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-[var(--accent)] z-10 transition-colors"
                        onMouseDown={handleMouseDownResize}
                    ></div>
                )}
                <div className={`ui-header border-b border-[var(--border)] flex justify-between items-center ${!isOpen ? 'p-0 justify-center' : 'pl-2'} ${!isOpen ? 'bg-[var(--panel-bg)]' : ''}`}>
                    {isOpen && (
                        <div className="flex items-center gap-2">
                            <Icon icon={icons?.arrowDown} className="cursor-pointer rotate-180" onClick={() => setIsOpen(!isOpen)} />
                            <div className="flex gap-1">
                                <button onClick={() => setViewMode(v => v === 'list' ? 'grid' : v === 'grid' ? 'minimal' : 'list')} className="btn-icon w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--hover-bg)]" title="Toggle View">
                                    <Icon icon={viewMode === 'list' ? icons?.list : viewMode === 'grid' ? icons?.grid : icons?.menu} />
                                </button>
                                <button onClick={onImportLibrary} className="btn-icon w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--hover-bg)]" title={t.import || "Import Library"}>
                                    <Icon icon={icons?.import} />
                                </button>
                                <button onClick={onExportLibrary} className="btn-icon w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--hover-bg)]" title={t.export || "Export Library"}>
                                    <Icon icon={icons?.export} />
                                </button>
                            </div>
                        </div>
                    )}
                    <div className={`flex items-center gap-2 cursor-pointer transition-colors h-full ${!isOpen ? 'justify-center w-full' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                        {isOpen && <span>{t.library || "Library"}</span>}
                        <Icon icon={icons?.physics || icons?.explorer} className="text-lg" /> 
                    </div>
                </div>
                
                {isOpen && (
                    <div className="panel-content-wrapper flex flex-col h-full">
                        <div className="p-2 flex flex-col gap-2 border-b border-[var(--border)] bg-[var(--panel-bg)]">
                            <div className="relative">
                                <div className="absolute left-2 top-1.5 text-[var(--muted)] text-xs pointer-events-none">
                                    <Icon icon={icons?.search} />
                                </div>
                                <input 
                                    className="w-full pl-7 pr-2 py-1.5 text-xs rounded outline-none border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:border-[var(--accent)]" 
                                    placeholder={t.searchLibrary || "Search library..."} 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                />
                            </div>
                            {allTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                                    {allTags.map(tag => (
                                        <span 
                                            key={tag} 
                                            className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer border ${selectedTags.includes(tag) ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--input-bg)] border-[var(--border)] text-[var(--text)]'}`}
                                            onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div 
                            className="flex-1 overflow-y-auto pb-4"
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const cId = e.dataTransfer.getData('application/mathmap-node');
                                if (cId) handleDropOnFolder(cId, ""); // Drop on root
                            }}
                        >
                            {renderTree(tree)}
                            {tree.files.length === 0 && Object.keys(tree.folders).length === 0 && (
                                <div className="text-center opacity-40 text-xs py-4">No items found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {editingTemplateId && (
                <NodeTemplateEditor 
                    content={library[editingTemplateId]} 
                    cId={editingTemplateId}
                    onClose={() => setEditingTemplateId(null)}
                    onSave={(cId, newData) => {
                        onUpdateItem(cId, newData);
                        setEditingTemplateId(null);
                    }}
                    onDelete={(cId) => {
                        onDeleteItem(cId);
                        setEditingTemplateId(null);
                    }}
                    lang={settings.lang}
                    I18N={I18N}
                    settings={settings}
                    icons={icons}
                />
            )}
            
            <InputModal
                isOpen={renameModal.isOpen}
                onClose={() => setRenameModal({ ...renameModal, isOpen: false })}
                onConfirm={(newName) => {
                    if (newName) onUpdateItem(renameModal.cId, { title: newName });
                }}
                title={t.rename || "Rename"}
                initialValue={renameModal.currentName}
                placeholder="Enter new name"
                icons={icons}
                position={renameModal.position}
            />

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={() => onDeleteItem(deleteModal.cId)}
                title={t.delete || "Delete"}
                message={`Are you sure you want to delete "${deleteModal.title}"?`}
                icons={icons}
                position={deleteModal.position}
            />
        </>
    );
};

export default LibraryPanel;
