import { useCallback } from 'react';
import { COLORS } from '../theme';
import { getDescendants } from '../utils/graphUtils';

export const useGraphActions = ({
    graphData,
    setLibrary,
    setExpandedState,
    setNodes,
    updateSimulation,
    setEditingNodeId,
    library
}) => {

    const addNode = useCallback((transform) => {
        const newContentId = `topic_${Date.now()}`; 
        const newNodeId = `node_${Date.now()}`;
        setLibrary(prev => ({ 
            ...prev, 
            [newContentId]: { title: "New Topic", type: "default", template: "\\text{New Node}", note: "Edit this node to add content.", segments: {} } 
        }));
        
        const newNode = { 
            id: newNodeId, 
            contentId: newContentId, 
            x: -transform.x / transform.k + window.innerWidth/2, 
            y: -transform.y / transform.k + window.innerHeight/2, 
            color: COLORS[Math.floor(Math.random() * COLORS.length)] 
        };
        
        graphData.current.nodes.push(newNode); 
        updateSimulation();
    }, [graphData, setLibrary, updateSimulation]);

    const spawnNode = useCallback((contentId, posX, posY, transform, parentId = null) => {
        const newNodeId = `node_${Date.now()}`;
        const graphX = (posX - transform.x) / transform.k;
        const graphY = (posY - transform.y) / transform.k;
        
        const newNode = { 
            id: newNodeId, 
            contentId: contentId, 
            x: graphX, y: graphY, 
            color: COLORS[Math.floor(Math.random() * COLORS.length)] 
        };
        
        graphData.current.nodes.push(newNode);
        if (parentId) {
            graphData.current.links.push({ source: parentId, target: newNodeId });
        }
        updateSimulation();
    }, [graphData, updateSimulation]);

    const deleteNode = useCallback((nodeId) => {
        if (confirm("Delete this node?")) {
            graphData.current.nodes = graphData.current.nodes.filter(n => n.id !== nodeId);
            graphData.current.links = graphData.current.links.filter(l => (l.source.id || l.source) !== nodeId && (l.target.id || l.target) !== nodeId);
            updateSimulation();
            if (setEditingNodeId) setEditingNodeId(null);
            return true;
        }
        return false;
    }, [graphData, updateSimulation, setEditingNodeId]);

    const toggleVisibility = useCallback((contentId, transform) => {
        const existingNode = graphData.current.nodes.find(n => n.contentId === contentId);
        
        if (existingNode) {
            // HIDE: Recursive
            const toRemove = getDescendants(existingNode.id, graphData.current.links);
            toRemove.add(existingNode.id);
            
            graphData.current.nodes = graphData.current.nodes.filter(n => !toRemove.has(n.id));
            graphData.current.links = graphData.current.links.filter(l => {
                const s = typeof l.source === 'object' ? l.source.id : l.source;
                const t = typeof l.target === 'object' ? l.target.id : l.target;
                return !toRemove.has(s) && !toRemove.has(t);
            });
        } else {
            // SHOW
            const newNode = { 
                id: `node_${Date.now()}`, 
                contentId: contentId, 
                x: -transform.x / transform.k + window.innerWidth/2, 
                y: -transform.y / transform.k + window.innerHeight/2, 
                color: COLORS[Math.floor(Math.random() * COLORS.length)] 
            };
            graphData.current.nodes.push(newNode);
        }
        updateSimulation();
    }, [graphData, updateSimulation]);

    const handleToggle = useCallback((parentId, segKey, targetContentId, color) => {
        const stateKey = `${parentId}-${segKey}`;
        const parent = graphData.current.nodes.find(n => n.id === parentId);
        
        // Check if link exists
        const existingLinkIndex = graphData.current.links.findIndex(l => {
            const sourceId = l.source.id || l.source;
            const targetId = l.target.id || l.target;
            const targetNode = graphData.current.nodes.find(n => n.id === targetId);
            return sourceId === parentId && targetNode && targetNode.contentId === targetContentId;
        });

        if (existingLinkIndex !== -1) {
            // --- COLLAPSE ---
            const link = graphData.current.links[existingLinkIndex];
            const targetId = link.target.id || link.target;
            
            graphData.current.links.splice(existingLinkIndex, 1);
            
            // Check if orphan (no other incoming links)
            const hasOtherIncoming = graphData.current.links.some(l => (l.target.id || l.target) === targetId);
            
            if (!hasOtherIncoming) {
                // Recursively remove target and its descendants
                const toRemove = getDescendants(targetId, graphData.current.links);
                toRemove.add(targetId);
                
                graphData.current.nodes = graphData.current.nodes.filter(n => !toRemove.has(n.id));
                graphData.current.links = graphData.current.links.filter(l => {
                    const s = typeof l.source === 'object' ? l.source.id : l.source;
                    const t = typeof l.target === 'object' ? l.target.id : l.target;
                    return !toRemove.has(s) && !toRemove.has(t);
                });
            }
            
            setExpandedState(prev => {
                const next = { ...prev };
                delete next[stateKey];
                return next;
            });

        } else {
            // --- EXPAND ---
            const existingNode = graphData.current.nodes.find(n => n.contentId === targetContentId);
            
            if (existingNode) {
                // Connect to existing
                graphData.current.links.push({ source: parent.id, target: existingNode.id });
                setExpandedState(prev => ({ ...prev, [stateKey]: existingNode.id }));
            } else {
                // Create new
                if (!library[targetContentId]) {
                    setLibrary(prev => ({ ...prev, [targetContentId]: { title: targetContentId, type: "default", template: "\\text{New Node}", note: "Auto-generated.", segments: {} } }));
                }
                const newId = `${targetContentId}_${Date.now()}`;
                const newNode = { 
                    id: newId, 
                    contentId: targetContentId, 
                    x: parent.x + (Math.random() - 0.5) * 50, 
                    y: parent.y + 150, 
                    color: color || parent.color 
                };
                
                graphData.current.nodes.push(newNode);
                graphData.current.links.push({ source: parent.id, target: newNode.id });
                setExpandedState(prev => ({ ...prev, [stateKey]: newId }));
            }
        }
        updateSimulation();
    }, [graphData, library, setExpandedState, setLibrary, updateSimulation]);

    const handleSaveNode = useCallback((nodeId, newContentId, newData, newColor) => {
        const node = graphData.current.nodes.find(n => n.id === nodeId);
        if (node) {
            const oldContentId = node.contentId;
            node.color = newColor;
            
            // Propagate color to children if defined in segments
            if (newData.segments) {
                Object.values(newData.segments).forEach(seg => {
                    if (seg.type === 'link' && seg.target && seg.color) {
                        const childNodes = graphData.current.nodes.filter(n => n.contentId === seg.target);
                        childNodes.forEach(child => child.color = seg.color);
                    }
                });
            }

            // Update Library
            setLibrary(prev => {
                const newLib = { ...prev };
                if (newContentId !== oldContentId) { 
                    newLib[newContentId] = newData; 
                    delete newLib[oldContentId]; 
                    node.contentId = newContentId; 
                } else { 
                    newLib[oldContentId] = newData; 
                }
                
                // Update references in other nodes
                Object.keys(newLib).forEach(key => {
                    const item = newLib[key];
                    if (item.segments) {
                        let changed = false;
                        const updatedSegments = { ...item.segments };
                        Object.keys(updatedSegments).forEach(segKey => {
                            const seg = updatedSegments[segKey];
                            if (seg.type === 'link' && (seg.target === newContentId || seg.target === oldContentId)) {
                                if (seg.color !== newColor) { 
                                    updatedSegments[segKey] = { ...seg, color: newColor, target: newContentId }; 
                                    changed = true; 
                                }
                            }
                        });
                        if (changed) newLib[key] = { ...item, segments: updatedSegments };
                    }
                });
                return newLib;
            });
            setNodes([...graphData.current.nodes]);
        }
        if (setEditingNodeId) setEditingNodeId(null);
    }, [graphData, setLibrary, setNodes, setEditingNodeId]);

    return {
        addNode,
        spawnNode,
        deleteNode,
        toggleVisibility,
        handleToggle,
        handleSaveNode
    };
};
