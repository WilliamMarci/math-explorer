import React, { useState } from 'react';
import SettingsPanel from './Settings/SettingsPanel';
import Icon from './Icon';

const ControlPanel = ({ settings, setSettings, shortcuts, setShortcuts, t, onExport, onImport, icons }) => {
    const [ctrlOpen, setCtrlOpen] = useState(false);

    return (
        <div className={`ui-panel control-panel ${ctrlOpen ? 'w-64 open' : 'w-10 h-10'} bg-[var(--panel-bg)] border-l border-[var(--border)] text-[var(--text)]`}>
            <div className="panel-content-wrapper p-4 pb-12 space-y-5 overflow-y-auto h-full">
                <SettingsPanel 
                    settings={settings} 
                    setSettings={setSettings} 
                    shortcuts={shortcuts} 
                    setShortcuts={setShortcuts} 
                    t={t} 
                    onExport={onExport} 
                    onImport={onImport} 
                    icons={icons}
                />
            </div>

            <div className="ui-header absolute bottom-0 left-0 w-full border-t border-[var(--border)] bg-[var(--panel-bg)]" onClick={() => setCtrlOpen(!ctrlOpen)}>
                <div className="flex items-center gap-2"><Icon icon={icons?.settings} className="text-lg" /> {ctrlOpen && t.settings}</div>
                {ctrlOpen && <Icon icon={icons?.arrowDown} />}
            </div>
        </div>
    );
};

export default ControlPanel;
