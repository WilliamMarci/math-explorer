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
                    <span>{t.distance} (Link Gap)</span>
                    <span>{settings.distance}</span>
                </div>
                <input 
                    type="range" 
                    className="modern-range" 
                    min="10" 
                    max="300" 
                    value={settings.distance} 
                    onChange={e => setSettings({...settings, distance: +e.target.value})} 
                />
            </div>

            <div>
                <div className="flex justify-between text-[10px] mb-1 opacity-60 uppercase font-bold">
                    <span>{t.collisionPadding || "Collision Padding"}</span>
                    <span>{settings.collisionPadding || 10}</span>
                </div>
                <input 
                    type="range" 
                    className="modern-range" 
                    min="0" 
                    max="100" 
                    value={settings.collisionPadding || 10} 
                    onChange={e => setSettings({...settings, collisionPadding: +e.target.value})} 
                />
            </div>
            
            {settings.minimalMode && (
                <div>
                    <div className="flex justify-between text-[10px] mb-1 opacity-60 uppercase font-bold">
                        <span>{t.minimalGapRatio || "Minimal Gap"}</span>
                        <span>{settings.minimalGapRatio}</span>
                    </div>
                    <input 
                        type="range" 
                        className="modern-range" 
                        min="0.1" 
                        max="1.0" 
                        step="0.1"
                        value={settings.minimalGapRatio || 0.5} 
                        onChange={e => setSettings({...settings, minimalGapRatio: +e.target.value})} 
                    />
                </div>
            )}
        </div>
    );
};

export default PhysicsSettings;
