import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export const useSimulation = (graphData, svgRef, settings, library, setNodes, setLinks, setTransform, handleCanvasContextMenu, isSpacePressed) => {
    const simulationRef = useRef(null);
    const zoomBehavior = useRef(null);

    // D3 Initialization
    useEffect(() => {
        // Simulation
        simulationRef.current = d3.forceSimulation(graphData.current.nodes)
            .force("charge", d3.forceManyBody().strength(-settings.gravity))
            .force("x", d3.forceX(0).strength(settings.centering / 2000))
            .force("y", d3.forceY(0).strength(settings.centering / 2000))
            .force("link", d3.forceLink(graphData.current.links).id(d => d.id).distance(settings.distance))
            .force("collide", d3.forceCollide().radius(d => {
                const content = library[d.contentId];
                if (!content) return 150;
                let r = 160; 
                if (content.type === 'note') r += 40;
                if (content.type === 'axiom') r += 20;
                const textLen = (content.template || "").length + (content.note || "").length;
                if (textLen > 100) r += 40;
                return r;
            }).strength(0.8).iterations(2))
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
                
                // Allow Left (0) button drag ONLY if Space key is pressed
                if (event.button === 0) {
                    return isSpacePressed && isSpacePressed.current;
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
            simulationRef.current.force("link").distance(settings.distance); 
            simulationRef.current.alpha(0.3).restart(); 
        }
    }, [settings.gravity, settings.centering, settings.distance, library]);

    return { simulationRef, zoomBehavior };
};
