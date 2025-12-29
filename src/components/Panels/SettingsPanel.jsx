import React, { useState } from 'react';
import GeneralSettings from './GeneralSettings';
import PhysicsSettings from './PhysicsSettings';
import AppearanceSettings from './AppearanceSettings';
import ShortcutsSettings from './ShortcutsSettings';
import Icon from '../UI/Icon';

const SettingsPanel = ({ 
    settings, setSettings, shortcuts, setShortcuts, t, onExport, onImport, icons,
    undo, redo, canUndo, canRedo,
    autoSaveEnabled, setAutoSaveEnabled,
    onNewScene, onSaveScene, onSaveAsScene
}) => {
    const [activeTab, setActiveTab] = useState('file');

    const tabs = [
        { id: 'file', label: t.file || 'File', icon: icons?.file },
        { id: 'general', label: t.general || 'General', icon: icons?.settings },
        { id: 'physics', label: t.physics || 'Physics', icon: icons?.physics },
        { id: 'appearance', label: t.appearance || 'Appearance', icon: icons?.appearance },
        { id: 'shortcuts', label: t.shortcutsTab || 'Shortcuts', icon: icons?.shortcuts }
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
                {activeTab === 'file' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2 p-2 rounded border border-[var(--border)]">
                            <div className="flex gap-2">
                                <button className="p-1 hover:bg-[var(--panel-bg)] rounded disabled:opacity-30" onClick={undo} disabled={!canUndo} title={t.undo || "Undo"}>
                                    <Icon icon={icons?.undo} />
                                </button>
                                <button className="p-1 hover:bg-[var(--panel-bg)] rounded disabled:opacity-30" onClick={redo} disabled={!canRedo} title={t.redo || "Redo"}>
                                    <Icon icon={icons?.redo} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <div 
                                    className="flex items-center gap-2 cursor-pointer select-none"
                                    onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                                    title={t.autoSave || "Auto Save"}
                                >
                                    <span className="text-xs text-[var(--muted)]">{t.autoSave || "Auto Save"}</span>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${autoSaveEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform`} style={{transform: autoSaveEnabled ? 'translateX(17px)' : 'translateX(1px)'}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button className="btn w-full justify-start gap-2 text-xs" onClick={onNewScene}>
                                <Icon icon={icons?.new} /> {t.newScene || "New Scene"}
                            </button>
                            <button className="btn w-full justify-start gap-2 text-xs" onClick={onImport}>
                                <Icon icon={icons?.open} /> {t.openScene || "Open Scene"}
                            </button>
                            <button className="btn w-full justify-start gap-2 text-xs" onClick={onSaveScene}>
                                <Icon icon={icons?.save} /> {t.saveScene || "Save Scene"}
                            </button>
                            <button className="btn w-full justify-start gap-2 text-xs" onClick={onSaveAsScene}>
                                <Icon icon={icons?.save} /> {t.saveAsScene || "Save As Scene"}
                            </button>
                            <button className="btn w-full justify-start gap-2 text-xs" onClick={onExport}>
                                <Icon icon={icons?.export} /> {t.export || "Export..."}
                            </button>
                        </div>
                    </div>
                )}
                {activeTab === 'general' && <GeneralSettings settings={settings} setSettings={setSettings} t={t} icons={icons} />}
                {activeTab === 'physics' && <PhysicsSettings settings={settings} setSettings={setSettings} t={t} maxGravity={5000} maxDistance={2000} />}
                {activeTab === 'appearance' && <AppearanceSettings settings={settings} setSettings={setSettings} t={t} />}
                {activeTab === 'shortcuts' && <ShortcutsSettings shortcuts={shortcuts} setShortcuts={setShortcuts} t={t} />}
            </div>
        </div>
    );
};

export default SettingsPanel;
