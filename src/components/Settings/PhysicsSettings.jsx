import React from 'react';

const PhysicsSettings = ({ settings, setSettings, t }) => {
    return (
        <div className="space-y-4">
            <div>
                <div className="flex justify-between text-[10px] mb-1 opacity-60 uppercase font-bold">
                    <span>{t.gravity} (Repel)</span>
                    <span>{settings.gravity}</span>
                </div>
                <input 
                    type="range" 
                    className="modern-range" 
                    min="50" 
                    max="1000" 
                    value={settings.gravity} 
                    onChange={e => setSettings({...settings, gravity: +e.target.value})} 
                />
            </div>
            <div>
                <div className="flex justify-between text-[10px] mb-1 opacity-60 uppercase font-bold">
                    <span>{t.centering} (Attract)</span>
                    <span>{settings.centering}</span>
                </div>
                <input 
                    type="range" 
                    className="modern-range" 
                    min="0" 
                    max="100" 
                    step="5" 
                    value={settings.centering} 
                    onChange={e => setSettings({...settings, centering: +e.target.value})} 
                />
            </div>
            <div>
                <div className="flex justify-between text-[10px] mb-1 opacity-60 uppercase font-bold">
                    <span>{t.distance} (Link)</span>
                    <span>{settings.distance}</span>
                </div>
                <input 
                    type="range" 
                    className="modern-range" 
                    min="100" 
                    max="600" 
                    value={settings.distance} 
                    onChange={e => setSettings({...settings, distance: +e.target.value})} 
                />
            </div>
        </div>
    );
};

export default PhysicsSettings;
