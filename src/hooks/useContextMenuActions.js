import { useCallback } from 'react';
import * as d3 from 'd3';

export const useContextMenuActions = ({
    contextMenu,
    setContextMenu,
    graphData,
    library,
    setLibrary,
    clipboard,
    setClipboard,
    setEditingNodeId,
    updateSimulation,
    svgRef,
    zoomBehavior,
    expandedState,
    setExpandedState,
    transform,
    actions, // from useGraphActions
    selectedNodeIds = [],
    onRequestDelete // New callback for delete request
}) => {
    const { spawnNode, deleteNode, toggleVisibility, alignNodes } = actions;

    const handleContextAction = useCallback((action) => {
        const { x, y, targetId } = contextMenu;
        setContextMenu(prev => ({ ...prev, visible: false }));

        switch (action) {
            case 'align_left': alignNodes(selectedNodeIds, 'left'); break;
            case 'align_right': alignNodes(selectedNodeIds, 'right'); break;
            case 'align_top': alignNodes(selectedNodeIds, 'top'); break;
            case 'align_bottom': alignNodes(selectedNodeIds, 'bottom'); break;
            case 'align_center_h': alignNodes(selectedNodeIds, 'center_h'); break;
            case 'align_center_v': alignNodes(selectedNodeIds, 'center_v'); break;

            case 'new':
                // Create new node at mouse position if available, else center
                const newContentId = `topic_${Date.now()}`; 
                setLibrary(prev => ({ 
                    ...prev, 
                    [newContentId]: { title: "New Topic", type: "default", template: "\\text{New Node}", note: "Edit this node to add content.", segments: {} } 
                }));
                spawnNode(newContentId, x, y, transform);
                break;
            case 'refresh':
                d3.select(svgRef.current).transition().duration(750)
                    .call(zoomBehavior.current.transform, d3.zoomIdentity.translate(window.innerWidth/2, window.innerHeight/2).scale(1));
                updateSimulation(); // This might need to be simulationRef.current.alpha(1).restart() if updateSimulation does more
                break;
            case 'auto_arrange':
                updateSimulation();
                break;
            case 'expand_all':
                // Expand all visible nodes that have hidden children
                let changed = false;
                const newLinks = [];
                const newNodes = [];
                const newExpandedState = { ...expandedState };

                graphData.current.nodes.forEach(node => {
                    const content = library[node.contentId];
                    if (content && content.segments) {
                        Object.entries(content.segments).forEach(([segKey, seg]) => {
                            if (seg.type === 'link' && seg.target) {
                                const targetId = seg.target;
                                // Check if link already exists
                                const linkExists = graphData.current.links.some(l => {
                                    const s = typeof l.source === 'object' ? l.source.id : l.source;
                                    const t = typeof l.target === 'object' ? l.target.id : l.target;
                                    const tNode = graphData.current.nodes.find(n => n.id === t);
                                    return s === node.id && tNode && tNode.contentId === targetId;
                                });

                                if (!linkExists) {
                                    const existingTargetNode = graphData.current.nodes.find(n => n.contentId === targetId);
                                    let targetNodeId;

                                    if (existingTargetNode) {
                                        targetNodeId = existingTargetNode.id;
                                    } else {
                                        // Create new node
                                        targetNodeId = `node_${targetId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                                        newNodes.push({
                                            id: targetNodeId,
                                            contentId: targetId,
                                            x: node.x + (Math.random() - 0.5) * 50,
                                            y: node.y + 150,
                                            color: node.color
                                        });
                                    }
                                    
                                    newLinks.push({ source: node.id, target: targetNodeId });
                                    newExpandedState[`${node.id}-${segKey}`] = targetNodeId;
                                    changed = true;
                                }
                            }
                        });
                    }
                });

                if (changed) {
                    graphData.current.nodes.push(...newNodes);
                    graphData.current.links.push(...newLinks);
                    setExpandedState(newExpandedState);
                    updateSimulation();
                }
                break;
            case 'collapse':
                // Collapse all to root nodes?
                // Keep nodes that have NO incoming links (roots)
                const rootNodes = graphData.current.nodes.filter(n => {
                    const incoming = graphData.current.links.some(l => {
                        const t = typeof l.target === 'object' ? l.target.id : l.target;
                        return t === n.id;
                    });
                    return !incoming;
                });
                
                // Fallback if circular or something
                const safeNodes = rootNodes.length > 0 ? rootNodes : [graphData.current.nodes[0]];
                
                graphData.current.nodes = safeNodes;
                graphData.current.links = [];
                setExpandedState({});
                updateSimulation();
                break;
            case 'copy':
                if (targetId) {
                    const node = graphData.current.nodes.find(n => n.id === targetId);
                    if (node && library[node.contentId]) {
                        setClipboard({ content: library[node.contentId], color: node.color });
                    }
                }
                break;
            case 'cut':
                if (targetId) {
                    const node = graphData.current.nodes.find(n => n.id === targetId);
                    if (node && library[node.contentId]) {
                        setClipboard({ content: library[node.contentId], color: node.color });
                        deleteNode(targetId);
                    }
                }
                break;
            case 'paste':
                if (clipboard) {
                    const copyId = `copy_${Date.now()}`;
                    setLibrary(prev => ({ ...prev, [copyId]: { ...clipboard.content, title: clipboard.content.title + " (Copy)" } }));
                    spawnNode(copyId, x, y, transform);
                }
                break;
            case 'paste_connect':
                if (clipboard && targetId) {
                    const copyId = `copy_${Date.now()}`;
                    setLibrary(prev => ({ ...prev, [copyId]: { ...clipboard.content, title: clipboard.content.title + " (Copy)" } }));
                    spawnNode(copyId, x + 50, y + 50, transform, targetId);
                }
                break;
            case 'edit':
                if (targetId) setEditingNodeId(targetId);
                break;
            case 'hide':
                if (targetId) {
                    const node = graphData.current.nodes.find(n => n.id === targetId);
                    if(node) toggleVisibility(node.contentId);
                }
                break;
            case 'delete':
                if (onRequestDelete) {
                    onRequestDelete(targetId);
                } else if (targetId) {
                    deleteNode(targetId);
                }
                break;
            default: break;
        }
    }, [contextMenu, setContextMenu, graphData, library, setLibrary, clipboard, setClipboard, setEditingNodeId, updateSimulation, svgRef, zoomBehavior, expandedState, setExpandedState, transform, spawnNode, deleteNode, toggleVisibility, selectedNodeIds, onRequestDelete]);

    return handleContextAction;
};
