import React from 'react';
import Minimap from './Minimap';
import Explorer from './Explorer';
import ControlPanel from './ControlPanel';

const UIOverlay = ({ 
    nodes, library, transform, svgRef,
    settings, setSettings, 
    onAddNode, onExport, onImport, 
    onTogglePin, onEditNode, onDeleteNode, 
    onToggleVisibility, onFocusNode, onAutoArrange, 
    I18N, 
    nodeOrder, setNodeOrder, 
    viewMode, setViewMode, 
    shortcuts, setShortcuts 
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
            />

            <Explorer 
                nodes={nodes} 
                library={library} 
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
            />

            <ControlPanel 
                settings={settings} 
                setSettings={setSettings} 
                shortcuts={shortcuts} 
                setShortcuts={setShortcuts} 
                t={t} 
                onExport={onExport} 
                onImport={onImport} 
            />
        </>
    );
};

export default UIOverlay;
