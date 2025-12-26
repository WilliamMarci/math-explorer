import { useState, useCallback } from 'react';

export const useHistory = (initialState) => {
    const [history, setHistory] = useState([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const pushState = useCallback((newState) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, currentIndex + 1);
            // Limit history size if needed
            if (newHistory.length > 50) newHistory.shift();
            return [...newHistory, newState];
        });
        setCurrentIndex(prev => {
            const newIdx = prev + 1;
            return newIdx > 50 ? 50 : newIdx;
        });
    }, [currentIndex]);

    const undo = useCallback(() => {
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            return history[newIndex];
        }
        return null;
    }, [currentIndex, history]);

    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            return history[newIndex];
        }
        return null;
    }, [currentIndex, history]);

    return { 
        pushState, 
        undo, 
        redo, 
        canUndo: currentIndex > 0, 
        canRedo: currentIndex < history.length - 1 
    };
};
