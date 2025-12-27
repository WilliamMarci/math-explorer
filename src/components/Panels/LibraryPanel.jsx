import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import Icon from "../UI/Icon";
import { COLORS } from "../../theme";
import { InteractiveMath, RichViewer } from "../Common";
import { usePanelResize } from "../../hooks/usePanelResize";
import InputModal from "../Modals/InputModal";
import ConfirmModal from "../Modals/ConfirmModal";
import NodeTemplateEditor from "../Modals/NodeTemplateEditor";


const AutoFitMath = ({ template, segments, nodeId }) => {
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const [scale, setScale] = useState(1);

    useLayoutEffect(() => {
        const updateScale = () => {
            if (containerRef.current && contentRef.current) {
                const cw = containerRef.current.clientWidth;
                const sw = contentRef.current.scrollWidth;
                // Dynamic scaling: Scale down if too big, scale up if small (max 1.2x)
                const ratio = cw / sw;
                setScale(Math.min(ratio * 0.8, 0.8)); 
            }
        };

        updateScale();
        
        // Observe both container and content for changes
        const observer = new ResizeObserver(updateScale);
        if (containerRef.current) observer.observe(containerRef.current);
        if (contentRef.current) observer.observe(contentRef.current);

        return () => observer.disconnect();
    }, [template]);

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden">
            <div ref={contentRef} style={{ transform: `scale(${scale})`, transformOrigin: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'max-content' }}>
                <InteractiveMath template={template} segments={segments} nodeId={nodeId} />
            </div>
        </div>
    );
};

const LibraryPanel = ({ 
    library, 
    onUpdateItem, 
    onDeleteItem, 
    onImportLibrary, 
    onExportLibrary,
    settings,
    I18N,
    icons,
    hoverClass
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [viewMode, setViewMode] = useState("list"); // tree, list, grid
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTags, setSelectedTags] = useState([]);
    const [expandedFolders, setExpandedFolders] = useState({ "": true }); // Root expanded
    const [contextMenu, setContextMenu] = useState(null);
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    const [renameModal, setRenameModal] = useState({ isOpen: false, cId: null, currentName: "", position: null });
    const [createFolderModal, setCreateFolderModal] = useState({ isOpen: false, parentPath: "", position: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, cId: null, title: "", position: null });
    const [draggedItem, setDraggedItem] = useState(null);
    const [selectedItemId, setSelectedItemId] = useState(null);

    const panelRef = useRef(null);
    const { width: panelWidth, handleMouseDown: handleMouseDownResize } = usePanelResize(300, 200, 600, "left");
    const t = I18N[settings.lang];

    // Close context menu on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (contextMenu && !e.target.closest('.context-menu')) {
                setContextMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [contextMenu]);

    // Build Tree Structure
    const { tree, allTags, flatFiles } = useMemo(() => {
        const root = { files: [], folders: {} };
        const tags = new Set();
        const files = [];

        Object.entries(library).forEach(([id, item]) => {
            if (item.hidden) return; // Skip hidden items (scene instances)

            // Filter by search and tags
            const matchesSearch = !searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTags = selectedTags.length === 0 || (item.tags && selectedTags.every(t => item.tags.includes(t)));

            if (item.tags) item.tags.forEach(t => tags.add(t));

            if (matchesSearch && matchesTags) {
                // Handle explicit folder items
                if (item.type === "folder") {
                     const parts = (item.path || "").split("/").filter(Boolean);
                     let current = root;
                     parts.forEach(part => {
                         if (!current.folders[part]) {
                             current.folders[part] = { files: [], folders: {} };
                         }
                         current = current.folders[part];
                     });
                     return;
                }

                files.push({ id, ...item });
                
                // Add to tree
                const parts = (item.folder || "").split("/").filter(Boolean);
                let current = root;
                parts.forEach(part => {
                    if (!current.folders[part]) {
                        current.folders[part] = { files: [], folders: {} };
                    }
                    current = current.folders[part];
                });
                current.files.push({ id, ...item });
            }
        });

        return { tree: root, allTags: Array.from(tags), flatFiles: files };
    }, [library, searchTerm, selectedTags]);

    // Handlers
    const toggleFolder = (path) => {
        setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
    };

    const handleDragStart = (e, item) => {
        e.dataTransfer.setData("application/mathmap-node", item.id); // For Canvas Drop
        e.dataTransfer.setData("application/mathmap-library-item", item.id); // For Library Reorg
        setDraggedItem(item);
    };

    const handleDropOnFolder = (e, targetPath) => {
        e.preventDefault();
        e.stopPropagation();
        const itemId = e.dataTransfer.getData("application/mathmap-library-item");
        if (itemId && library[itemId]) {
            onUpdateItem(itemId, { folder: targetPath });
        }
        setDraggedItem(null);
    };

    const handleContextMenu = (e, item, type) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            item,
            type // "file", "folder", "panel"
        });
    };

    // Helper for node styles
    const getNodeStyleClass = (type) => {
        switch(type) {
            case 'axiom': return 'node-type-axiom';
            case 'constant': return 'node-type-constant';
            case 'parameter': return 'node-type-parameter';
            case 'note': return 'node-type-note';
            default: return 'node-type-default';
        }
    };

    // Helper for pattern fill style
    const getPatternStyle = (type, color) => {
        const baseStyle = { backgroundColor: color, width: '6px', height: '100%', flexShrink: 0 };
        switch(type) {
            case 'axiom': 
                return { ...baseStyle, borderRight: `2px solid ${color}`, borderLeft: `2px solid ${color}`, backgroundColor: 'transparent' };
            case 'constant': 
                return { ...baseStyle, backgroundColor: 'transparent', backgroundImage: `repeating-linear-gradient(45deg, ${color}, ${color} 3px, transparent 3px, transparent 6px)` };
            case 'parameter': 
                return { ...baseStyle, border: `1px dashed ${color}`, backgroundColor: 'transparent' };
            default: 
                return baseStyle;
        }
    };

    // Renderers
    const renderFileItem = (file, level = 0) => {
        const isGrid = viewMode === "grid";
        const isList = viewMode === "list";
        const isTree = viewMode === "tree";
        const isNote = file.type === "note";
        const isSelected = selectedItemId === file.id;
        
        return (
            <div 
                key={file.id}
                draggable
                onDragStart={(e) => handleDragStart(e, file)}
                onContextMenu={(e) => handleContextMenu(e, file, "file")}
                className={`
                    cursor-pointer transition-colors group relative select-none
                    ${isSelected ? "bg-[var(--accent)]/10" : hoverClass}
                    ${isGrid ? "flex flex-col" : ""}
                    ${isList ? "block" : ""}
                    ${isTree ? "flex items-center gap-2 py-1 px-2 rounded ml-4" : ""}
                `}
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItemId(file.id);
                }}
                onDoubleClick={() => setEditingTemplateId(file.id)}
            >
                {isGrid && (
                    <div className={`flex flex-col border rounded h-32 bg-[var(--card-bg)] overflow-hidden relative ${isSelected ? "border-[var(--accent)]" : "border-[var(--border)]"}`}>
                        <div className="flex-1 flex items-center justify-center overflow-hidden p-2">
                            {isNote ? (
                                <div className="library-note-preview text-[10px] overflow-hidden h-full w-full text-left break-words opacity-90">
                                    <RichViewer content={file.note || file.segments?.note?.content || "No content"} />
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                                    <AutoFitMath template={file.segments?.math?.content || file.template || "f(x)"} segments={file.segments} nodeId={file.id} />
                                </div>
                            )}
                        </div>
                        <div className="h-6 flex items-center px-2 bg-[var(--bg)] border-t border-[var(--border)] shrink-0">
                            <div className="text-xs truncate font-medium flex-1">{file.title}</div>
                        </div>
                        <div className="h-1 w-full shrink-0" style={{ backgroundColor: file.color || (isNote ? "#fcd34d" : "#60a5fa") }}></div>
                    </div>
                )}

                {isList && (
                    <div className={`flex items-stretch border-b ${hoverClass} relative overflow-hidden`}>
                        {/* Pattern Fill Indicator - Absolute to ensure visibility */}
                        <div className="absolute left-0 top-0 bottom-0 z-10" style={getPatternStyle(file.type, file.color || (isNote ? "#fcd34d" : "#60a5fa"))}></div>

                        {/* Left Side: Info - Add padding-left to account for the absolute strip */}
                        <div className="flex flex-col gap-1 flex-1 overflow-hidden py-2 pl-4">
                            {/* Row 1: Title */}
                            <div className="flex items-center gap-2">
                                <div className="text-sm font-medium truncate">{file.title}</div>
                            </div>
                            
                            {/* Row 2: Tags */}
                            {file.tags && file.tags.length > 0 && (
                                <div className="flex gap-1 overflow-hidden">
                                    {file.tags.map(tag => (
                                        <span key={tag} className="text-[9px] px-1.5 rounded bg-[var(--bg)] border border-[var(--border)] opacity-60 whitespace-nowrap">{tag}</span>
                                    ))}
                                </div>
                            )}

                            {/* Row 3: Description */}
                            <div className="text-xs text-[var(--muted)] truncate opacity-80">
                                {file.note || file.segments?.note?.content || "No description"}
                            </div>
                        </div>

                        {/* Right Side: Preview */}
                        {!isNote && (
                            <div className="w-[40%] shrink-0 flex items-center justify-center overflow-hidden p-1 relative my-2 mr-3">
                                <div className="absolute inset-0 pointer-events-none z-10" style={{ maskImage: 'linear-gradient(to right, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)' }}></div>
                                <div className="w-full h-full pointer-events-none">
                                    <AutoFitMath template={file.segments?.math?.content || file.template || "f(x)"} segments={file.segments} nodeId={file.id} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isTree && (
                    <>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: file.color || (isNote ? "#fcd34d" : "#60a5fa") }}></div>
                        <span className="text-sm truncate flex-1">{file.title}</span>
                        {file.tags && file.tags.length > 0 && (
                            <div className="flex gap-1">
                                {file.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-[9px] px-1 rounded bg-[var(--bg)] border border-[var(--border)] opacity-60">{tag}</span>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    const renderFolder = (name, node, path, level = 0) => {
        const fullPath = path ? `${path}/${name}` : name;
        const isExpanded = expandedFolders[fullPath];
        
        return (
            <div key={fullPath} className="select-none">
                <div 
                    className={`flex items-center gap-1 py-1 px-2 cursor-pointer text-sm font-medium text-[var(--muted)] ${hoverClass}`}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFolder(fullPath);
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => handleDropOnFolder(e, fullPath)}
                    onContextMenu={(e) => handleContextMenu(e, { path: fullPath }, "folder")}
                >
                    <span className="w-4 flex items-center justify-center">
                        {isExpanded ? (
                            <Icon icon={icons?.arrowDown} className="text-[10px]" />
                        ) : (
                            <Icon icon={icons?.arrowRight} className="text-[10px]" />
                        )}
                    </span>
                    <span>{name}</span>
                </div>
                {isExpanded && (
                    <div>
                        {Object.keys(node.folders).map(subFolder => renderFolder(subFolder, node.folders[subFolder], fullPath, level + 1))}
                        {node.files.map(file => renderFileItem(file, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div 
                ref={panelRef}
                className={`ui-panel library-panel ${isOpen ? "open" : ""} bg-[var(--panel-bg)] border-l border-[var(--border)] text-[var(--text)] flex flex-col`}
                style={{ width: isOpen ? panelWidth : 40 }}
                onContextMenu={(e) => handleContextMenu(e, null, "panel")}
            >
                {isOpen && (
                    <div 
                        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-[var(--accent)] z-10 transition-colors"
                        onMouseDown={handleMouseDownResize}
                    ></div>
                )}
                
                {/* Header */}
                <div className={`ui-header border-b border-[var(--border)] flex justify-between items-center pr-2 ${!isOpen ? "bg-[var(--panel-bg)]" : ""}`} onClick={() => setIsOpen(!isOpen)}>
                    <div className={`flex items-center gap-2 cursor-pointer transition-colors h-full w-full justify-end`}>
                        {isOpen && (
                            <div className="flex items-center gap-2">
                                <span>{t.library || "Library"}</span>
                                <Icon icon={icons?.physics || icons?.explorer} className="text-lg" />
                            </div>
                        )}
                        {!isOpen && <Icon icon={icons?.physics || icons?.explorer} className="text-lg" />}
                    </div>
                </div>

                {isOpen && (
                    <div className="flex flex-col flex-1 overflow-hidden relative">
                        {/* Toolbar & Search */}
                        <div className="p-2 flex flex-col gap-2 border-b border-[var(--border)] bg-[var(--panel-bg)]">
                            {/* Toolbar */}
                            <div className="flex justify-between items-center">
                                <div className="flex gap-1">
                                    <button onClick={onImportLibrary} className="btn-icon w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--hover-bg)]" title={t.import || "Import"}>
                                        <Icon icon={icons?.import} />
                                    </button>
                                    <button onClick={onExportLibrary} className="btn-icon w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--hover-bg)]" title={t.export || "Export"}>
                                        <Icon icon={icons?.export} />
                                    </button>
                                    <div className="w-px h-4 bg-[var(--border)] mx-1"></div>
                                    <button 
                                        onClick={() => {
                                            const newId = `template_${Math.random().toString(36).substr(2, 9)}`;
                                            onUpdateItem(newId, { 
                                                title: "New Node", 
                                                type: "default", 
                                                folder: "",
                                                template: "",
                                                segments: {}
                                            });
                                            setEditingTemplateId(newId);
                                        }}
                                        className="btn-icon w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--hover-bg)]"
                                        title={t.newNode || "New Node"}
                                    >
                                        <Icon icon={icons?.add} className="text-xs" />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setCreateFolderModal({ isOpen: true, parentPath: "", position: { x: rect.left, y: rect.bottom + 5 } });
                                        }}
                                        className="btn-icon w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--hover-bg)]"
                                        title={t.newFolder || "New Folder"}
                                    >
                                        <Icon icon={icons?.folder} className="text-xs" />
                                    </button>
                                </div>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => setViewMode("tree")} 
                                        className={`w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--hover-bg)] ${viewMode === "tree" ? "bg-[var(--hover-bg)] text-[var(--accent)]" : "text-[var(--muted)]"}`}
                                        title={t.treeView || "Tree View"}
                                    >
                                        <Icon icon={icons?.menu} className="text-[10px]" />
                                    </button>
                                    <button 
                                        onClick={() => setViewMode("list")} 
                                        className={`w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--hover-bg)] ${viewMode === "list" ? "bg-[var(--hover-bg)] text-[var(--accent)]" : "text-[var(--muted)]"}`}
                                        title={t.listView || "List View"}
                                    >
                                        <Icon icon={icons?.list} className="text-[10px]" />
                                    </button>
                                    <button 
                                        onClick={() => setViewMode("grid")} 
                                        className={`w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--hover-bg)] ${viewMode === "grid" ? "bg-[var(--hover-bg)] text-[var(--accent)]" : "text-[var(--muted)]"}`}
                                        title={t.gridView || "Grid View"}
                                    >
                                        <Icon icon={icons?.grid} className="text-[10px]" />
                                    </button>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <div className="absolute left-2 top-1.5 text-[var(--muted)] text-xs pointer-events-none">
                                    <Icon icon={icons?.search} />
                                </div>
                                <input 
                                    className="w-full pl-7 pr-2 py-1.5 text-xs rounded outline-none border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:border-[var(--accent)]" 
                                    placeholder={t.searchLibrary || "Search..."} 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                />
                            </div>
                            {allTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                                    {allTags.map(tag => (
                                        <span 
                                            key={tag} 
                                            className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer border ${selectedTags.includes(tag) ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-[var(--input-bg)] border-[var(--border)] text-[var(--text)]"}`}
                                            onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div 
                            className="flex-1 overflow-y-auto pb-2"
                            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                            onDrop={(e) => handleDropOnFolder(e, "")}
                            onClick={() => setSelectedItemId(null)}
                        >
                            {viewMode === "tree" ? (
                                <>
                                    {Object.keys(tree.folders).map(folder => renderFolder(folder, tree.folders[folder], ""))}
                                    {tree.files.map(file => renderFileItem(file))}
                                </>
                            ) : (
                                <div className={viewMode === "grid" ? "grid gap-2 p-2 grid-cols-[repeat(auto-fill,minmax(100px,1fr))]" : "flex flex-col"}>
                                    {flatFiles.map(file => renderFileItem(file))}
                                </div>
                            )}
                            
                            {flatFiles.length === 0 && (
                                <div className="text-center opacity-40 text-xs py-4">No items found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div 
                    className="context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={() => setContextMenu(null)}
                >
                    {contextMenu.type === "file" && (
                        <>
                            <div className="context-menu-item" onClick={() => {
                                // Duplicate logic
                                const newId = `template_${Math.random().toString(36).substr(2, 9)}`;
                                onUpdateItem(newId, { 
                                    ...contextMenu.item,
                                    title: `${contextMenu.item.title} (${t.shortcuts?.copy || "Copy"})`,
                                    id: undefined // Clear ID to let it be new
                                });
                                setContextMenu(null);
                            }}>
                                <Icon icon={icons?.copy} /> {t.duplicate || "Duplicate"}
                            </div>
                            <div className="context-menu-item" onClick={() => { setEditingTemplateId(contextMenu.item.id); setContextMenu(null); }}>
                                <Icon icon={icons?.edit} /> {t.editTemplate || "Edit Template"}
                            </div>
                            <div className="h-px bg-[var(--border)] my-1"></div>
                            <div className="context-menu-item" onClick={() => setRenameModal({ isOpen: true, cId: contextMenu.item.id, currentName: contextMenu.item.title, position: { x: contextMenu.x, y: contextMenu.y } })}>
                                <Icon icon={icons?.editCircle} /> {t.rename || "Rename"}
                            </div>
                            <div className="context-menu-item danger" onClick={() => setDeleteModal({ isOpen: true, cId: contextMenu.item.id, title: contextMenu.item.title, position: { x: contextMenu.x, y: contextMenu.y } })}>
                                <Icon icon={icons?.delete} /> {t.delete || "Delete"}
                            </div>
                        </>
                    )}
                    {(contextMenu.type === "folder" || contextMenu.type === "panel") && (
                        <>
                            <div className="context-menu-item" onClick={() => setCreateFolderModal({ isOpen: true, parentPath: contextMenu.item?.path || "", position: { x: contextMenu.x, y: contextMenu.y } })}>
                                <Icon icon={icons?.folder} /> {t.newFolder || "New Folder"}
                            </div>
                            <div className="context-menu-item" onClick={() => {
                                const newId = `template_${Math.random().toString(36).substr(2, 9)}`;
                                onUpdateItem(newId, { 
                                    title: "New Node", 
                                    type: "default", 
                                    folder: contextMenu.item?.path || "",
                                    template: "",
                                    segments: {}
                                });
                                setEditingTemplateId(newId);
                            }}>
                                <Icon icon={icons?.add} /> {t.newNode || "New Node"}
                            </div>
                            {contextMenu.type === "panel" && (
                                <>
                                    <div className="h-px bg-[var(--border)] my-1"></div>
                                    <div className="context-menu-item" onClick={() => setExpandedFolders({})}>
                                        <Icon icon={icons?.collapse} /> {t.collapseAll || "Collapse All"}
                                    </div>
                                    <div className="context-menu-item" onClick={() => {
                                        // Refresh logic (re-fetch or just force update)
                                        // Since it's local state, maybe just close menu
                                        setContextMenu(null);
                                    }}>
                                        <Icon icon={icons?.refresh} /> {t.refresh || "Refresh"}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Modals */}
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
                    existingTags={allTags}
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
                placeholder={t.titlePlaceholder || "Enter new name"}
                icons={icons}
                position={renameModal.position}
                lang={settings.lang}
                I18N={I18N}
            />

            <InputModal
                isOpen={createFolderModal.isOpen}
                onClose={() => setCreateFolderModal({ ...createFolderModal, isOpen: false })}
                onConfirm={(folderName) => {
                    const newPath = createFolderModal.parentPath ? `${createFolderModal.parentPath}/${folderName}` : folderName;
                    // Create a folder item to persist the folder
                    const newId = `folder_${Math.random().toString(36).substr(2, 9)}`;
                    onUpdateItem(newId, { 
                        title: folderName, 
                        type: "folder", 
                        path: newPath
                    });
                }}
                title={t.newFolder || "New Folder"}
                placeholder={t.titlePlaceholder || "Folder Name"}
                icons={icons}
                position={createFolderModal.position}
                lang={settings.lang}
                I18N={I18N}
            />

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={() => onDeleteItem(deleteModal.cId)}
                title={t.delete || "Delete"}
                message={`${t.deleteConfirmation || "Are you sure you want to delete"} "${deleteModal.title}"?`}
                icons={icons}
                position={deleteModal.position}
                lang={settings.lang}
                I18N={I18N}
            />
        </>
    );
};

export default LibraryPanel;
