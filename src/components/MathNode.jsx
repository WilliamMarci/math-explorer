import React, { useRef } from 'react';
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
    icons,
    onNodeHover,
    highlights = [],
    onFocusNode
}) => {
    const baseColor = node.color || COLORS[0];
    const isPinned = (node.fx !== null && node.fx !== undefined) && !node._tempFixed;
    const nodeType = (content?.type || 'default').toLowerCase();
    const isMinimal = settings?.minimalMode;
    
    const showBadge = nodeType !== 'default' && nodeType !== 'note';
    const showMath = nodeType !== 'note' && content?.template && content.template.trim() !== '';

    // Custom Double Click Logic
    const lastClickTime = useRef(0);
    const handleNodeClick = (e) => {
        const now = Date.now();
        if (now - lastClickTime.current < 200) { // 200ms threshold
            e.stopPropagation();
            if (viewMode) {
                if (onFocusNode) onFocusNode(node);
            } else {
                onEdit(node.id);
            }
        }
        lastClickTime.current = now;
    };

    if (!content) return null;

    return (
        <div 
            id={`node-${node.id}`}
            className={`node-wrapper ${isSelected ? 'selected' : ''}`}
            style={{ 
                transform: `translate(${node.x}px, ${node.y}px) translate(-50%, -50%)`,
                '--node-color': baseColor,
                zIndex: isSelected ? 10 : undefined // Bring selected to front?
            }} 
            onMouseDown={(e) => onDragStart(e, node)}
            onContextMenu={(e) => onContextMenu(e, node)}
            onClick={handleNodeClick}
            onMouseEnter={() => onNodeHover && onNodeHover(node.id)}
            onMouseLeave={() => onNodeHover && onNodeHover(null)}
        >
            <div id={`math-card-${node.id}`} className={`math-card group ${isPinned ? 'pinned' : ''} ${isMinimal ? 'minimal-mode' : ''} node-type-${nodeType} ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
                {/* Highlights */}
                {highlights.map((h, i) => (
                    <div 
                        key={i}
                        style={{
                            position: 'absolute',
                            left: h.x,
                            top: h.y,
                            width: h.width,
                            height: h.height,
                            backgroundColor: h.color,
                            opacity: 0.2,
                            borderRadius: '2px',
                            pointerEvents: 'none',
                            zIndex: 5
                        }}
                    />
                ))}

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