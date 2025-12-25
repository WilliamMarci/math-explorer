// Theme Definitions

export const THEME_PRESETS = {
    classic: {
        '--bg': '#f8fafc', 
        '--grid': '#e2e8f0', 
        '--card-bg': '#ffffff', 
        '--text': '#0f172a', 
        '--border': '#cbd5e1', 
        '--shadow': 'rgba(0,0,0,0.08)', 
        '--accent': '#3b82f6',
        '--muted': '#64748b'
    },
    blackboard: {
        '--bg': '#1e293b', 
        '--grid': '#334155', 
        '--card-bg': '#334155', 
        '--text': '#f1f5f9', 
        '--border': '#475569', 
        '--shadow': 'rgba(0,0,0,0.3)', 
        '--accent': '#60a5fa',
        '--muted': '#94a3b8'
    },
    blueprint: {
        '--bg': '#1e40af', 
        '--grid': '#3b82f6', 
        '--card-bg': '#172554', 
        '--text': '#ffffff', 
        '--border': '#60a5fa', 
        '--shadow': 'rgba(0,0,0,0.2)', 
        '--accent': '#93c5fd',
        '--muted': '#bfdbfe'
    },
    sepia: {
        '--bg': '#fdf6e3', 
        '--grid': '#eee8d5', 
        '--card-bg': '#fdf6e3', 
        '--text': '#586e75', 
        '--border': '#d33682', 
        '--shadow': 'rgba(0,0,0,0.1)', 
        '--accent': '#b58900',
        '--muted': '#93a1a1'
    }
};

export const COLORS = [
    '#0f172a', // Slate
    '#dc2626', // Red
    '#ea580c', // Orange
    '#d97706', // Amber
    '#16a34a', // Green
    '#2563eb', // Blue
    '#4f46e5', // Indigo
    '#9333ea', // Purple
    '#db2777'  // Pink
];

export const NODE_TYPES = ['default', 'axiom', 'constant', 'parameter', 'note'];