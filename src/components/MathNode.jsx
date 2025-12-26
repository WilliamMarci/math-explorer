import React from 'react';
import { COLORS } from '../theme';
import { InteractiveMath, RichViewer } from './Common';
import Icon from './Icon';

const getTypeName = (type, lang, I18N) => {
    return I18N[lang]?.types[type] || type;
};

const MathNode = ({ 
    node, 
    content, 
    onToggle, 
    onHover, 
    onDragStart, 
    onEdit, 
    onPin, 
    onContextMenu, 
    lang, 
    I18N,
    isSelected,
    viewMode,
    settings,
    icons
}) => {
    const baseColor = node.color || COLORS[0];
    const isPinned = node.fx !== null && node.fx !== undefined;
    const nodeType = (content?.type || 'default').toLowerCase();
    const isMinimal = settings?.minimalMode;
    
    const showBadge = nodeType !== 'default' && nodeType !== 'note';
    const showMath = nodeType !== 'note' && content?.template && content.template.trim() !== '';

    if (!content) return null;

    return (
        <div 
            className={`node-wrapper ${isSelected ? 'selected' : ''}`}
            style={{ 
                transform: `translate(${node.x}px, ${node.y}px) translate(-50%, -50%)`,
                '--node-color': baseColor,
                zIndex: isSelected ? 10 : undefined // Bring selected to front?
            }} 
            onMouseDown={(e) => onDragStart(e, node)}
            onContextMenu={(e) => onContextMenu(e, node)}
            onDoubleClick={(e) => { e.stopPropagation(); if (!viewMode) onEdit(node.id); }}
        >
            <div className={`math-card group ${isPinned ? 'pinned' : ''} ${isMinimal ? 'minimal-mode' : ''} node-type-${nodeType} ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
                {/* Header */}
                <div className="node-header">
                    {showBadge && (
                        <span className="type-badge" style={{ backgroundColor: baseColor }}>
                            {getTypeName(nodeType, lang, I18N)}
                        </span>
                    )}
                    
                    <RichViewer 
                        content={content.title} 
                        className="node-title" 
                        inline={true} 
                    />
                </div>

                {/* Actions */}
                {!viewMode && (
                <div className="node-actions">
                    <button 
                        className={`btn-icon ${isPinned ? 'bg-slate-800 text-white border-slate-800' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); onPin(node); }}
                        title="Pin Node"
                    >
                        <Icon icon={isPinned ? icons?.unpin : icons?.pin} />
                    </button>
                    <button 
                        className="btn-icon" 
                        onClick={(e) => { e.stopPropagation(); onEdit(node.id); }}
                        title="Edit Content"
                    >
                        <Icon icon={icons?.edit} />
                    </button>
                </div>
                )}

                {/* Body */}
                <div className="node-body">
                    {showMath && (
                        <InteractiveMath 
                            template={content.template} 
                            segments={content.segments || {}} 
                            nodeId={node.id} 
                            onToggle={onToggle} 
                            onHover={onHover} 
                        />
                    )}
                    {content.svg && (
                        <div className="node-svg-container" style={{ textAlign: 'center', margin: '10px 0' }}>
                            <RichViewer content={content.svg} type="svg" />
                        </div>
                    )}
                    {content.note && (
                        <div className={(isMinimal && nodeType !== 'note') ? 'hidden group-hover:block node-note' : 'node-note'}>
                            <RichViewer content={content.note} type="markdown" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MathNode;