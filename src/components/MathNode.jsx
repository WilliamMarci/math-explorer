import React from 'react';
import { COLORS } from '../theme';
import { InteractiveMath, RichViewer } from './Common';

// Helper to get localized type name
const getTypeName = (type, lang, I18N) => {
    return I18N[lang]?.types[type] || type;
};

const MathNode = ({ node, content, onToggle, onHover, onDragStart, onEdit, onPin, lang, I18N }) => {
    const baseColor = node.color || COLORS[0];
    const isPinned = node.fx !== null && node.fx !== undefined;
    const nodeType = content.type || 'default';
    
    // Logic to determine if we show the badge
    const showBadge = nodeType !== 'default' && nodeType !== 'note';
    
    // Logic to determine if we show the math container
    // If it's a note and template is empty, hide math container
    const showMath = !(nodeType === 'note' && (!content.template || content.template.trim() === ''));

    if (!content) return null;

    return (
        <div 
            className="node-wrapper" 
            style={{ 
                transform: `translate(${node.x}px, ${node.y}px) translate(-50%, -50%)`,
                '--node-color': baseColor // Inject color for CSS usage
            }} 
            onMouseDown={(e) => onDragStart(e, node)}
        >
            <div className={`math-card ${isPinned ? 'pinned' : ''} node-type-${nodeType}`}>
                {/* Header */}
                <div className="node-header">
                    {showBadge && (
                        <span className="type-badge" style={{ backgroundColor: baseColor }}>
                            {getTypeName(nodeType, lang, I18N)}
                        </span>
                    )}
                    <span className="node-title truncate" title={content.title}>
                        {content.title}
                    </span>
                </div>

                {/* Actions */}
                <div className="node-actions">
                    <button 
                        className={`btn-icon ${isPinned ? 'bg-slate-800 text-white border-slate-800' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); onPin(node); }}
                        title="Pin Node"
                    >
                        <i className={isPinned ? "ri-pushpin-fill" : "ri-pushpin-line"}></i>
                    </button>
                    <button 
                        className="btn-icon" 
                        onClick={(e) => { e.stopPropagation(); onEdit(node); }}
                        title="Edit Content"
                    >
                        <i className="ri-edit-line"></i>
                    </button>
                </div>

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
                    {content.note && <RichViewer content={content.note} type="markdown" />}
                </div>
            </div>
        </div>
    );
};

export default MathNode;