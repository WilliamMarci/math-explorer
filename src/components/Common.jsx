import React, { useEffect, useRef, useMemo } from 'react';
import katex from 'katex';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import { marked } from 'marked';

export const InteractiveMath = ({ template, segments, nodeId, onToggle, onHover }) => {
    const containerRef = useRef(null);
    const finalLatex = useMemo(() => {
        if (!template) return "";
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            const seg = segments[key];
            if (!seg) return "\\text{?}";
            const content = seg.type === 'link' && seg.color 
                ? `\\textcolor{${seg.color}}{${seg.text}}` 
                : seg.text;
            return `\\htmlId{seg-${nodeId}-${key}}{${content}}`;
        });
    }, [template, segments, nodeId]);

    useEffect(() => {
        if (containerRef.current) katex.render(finalLatex, containerRef.current, { throwOnError: false, trust: true });
    }, [finalLatex]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleClick = (e) => {
            const target = e.target.closest('[id^="seg-"]');
            if (!target) return;
            const idParts = target.id.split('-'); const key = idParts.pop(); const targetNodeId = idParts.slice(1).join('-');
            if (targetNodeId !== nodeId) return;
            const seg = segments[key];
            if (seg && seg.type === 'link') { e.stopPropagation(); onToggle(nodeId, key, seg.target, seg.color); }
        };
        const handleMouseOver = (e) => {
            const target = e.target.closest('[id^="seg-"]');
            if (target) {
                const key = target.id.split('-').pop(); const seg = segments[key];
                if (seg) { target.style.opacity = "0.6"; target.style.cursor = seg.type === 'link' ? "pointer" : "default"; if (seg.tooltip) onHover(e, seg.tooltip); }
            }
        };
        const handleMouseOut = (e) => {
            const target = e.target.closest('[id^="seg-"]');
            if (target) { target.style.opacity = "1"; onHover(null, null); }
        };
        container.addEventListener('click', handleClick); container.addEventListener('mouseover', handleMouseOver); container.addEventListener('mouseout', handleMouseOut);
        return () => { container.removeEventListener('click', handleClick); container.removeEventListener('mouseover', handleMouseOver); container.removeEventListener('mouseout', handleMouseOut); };
    }, [segments, nodeId, onToggle, onHover]);

    return <div ref={containerRef} className="interactive-math-container" />;
};

export const RichViewer = ({ content, type = 'markdown' }) => {
    const ref = useRef(null);
    useEffect(() => {
        if (!ref.current) return;
        if (type === 'svg') { 
            ref.current.innerHTML = content; 
        } else if (type === 'latex') { 
            katex.render(content, ref.current, { throwOnError: false }); 
        } else { 
            ref.current.innerHTML = marked.parse(content || ""); 
            renderMathInElement(ref.current, { delimiters: [{left: "$$", right: "$$", display: true}, {left: "$", right: "$", display: false}], throwOnError: false }); 
        }
    }, [content, type]);
    return <div ref={ref} className={type === 'svg' ? 'tooltip-svg' : 'node-note'} />;
};