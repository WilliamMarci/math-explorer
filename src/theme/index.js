/**
 * Theme Definitions
 * Contains color palettes, theme presets, and node types.
 */

// --- Theme Presets ---
// Defines CSS variables for different visual themes
export const THEME_PRESETS = {
    classic: {
        '--bg': '#f8fafc',
        '--grid': '#e2e8f0',
        '--card-bg': '#ffffff',
        '--panel-bg': '#ffffff',
        '--input-bg': '#f1f5f9',
        '--text': '#0f172a',
        '--border': '#cbd5e1',
        '--shadow': 'rgba(0,0,0,0.08)',
        '--accent': '#3b82f6',
        '--muted': '#64748b',
        '--hover-bg': '#f1f5f9',
        '--radius': '10px',
        '--font-family': 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        '--note-text': '#334155'
    },
    sepia: {
        '--bg': '#fdf6e3',
        '--grid': '#eee8d5',
        '--card-bg': '#fdf6e3',
        '--panel-bg': '#fdf6e3',
        '--input-bg': '#eee8d5',
        '--text': '#586e75',
        '--border': '#d33682',
        '--shadow': 'rgba(0,0,0,0.1)',
        '--accent': '#b58900',
        '--muted': '#93a1a1',
        '--hover-bg': '#eee8d5',
        '--radius': '10px',
        '--font-family': 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
        '--note-text': '#657b83'
    },
    blackboard: {
        '--bg': '#1e293b',
        '--grid': '#334155',
        '--card-bg': '#334155',
        '--panel-bg': '#1e293b',
        '--input-bg': '#0f172a',
        '--text': '#f1f5f9',
        '--border': '#475569',
        '--shadow': 'rgba(0,0,0,0.3)',
        '--accent': '#60a5fa',
        '--muted': '#94a3b8',
        '--hover-bg': '#334155',
        '--radius': '10px',
        '--font-family': 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        '--note-text': '#e2e8f0'
    },
    blueprint: {
        '--bg': '#1e40af',
        '--grid': '#3b82f6',
        '--card-bg': '#172554',
        '--panel-bg': '#1e40af',
        '--input-bg': '#172554',
        '--text': '#ffffff',
        '--border': '#60a5fa',
        '--shadow': 'rgba(0,0,0,0.2)',
        '--accent': '#93c5fd',
        '--muted': '#bfdbfe',
        '--hover-bg': '#172554',
        '--radius': '4px',
        '--font-family': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        '--note-text': '#dbeafe'
    }
};

// --- Global Colors ---
// Used for node colors and other UI elements
export const COLORS = [
    '#0f172a', // Slate 900
    '#dc2626', // Red 600
    '#ea580c', // Orange 600
    '#d97706', // Amber 600
    '#16a34a', // Green 600
    '#2563eb', // Blue 600
    '#4f46e5', // Indigo 600
    '#9333ea', // Purple 600
    '#db2777'  // Pink 600
];

// --- Node Types ---
// Defines available types for nodes
export const NODE_TYPES = ['default', 'axiom', 'constant', 'parameter', 'note'];
