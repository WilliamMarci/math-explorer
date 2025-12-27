import { useState, useEffect, useLayoutEffect } from 'react';

export const useMenuPosition = (ref, visible, x, y, options = {}) => {
    const [position, setPosition] = useState({ top: y, left: x });
    const { offset = 0, align = 'start', direction = 'bottom' } = options;

    useLayoutEffect(() => {
        if (visible && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            
            let newTop = y;
            let newLeft = x;

            // Basic positioning based on direction (default bottom-right of cursor/point)
            // If direction is 'bottom', we start at y.
            // If direction is 'right', we start at x.
            
            // Vertical adjustment
            if (newTop + rect.height > winH) {
                // Flip to top
                newTop = y - rect.height;
            }
            
            // Horizontal adjustment
            if (newLeft + rect.width > winW) {
                // Flip to left
                newLeft = x - rect.width;
            }

            // Ensure it doesn't go off-screen top/left
            if (newTop < 0) newTop = 0;
            if (newLeft < 0) newLeft = 0;

            setPosition({ top: newTop, left: newLeft });
        }
    }, [x, y, visible, ref, offset, align, direction]);

    return position;
};
