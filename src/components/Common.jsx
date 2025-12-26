import React, { useEffect, useRef, useMemo } from 'react';
import katex from 'katex';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import { marked } from 'marked';
import 'katex/dist/katex.min.css';

// Configure marked options
try {
    marked.setOptions({
        gfm: true,
        breaks: true
    });
} catch (e) {
    console.warn("Marked config warning:", e);
}

// --- Interactive Math Renderer ---
export const InteractiveMath = ({ template, segments, nodeId, onToggle, onHover }) => {
    const containerRef = useRef(null);

    const finalLatex = useMemo(() => {
        if (!template) return "";
        // 保持你原有的正则，只匹配 \w+ (字母数字下划线)
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            const seg = segments?.[key];
            if (!seg) return "\\text{?}"; 
            
            const contentText = seg.text || seg.label || key;
            
            // Apply color if it's a link
            const content = (seg.type === 'link' && seg.color)
                ? `\\textcolor{${seg.color}}{${contentText}}` 
                : contentText;
            
            // Wrap in htmlId for event targeting and htmlClass for styling (hit area)
            return `\\htmlId{seg-${nodeId}-${key}}{\\htmlClass{interactive-math-elem}{${content}}}`;
        });
    }, [template, segments, nodeId]);

    useEffect(() => {
        if (containerRef.current) {
            try {
                katex.render(finalLatex, containerRef.current, { 
                    throwOnError: false, 
                    trust: true, // Required for \htmlId and \htmlClass
                    displayMode: true, // <--- 确保开启 Display Mode
                    strict: false
                });
            } catch (e) {
                console.error("KaTeX Render Error:", e);
                containerRef.current.innerHTML = `<span style="color:red">Error: ${e.message}</span>`;
            }
        }
    }, [finalLatex]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleClick = (e) => {
            const target = e.target.closest('[id^="seg-"]');
            if (!target) return;

            const idParts = target.id.split('-'); 
            const key = idParts.pop(); 
            const targetNodeId = idParts.slice(1).join('-');

            if (targetNodeId !== nodeId) return;

            const seg = segments?.[key];
            if (seg && seg.type === 'link') { 
                e.stopPropagation(); 
                e.preventDefault();
                // --- 仅修改此处：传递 label 和 style ---
                onToggle(
                    nodeId, 
                    key, 
                    seg.target, 
                    seg.color, 
                    seg.connectionLabel, // New
                    seg.connectionStyle  // New
                ); 
                // -----------------------------------
            }
        };

        const handleMouseOver = (e) => {
            const target = e.target.closest('[id^="seg-"]');
            if (target) {
                const key = target.id.split('-').pop(); 
                const seg = segments?.[key];
                if (seg) { 
                    target.style.opacity = "0.6"; 
                    target.style.cursor = seg.type === 'link' ? "pointer" : "default"; 
                    if (onHover && seg.tooltip) onHover(e, seg.tooltip); 
                }
            }
        };

        const handleMouseOut = (e) => {
            const target = e.target.closest('[id^="seg-"]');
            if (target) { 
                target.style.opacity = "1"; 
                if (onHover) onHover(null, null); 
            }
        };

        container.addEventListener('click', handleClick); 
        container.addEventListener('mouseover', handleMouseOver); 
        container.addEventListener('mouseout', handleMouseOut);
        
        return () => { 
            container.removeEventListener('click', handleClick); 
            container.removeEventListener('mouseover', handleMouseOver); 
            container.removeEventListener('mouseout', handleMouseOut); 
        };
    }, [segments, nodeId, onToggle, onHover]);

    return <div ref={containerRef} className="interactive-math-container my-2 select-none" />;
};

// --- Rich Text Viewer (Enhanced) ---
export const RichViewer = ({ content, type = 'markdown', className, inline = false }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current || !content) return;
        
        if (type === 'svg') { 
            ref.current.innerHTML = content; 
        } else if (type === 'latex') { 
            katex.render(content, ref.current, { throwOnError: false }); 
        } else { 
            // Markdown Mode
            try {
                let html = marked.parse(String(content));
                
                // Remove wrapping <p> tag if inline mode is enabled
                if (inline) {
                    html = html.replace(/^<p>(.*?)<\/p>\s*$/s, '$1');
                }

                ref.current.innerHTML = html; 
                
                renderMathInElement(ref.current, { 
                    delimiters: [
                        {left: "$$", right: "$$", display: true}, 
                        {left: "$", right: "$", display: false}
                    ], 
                    throwOnError: false 
                }); 
            } catch (e) {
                ref.current.innerHTML = "Error rendering content";
            }
        }
    }, [content, type, inline]);

    const Tag = inline ? 'span' : 'div';
    
    // Use provided className or default based on type
    const finalClass = className !== undefined 
        ? className 
        : (type === 'svg' ? 'tooltip-svg' : 'markdown-body text-xs text-slate-600 leading-relaxed');

    return <Tag ref={ref} className={finalClass} />;
};