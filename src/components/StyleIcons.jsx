import React from 'react';

export const StyleIcons = {
    arrow: (
        <svg width="30" height="10" viewBox="0 0 30 10" className="text-current overflow-visible">
            <line x1="0" y1="5" x2="22" y2="5" stroke="currentColor" strokeWidth="2" />
            <path d="M22,2 L30,5 L22,8" fill="currentColor" />
        </svg>
    ),
    line: (
        <svg width="30" height="10" viewBox="0 0 30 10" className="text-current overflow-visible">
            <line x1="0" y1="5" x2="30" y2="5" stroke="currentColor" strokeWidth="2" />
        </svg>
    ),
    circle: (
        <svg width="30" height="10" viewBox="0 0 30 10" className="text-current overflow-visible">
            <line x1="0" y1="5" x2="24" y2="5" stroke="currentColor" strokeWidth="2" />
            <circle cx="27" cy="5" r="3" fill="currentColor" />
        </svg>
    ),
    diamond: (
        <svg width="30" height="10" viewBox="0 0 30 10" className="text-current overflow-visible">
            <line x1="0" y1="5" x2="22" y2="5" stroke="currentColor" strokeWidth="2" />
            <path d="M22,5 L26,2 L30,5 L26,8 Z" fill="currentColor" />
        </svg>
    ),
    hollow: (
        <svg width="30" height="10" viewBox="0 0 30 10" className="text-current overflow-visible">
            <line x1="0" y1="5" x2="22" y2="5" stroke="currentColor" strokeWidth="2" />
            <path d="M22,2 L30,5 L22,8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    )
};

export const DashIcons = {
    solid: (
        <svg width="30" height="10" viewBox="0 0 30 10" className="text-current overflow-visible">
            <line x1="0" y1="5" x2="30" y2="5" stroke="currentColor" strokeWidth="2" />
        </svg>
    ),
    dashed: (
        <svg width="30" height="10" viewBox="0 0 30 10" className="text-current overflow-visible">
            <line x1="0" y1="5" x2="30" y2="5" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" />
        </svg>
    ),
    dotted: (
        <svg width="30" height="10" viewBox="0 0 30 10" className="text-current overflow-visible">
            <line x1="0" y1="5" x2="30" y2="5" stroke="currentColor" strokeWidth="2" strokeDasharray="1,3" strokeLinecap="round" />
        </svg>
    )
};
