import { useState, useRef } from 'react';
import { FALLBACK_LIBRARY, FALLBACK_NODES } from '../constants';

export const useGraphState = (initialScene) => {
    const [library, setLibrary] = useState(initialScene?.library || FALLBACK_LIBRARY);
    const [nodes, setNodes] = useState(initialScene?.scene?.nodes || FALLBACK_NODES);
    const [links, setLinks] = useState(initialScene?.scene?.links || []);
    const [expandedState, setExpandedState] = useState(initialScene?.scene?.expandedState || {});
    
    // Mutable graph data for D3
    const graphData = useRef({ nodes: [...nodes], links: [...links] });

    return {
        library, setLibrary,
        nodes, setNodes,
        links, setLinks,
        expandedState, setExpandedState,
        graphData
    };
};
