import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export const useSimulation = (graphData, svgRef, settings, library, setNodes, setLinks, setTransform, handleCanvasContextMenu, isSpacePressed, viewModeRef, hoveredNodeId) => {
    const simulationRef = useRef(null);
    const zoomBehavior = useRef(null);

    // D3 Initialization
    useEffect(() => {
        // Simulation
        simulationRef.current = d3.forceSimulation(graphData.current.nodes)
            .force("charge", d3.forceManyBody().strength(-settings.gravity))
            .force("x", d3.forceX(0).strength(settings.centering / 2000))
            .force("y", d3.forceY(0).strength(settings.centering / 2000))
            .velocityDecay(0.8) // Add resistance/damping
            .force("link", d3.forceLink(graphData.current.links).id(d => d.id).distance(settings.distance).strength(0.5))
            .force("collide", d3.forceCollide().radius(d => {
                const content = library[d.contentId];
                if (!content) return 150;
                let r = 160; 
                if (content.type === 'note') r += 40;
                if (content.type === 'axiom') r += 20;
                const textLen = (content.template || "").length + (content.note || "").length;
                if (textLen > 100) r += 40;
                return r;
            }).strength(1).iterations(4))
            .on("tick", () => { 
                setNodes([...graphData.current.nodes]); 
                setLinks([...graphData.current.links]); 
            });
        
        let isDragging = false;

        // Zoom
        zoomBehavior.current = d3.zoom()
            .scaleExtent([0.1, 4])
            .filter((event) => {
                // Allow wheel zoom
                if (event.type === 'wheel') return true;
                
                // Allow Middle (1) or Right (2) button drag
                if (event.button === 1 || event.button === 2) return true;
                
                // Allow Left (0) button drag ONLY if Space key is pressed OR viewMode is enabled
                if (event.button === 0) {
                    return (isSpacePressed && isSpacePressed.current) || (viewModeRef && viewModeRef.current);
                }
                
                return false;
            })
            .on("start", () => { isDragging = false; })
            .on("zoom", (e) => { 
                isDragging = true;
                setTransform(e.transform); 
            });

        d3.select(svgRef.current)
            .call(zoomBehavior.current)
            .on("dblclick.zoom", null)
            // Attach Canvas Context Menu here
            .on("contextmenu", (event) => {
                // Prevent default context menu
                event.preventDefault();
                
                // If we just dragged, don't show menu
                if (isDragging) {
                    isDragging = false;
                    return;
                }
                
                handleCanvasContextMenu(event);
            }); 
        
        // Initial Center
        if (graphData.current.nodes.length > 0) {
           d3.select(svgRef.current).call(zoomBehavior.current.transform, d3.zoomIdentity.translate(window.innerWidth/2, window.innerHeight/2));
        }

        return () => simulationRef.current.stop();
    }, []); // Run once

    // Update Physics Settings
    useEffect(() => {
        if (simulationRef.current) { 
            simulationRef.current.force("charge").strength(-settings.gravity); 
            simulationRef.current.force("x").strength(settings.centering / 2000);
            simulationRef.current.force("y").strength(settings.centering / 2000);
            simulationRef.current.force("link").distance(d => {
                // Helper to estimate radius
                const getRadius = (node, isMinimalNode) => {
                    if (isMinimalNode) return 30; // Minimal mode radius (60px width)
                    
                    const content = library[node.contentId];
                    if (!content) return 50;
                    
                    // Reduced base radius for better gap estimation
                    let r = 80; 
                    if (content.type === 'note') r += 30;
                    if (content.type === 'axiom') r += 15;
                    const textLen = (content.template || "").length + (content.note || "").length;
                    if (textLen > 50) r += 20;
                    if (textLen > 100) r += 20;
                    return r;
                };

                // Determine if nodes are in minimal state
                const isSourceMinimal = settings.minimalMode && d.source.id !== hoveredNodeId;
                const isTargetMinimal = settings.minimalMode && d.target.id !== hoveredNodeId;

                const r1 = getRadius(d.source, isSourceMinimal);
                const r2 = getRadius(d.target, isTargetMinimal);

                // Calculate Gap
                // In minimal mode, we scale the gap by minimalGapRatio
                const baseGap = settings.distance;
                const gap = settings.minimalMode ? baseGap * (settings.minimalGapRatio || 0.5) : baseGap;

                return gap + r1 + r2;
            }); 
            
            // Update collision radius based on minimal mode and hover
            simulationRef.current.force("collide").radius(d => {
                const content = library[d.contentId];
                const padding = settings.collisionPadding || 10;
                
                if (!content) return 150 + padding;
                
                // Minimal Mode Logic
                if (settings.minimalMode) {
                    // If this node is hovered, use full size
                    if (d.id === hoveredNodeId) {
                        let r = 160; 
                        if (content.type === 'note') r += 40;
                        if (content.type === 'axiom') r += 20;
                        const textLen = (content.template || "").length + (content.note || "").length;
                        if (textLen > 100) r += 40;
                        return r + padding;
                    }
                    // Otherwise use small size
                    return 60 + padding;
                }

                // Normal Mode Logic
                let r = 160; 
                if (content.type === 'note') r += 40;
                if (content.type === 'axiom') r += 20;
                const textLen = (content.template || "").length + (content.note || "").length;
                if (textLen > 100) r += 40;
                return r + padding;
            });

            // Handle temporary pinning of hovered node to prevent jitter
            const nodes = simulationRef.current.nodes();
            nodes.forEach(n => {
                if (n.id === hoveredNodeId) {
                    // If not pinned by user, pin temporarily
                    if ((n.fx === null || n.fx === undefined) || n._tempFixed) {
                        n.fx = n.x;
                        n.fy = n.y;
                        n._tempFixed = true;
                    }
                } else {
                    // Release if it was temporarily pinned
                    if (n._tempFixed) {
                        n.fx = null;
                        n.fy = null;
                        n._tempFixed = false;
                    }
                }
            });

            simulationRef.current.alpha(0.1).restart(); 
        }
    }, [settings.gravity, settings.centering, settings.distance, library, settings.minimalMode, hoveredNodeId, settings.minimalGapRatio, settings.collisionPadding]);

    return { simulationRef, zoomBehavior };
};
