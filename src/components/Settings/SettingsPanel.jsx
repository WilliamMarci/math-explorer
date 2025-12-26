import React, { useState } from 'react';
import GeneralSettings from './GeneralSettings';
import PhysicsSettings from './PhysicsSettings';
import AppearanceSettings from './AppearanceSettings';
import ShortcutsSettings from './ShortcutsSettings';
import Icon from '../Icon';

const SettingsPanel = ({ settings, setSettings, shortcuts, setShortcuts, t, onExport, onImport, icons }) => {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: t.settings || 'General', icon: icons?.settings },
        { id: 'physics', label: t.PHYandLAY || 'Physics', icon: icons?.physics },
        { id: 'appearance', label: 'Appearance', icon: icons?.appearance },
        { id: 'shortcuts', label: 'Shortcuts', icon: icons?.shortcuts }
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="flex border-b border-[var(--border)]">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`flex-1 py-0.5 text-xs font-bold border-b-2 transition-colors ${activeTab === tab.id ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'}`}
                        onClick={() => setActiveTab(tab.id)}
                        title={tab.label}
                    >
                        <Icon icon={tab.icon} className="text-base" />
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {activeTab === 'general' && <GeneralSettings settings={settings} setSettings={setSettings} t={t} icons={icons} />}
                {activeTab === 'physics' && <PhysicsSettings settings={settings} setSettings={setSettings} t={t} />}
                {activeTab === 'appearance' && <AppearanceSettings settings={settings} setSettings={setSettings} t={t} />}
                {activeTab === 'shortcuts' && <ShortcutsSettings shortcuts={shortcuts} setShortcuts={setShortcuts} t={t} />}
            </div>

            <div className="p-2 border-t border-[var(--border)] flex gap-2">
                <button className="btn flex-1 text-xs bg-[var(--input-bg)] border border-[var(--border)] hover:bg-[var(--bg)]" onClick={onExport}>
                    <Icon icon={icons?.export} /> {t.export}
                </button>
                <label className="btn flex-1 text-xs cursor-pointer bg-[var(--input-bg)] border border-[var(--border)] hover:bg-[var(--bg)] text-center">
                    <Icon icon={icons?.import} /> {t.import}
                    <input type="file" className="hidden" accept=".json,.mathmap" onChange={onImport} />
                </label>
            </div>
        </div>
    );
};

export default SettingsPanel;
