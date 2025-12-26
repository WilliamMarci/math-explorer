import { useState, useRef, useCallback, useEffect } from 'react';
import * as d3 from 'd3';

export const useCanvasInteraction = ({
    svgRef,
    transform,
    nodes,
    selectedNodeIds,
    setSelectedNodeIds,
    simulationRef,
    setFocusedNodeId,
    viewMode,
    isSpacePressed,
    onDragEnd
}) => {
    const [selectionBox, setSelectionBox] = useState(null);
    const dragState = useRef(null); // { startX, startY, nodes: [{ id, initialFx, initialFy, offsetX, offsetY }] }

    // --- Selection Logic ---
    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return;
        if ((isSpacePressed && isSpacePressed.current) || viewMode) return;

        // If clicking on canvas (not a node), start selection box
        // Note: Node clicks stop propagation, so if we are here, it's canvas.
        
        const rect = svgRef.current.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        
        setSelectionBox({ startX, startY, currentX: startX, currentY: startY });
        
        // Clear selection if not holding Shift/Ctrl (standard behavior)
        if (!e.shiftKey && !e.ctrlKey) {
            setSelectedNodeIds([]);
        }
    }, [svgRef, isSpacePressed, viewMode, setSelectedNodeIds]);

    const handleMouseMove = useCallback((e) => {
        if (!selectionBox) return;
        
        const rect = svgRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        setSelectionBox(prev => ({ ...prev, currentX, currentY }));
    }, [selectionBox, svgRef]);

    const handleMouseUp = useCallback((e) => {
        if (!selectionBox) return;
        
        const x1 = Math.min(selectionBox.startX, selectionBox.currentX);
        const y1 = Math.min(selectionBox.startY, selectionBox.currentY);
        const x2 = Math.max(selectionBox.startX, selectionBox.currentX);
        const y2 = Math.max(selectionBox.startY, selectionBox.currentY);
        
        // Filter nodes
        const newSelected = nodes.filter(node => {
            const nx = node.x * transform.k + transform.x;
            const ny = node.y * transform.k + transform.y;
            return nx >= x1 && nx <= x2 && ny >= y1 && ny <= y2;
        }).map(n => n.id);
        
        setSelectedNodeIds(prev => {
            if (e.shiftKey || e.ctrlKey) {
                // Add to existing
                const set = new Set([...prev, ...newSelected]);
                return Array.from(set);
            }
            return newSelected;
        });
        
        setSelectionBox(null);
    }, [selectionBox, nodes, transform, setSelectedNodeIds]);

    // --- Drag Logic ---
    const handleDragStart = useCallback((e, node) => {
        if (e.button !== 0 || e.target.closest('button')) return; 
        
        if (viewMode) return; // Don't stop propagation, so it bubbles to zoom handler (panning)
        
        e.stopPropagation();

        setFocusedNodeId(node.id);
        
        // Handle Selection Logic on Click
        let newSelectedIds = [...selectedNodeIds];
        if (!selectedNodeIds.includes(node.id)) {
            if (e.ctrlKey || e.shiftKey) {
                newSelectedIds.push(node.id);
                setSelectedNodeIds(newSelectedIds);
            } else {
                newSelectedIds = [node.id];
                setSelectedNodeIds(newSelectedIds);
            }
        } else {
             if (e.ctrlKey) {
                 // Deselect if already selected and ctrl clicked? 
                 // Usually drag doesn't deselect unless it's a click without drag.
                 // We'll handle deselect on click in a separate handler if needed.
             }
        }

        simulationRef.current.alphaTarget(0.3).restart(); 
        
        const svg = svgRef.current;
        const rect = svg.getBoundingClientRect();
        
        // Prepare drag state for ALL selected nodes
        const nodesToDrag = nodes.filter(n => newSelectedIds.includes(n.id));
        
        const dragNodesData = nodesToDrag.map(n => {
            // Store initial pin state
            const wasPinned = n.fx !== null && n.fx !== undefined;
            
            // Fix position for drag
            n.fx = n.x;
            n.fy = n.y;
            
            // Calculate offset
            const mouseX = ((e.clientX - rect.left) - transform.x) / transform.k;
            const mouseY = ((e.clientY - rect.top) - transform.y) / transform.k;
            
            return {
                node: n,
                wasPinned,
                offsetX: n.x - mouseX,
                offsetY: n.y - mouseY
            };
        });

        dragState.current = {
            nodes: dragNodesData,
            isCtrlPressed: e.ctrlKey
        };

        const move = (ev) => { 
            const curX = ((ev.clientX - rect.left) - transform.x) / transform.k;
            const curY = ((ev.clientY - rect.top) - transform.y) / transform.k;
            
            dragState.current.nodes.forEach(item => {
                item.node.fx = curX + item.offsetX;
                item.node.fy = curY + item.offsetY;
            });
        };
        
        const up = () => { 
            simulationRef.current.alphaTarget(0); 
            window.removeEventListener('mousemove', move); 
            window.removeEventListener('mouseup', up); 
            
            if (dragState.current) {
                dragState.current.nodes.forEach(item => {
                    // Restore pin state logic
                    if (!dragState.current.isCtrlPressed && !item.wasPinned) {
                        item.node.fx = null;
                        item.node.fy = null;
                    }
                });
                
                // Trigger onDragEnd if moved
                if (onDragEnd) onDragEnd();

                dragState.current = null;
            }
        };
        
        window.addEventListener('mousemove', move); 
        window.addEventListener('mouseup', up);
    }, [nodes, selectedNodeIds, setSelectedNodeIds, simulationRef, svgRef, transform, setFocusedNodeId, viewMode]);

    // Attach global listeners for selection box
    useEffect(() => {
        if (selectionBox) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [selectionBox, handleMouseMove, handleMouseUp]);

    return {
        selectionBox,
        handleMouseDown,
        handleDragStart
    };
};
