import React from 'react';
import { COLORS } from '../../theme';

const ColorPalette = ({ selectedColor, onSelect, size = 'md' }) => (
    <div className="flex gap-1.5 flex-wrap content-start">
        {COLORS.map(c => (
            <div 
                key={c} 
                className={`
                    rounded cursor-pointer border-2 transition-transform hover:scale-110
                    ${selectedColor === c ? 'border-[var(--text)] scale-110' : 'border-transparent'}
                    ${size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'}
                `} 
                style={{ background: c }} 
                onClick={() => onSelect(c)} 
            />
        ))}
        <label className={`
            relative rounded cursor-pointer border flex items-center justify-center overflow-hidden hover:opacity-80
            bg-[var(--input-bg)] border-[var(--border)]
            ${size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'}
        `}>
            <span className="text-[var(--text)] opacity-50 text-xs">+</span>
            <input 
                type="color" 
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                value={selectedColor || '#000000'}
                onChange={(e) => onSelect(e.target.value)}
            />
        </label>
    </div>
);

export default ColorPalette;
