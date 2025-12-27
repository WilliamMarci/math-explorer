import { useState, useRef, useEffect } from 'react';

export const usePanelResize = (initialWidth = 256, minWidth = 160, maxWidth = 600, direction = 'left') => {
    const [width, setWidth] = useState(initialWidth);
    const isResizing = useRef(false);

    const handleMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing.current = true;
        const startX = e.clientX;
        const startWidth = width;

        const handleMouseMove = (moveEvent) => {
            if (!isResizing.current) return;
            
            let newWidth;
            if (direction === 'left') {
                // Panel is on the right, dragging left increases width
                newWidth = startWidth + (startX - moveEvent.clientX);
            } else {
                // Panel is on the left, dragging right increases width
                newWidth = startWidth + (moveEvent.clientX - startX);
            }

            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'ew-resize';
    };

    return { width, handleMouseDown };
};
