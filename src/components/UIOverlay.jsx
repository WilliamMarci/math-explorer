import React from 'react';
import Minimap from './Panels/Minimap';
import Explorer from './Panels/Explorer';
import LibraryPanel from './Panels/LibraryPanel';
import ControlPanel from './ControlPanel';

const UIOverlay = ({ 
    nodes, library, sceneLibrary, userLibrary, transform, svgRef,
    settings, setSettings, 
    onAddNode, onExport, onImport, 
    onTogglePin, onEditNode, onDeleteNode, 
    onToggleVisibility, onFocusNode, onAutoArrange, 
    onSpawnNode, onImportLibrary, onExportLibrary,
    onUpdateItem, onDeleteItem,
    I18N, 
    nodeOrder, setNodeOrder, 
    viewMode, setViewMode, 
    shortcuts, setShortcuts,
    selectedNodeIds, setSelectedNodeIds,
    icons
}) => {
    const t = I18N[settings.lang];
    const isDarkTheme = ['blackboard', 'blueprint'].includes(settings.theme);
    const hoverClass = isDarkTheme ? 'hover:bg-white/10' : 'hover:bg-black/5';

    return (
        <>
            <Minimap 
                nodes={nodes} 
                links={settings.linksRef || []} 
                transform={transform} 
                visible={settings.showMinimap} 
                labelType={settings.minimapLabelType} 
                library={library} 
                settings={settings}
            />

            <Explorer 
                nodes={nodes} 
                library={library} 
                sceneLibrary={sceneLibrary}
                nodeOrder={nodeOrder} 
                setNodeOrder={setNodeOrder} 
                links={settings.linksRef || []}
                viewMode={viewMode} 
                setViewMode={setViewMode}
                onAddNode={onAddNode} 
                onFocusNode={onFocusNode} 
                onEditNode={onEditNode} 
                onTogglePin={onTogglePin} 
                onDeleteNode={onDeleteNode} 
                onToggleVisibility={onToggleVisibility} 
                onAutoArrange={onAutoArrange}
                t={t} 
                hoverClass={hoverClass}
                selectedNodeIds={selectedNodeIds}
                setSelectedNodeIds={setSelectedNodeIds}
                settings={settings}
                icons={icons}
            />

            <LibraryPanel 
                library={userLibrary}
                onImportLibrary={onImportLibrary}
                onExportLibrary={onExportLibrary}
                onUpdateItem={onUpdateItem}
                onDeleteItem={onDeleteItem}
                t={t}
                hoverClass={hoverClass}
                settings={settings}
                icons={icons}
                I18N={I18N}
            />

            <ControlPanel 
                settings={settings} 
                setSettings={setSettings} 
                shortcuts={shortcuts} 
                setShortcuts={setShortcuts} 
                t={t} 
                onExport={onExport} 
                onImport={onImport}
                icons={icons}
            />
        </>
    );
};

export default UIOverlay;
