import { useCallback, useRef, useMemo } from 'react';
import { COLORS } from '../theme';
import { getDescendants } from '../utils/graphUtils';

export const useGraphActions = ({
    graphData,
    setLibrary,
    setExpandedState,
    setNodes,
    updateSimulation,
    setEditingNodeId,
    library,
    setNodeOrder
}) => {
    const nodeCache = useRef({});

    // Pre-calculate reverse connections (target -> sources) for faster parent lookup
    const reverseConnections = useMemo(() => {
        const map = {};
        Object.entries(library).forEach(([sourceId, content]) => {
            if (content.segments) {
                Object.entries(content.segments).forEach(([segKey, seg]) => {
                    if (seg.type === 'link' && seg.target) {
                        if (!map[seg.target]) map[seg.target] = [];
                        map[seg.target].push({ sourceId, segKey });
                    }
                });
            }
        });
        return map;
    }, [library]);

    const addNode = useCallback((transform, type = 'default') => {
        const newContentId = `topic_${Date.now()}`; 
        const newNodeId = `node_${Date.now()}`;
        setLibrary(prev => ({ 
            ...prev, 
            [newContentId]: { title: "New Topic", type: type, template: "\\text{New Node}", note: "Edit this node to add content.", segments: {} } 
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
            const node = graphData.current.nodes.find(n => n.id === nodeId);
            const contentId = node ? node.contentId : null;
            
            graphData.current.nodes = graphData.current.nodes.filter(n => n.id !== nodeId);
            graphData.current.links = graphData.current.links.filter(l => (l.source.id || l.source) !== nodeId && (l.target.id || l.target) !== nodeId);
            updateSimulation();
            if (setEditingNodeId) setEditingNodeId(null);
            
            // Remove from nodeOrder if present
            if (contentId) {
                // Remove ALL nodes with this contentId to prevent ghosts
                graphData.current.nodes = graphData.current.nodes.filter(n => n.contentId !== contentId);
                
                setNodeOrder(prev => prev.filter(cid => cid !== contentId));
                // Remove from library to remove from explorer
                setLibrary(prev => {
                    const next = { ...prev };
                    delete next[contentId];
                    return next;
                });
            }
            return true;
        }
        return false;
    }, [graphData, updateSimulation, setEditingNodeId, setNodeOrder, setLibrary]);

    const toggleVisibility = useCallback((contentId, transform) => {
        const existingNode = graphData.current.nodes.find(n => n.contentId === contentId);
        
        if (existingNode) {
            // HIDE: Recursive
            // Cache the node state before hiding
            nodeCache.current[contentId] = { ...existingNode };

            // Optimize getDescendants by building adjacency list first
            const links = graphData.current.links;
            const adj = {};
            links.forEach(l => {
                const s = l.source.id || l.source;
                const t = l.target.id || l.target;
                if (!adj[s]) adj[s] = [];
                adj[s].push(t);
            });

            const toRemove = new Set();
            const stack = [existingNode.id];
            toRemove.add(existingNode.id);

            while (stack.length > 0) {
                const curr = stack.pop();
                const children = adj[curr];
                if (children) {
                    children.forEach(childId => {
                        if (!toRemove.has(childId)) {
                            toRemove.add(childId);
                            stack.push(childId);
                            // Also cache children
                            const childNode = graphData.current.nodes.find(n => n.id === childId);
                            if (childNode) nodeCache.current[childNode.contentId] = { ...childNode };
                        }
                    });
                }
            }
            
            graphData.current.nodes = graphData.current.nodes.filter(n => !toRemove.has(n.id));
            graphData.current.links = graphData.current.links.filter(l => {
                const s = typeof l.source === 'object' ? l.source.id : l.source;
                const t = typeof l.target === 'object' ? l.target.id : l.target;
                return !toRemove.has(s) && !toRemove.has(t);
            });
        } else {
            // SHOW
            let newNode;
            // Check cache first
            if (nodeCache.current[contentId]) {
                const cached = nodeCache.current[contentId];
                newNode = {
                    ...cached,
                    // Ensure ID is unique if we want to avoid conflicts, or reuse if safe.
                    // Reusing ID is better for stability if it doesn't conflict.
                    // But if we deleted it, it's gone from graphData, so reusing ID is fine.
                    // However, let's generate new ID to be safe against some edge cases, 
                    // but keep x,y,fx,fy,color.
                    id: cached.id, // Try reusing ID to keep connections stable if any external refs exist
                    x: cached.x,
                    y: cached.y,
                    fx: cached.fx,
                    fy: cached.fy,
                    color: cached.color
                };
                // Verify ID uniqueness just in case
                if (graphData.current.nodes.some(n => n.id === newNode.id)) {
                    newNode.id = `node_${Date.now()}`;
                }
            } else {
                let foundColor = null;
                // Try to find color from a parent link (using reverseConnections)
                const potentialParents = reverseConnections[contentId] || [];
                for (const p of potentialParents) {
                     // We need to check if this parent is active.
                     // But we don't have easy access to parent node object here without lookup.
                     // We can check activeNodeMap if we had one, or just find.
                     const parentNode = graphData.current.nodes.find(n => n.contentId === p.sourceId);
                     if (parentNode) {
                         const parentContent = library[p.sourceId];
                         if (parentContent && parentContent.segments && parentContent.segments[p.segKey]) {
                             const seg = parentContent.segments[p.segKey];
                             if (seg.color) {
                                 foundColor = seg.color;
                                 break;
                             }
                         }
                     }
                }

                newNode = { 
                    id: `node_${Date.now()}`, 
                    contentId: contentId, 
                    x: -transform.x / transform.k + window.innerWidth/2, 
                    y: -transform.y / transform.k + window.innerHeight/2, 
                    color: foundColor || COLORS[Math.floor(Math.random() * COLORS.length)] 
                };
            }
            
            graphData.current.nodes.push(newNode);

            const newLinks = [];
            const newExpandedUpdates = {};
            
            // Create a Set for fast link lookup
            const existingLinkKeys = new Set();
            graphData.current.links.forEach(l => {
                const s = l.source.id || l.source;
                const t = l.target.id || l.target;
                existingLinkKeys.add(`${s}-${t}`);
            });

            // Check for parents and connect (Incoming links) - Optimized using reverseConnections
            const potentialParents = reverseConnections[contentId] || [];
            potentialParents.forEach(p => {
                // Find if parent is active
                const parentNode = graphData.current.nodes.find(n => n.contentId === p.sourceId);
                if (parentNode) {
                    const linkKey = `${parentNode.id}-${newNode.id}`;
                    if (!existingLinkKeys.has(linkKey)) {
                        newLinks.push({ source: parentNode.id, target: newNode.id });
                        existingLinkKeys.add(linkKey);
                        newExpandedUpdates[`${parentNode.id}-${p.segKey}`] = newNode.id;
                    }
                }
            });

            // Check for children and connect (Outgoing links)
            const newContent = library[contentId];
            if (newContent && newContent.segments) {
                Object.entries(newContent.segments).forEach(([segKey, seg]) => {
                    if (seg.type === 'link' && seg.target) {
                        const targetNode = graphData.current.nodes.find(n => n.contentId === seg.target && n.id !== newNode.id);
                        if (targetNode) {
                            const linkKey = `${newNode.id}-${targetNode.id}`;
                            if (!existingLinkKeys.has(linkKey)) {
                                newLinks.push({ source: newNode.id, target: targetNode.id });
                                existingLinkKeys.add(linkKey);
                                newExpandedUpdates[`${newNode.id}-${segKey}`] = targetNode.id;
                                // Sync color
                                if (seg.color) {
                                    targetNode.color = seg.color;
                                }
                            }
                        }
                    }
                });
            }

            if (newLinks.length > 0) {
                graphData.current.links.push(...newLinks);
            }
            
            if (Object.keys(newExpandedUpdates).length > 0) {
                setExpandedState(prev => ({ ...prev, ...newExpandedUpdates }));
            }
        }
        updateSimulation();
    }, [graphData, updateSimulation, library, setExpandedState, reverseConnections]);

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
