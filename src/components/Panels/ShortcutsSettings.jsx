import React from 'react';
import Icon from '../UI/Icon';

const ShortcutsSettings = ({ shortcuts, setShortcuts, t }) => {
    return (
        <div className="space-y-2">
            {shortcuts && Object.entries(shortcuts).map(([action, key]) => (
                <div key={action} className="flex justify-between items-center">
                    <span className="text-[10px] uppercase opacity-70">{t.shortcuts?.[action] || action}</span>
                    <input 
                        className="w-12 text-center text-[10px] bg-[var(--bg)] border border-[var(--border)] rounded outline-none focus:border-[var(--accent)]"
                        value={key}
                        onChange={(e) => setShortcuts({...shortcuts, [action]: e.target.value})}
                    />
                </div>
            ))}
        </div>
    );
};

export default ShortcutsSettings;
