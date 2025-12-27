import React, { useState, useRef, useEffect } from 'react';
import { THEME_PRESETS } from '../../theme';
import Icon from '../UI/Icon';

const GeneralSettings = ({ settings, setSettings, t, icons }) => {
    const languages = [
        { code: 'en', label: 'English' },
        { code: 'zh', label: '中文' },
        { code: 'fr', label: 'Français' },
        { code: 'jp', label: '日本語' }
    ];

    const [isLangOpen, setIsLangOpen] = useState(false);
    const langRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (langRef.current && !langRef.current.contains(event.target)) {
                setIsLangOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentLang = languages.find(l => l.code === settings.lang) || languages[0];

    return (
        <div className="space-y-4">
            <div>
                <label className="label-text mt-0 text-[var(--text)] mb-2 block">{t.language}</label>
                <div className="flex flex-col" ref={langRef}>
                    <button 
                        className="w-full flex justify-between items-center py-2 px-3 text-sm rounded border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] hover:border-[var(--accent)] transition-colors"
                        onClick={() => setIsLangOpen(!isLangOpen)}
                    >
                        <span>{currentLang.label}</span>
                        <Icon icon={icons?.arrowDown} className={`transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isLangOpen && (
                        <div className="mt-1 w-full border border-[var(--border)] rounded shadow-sm bg-[var(--panel-bg)] overflow-hidden transition-all">
                            {languages.map(lang => (
                                <div
                                    key={lang.code}
                                    className={`py-2 px-3 text-sm cursor-pointer hover:bg-[var(--bg)] border-b border-[var(--border)] last:border-0 ${settings.lang === lang.code ? 'text-[var(--accent)] font-medium' : 'text-[var(--text)]'}`}
                                    onClick={() => {
                                        setSettings({...settings, lang: lang.code});
                                        setIsLangOpen(false);
                                    }}
                                >
                                    {lang.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div>
                <label className="label-text mt-0 text-[var(--text)] mb-2 block">{t.theme}</label>
                <div className="flex gap-2 mt-1 flex-wrap justify-center">
                    <div 
                        className={`w-8 h-8 rounded-full border border-[var(--border)] cursor-pointer transition-transform hover:scale-110 flex items-center justify-center ${settings.theme === 'auto' ? 'ring-2 ring-offset-2 ring-[var(--accent)]' : ''}`}
                        style={{ background: 'linear-gradient(135deg, #ffffff 50%, #1e293b 50%)' }}
                        onClick={() => setSettings({...settings, theme: 'auto'})}
                        title="Auto"
                    >
                        <span className="text-[10px] font-bold mix-blend-difference text-white">A</span>
                    </div>
                    {Object.keys(THEME_PRESETS).map(key => (
                        <div 
                            key={key} 
                            className={`w-8 h-8 rounded-full border border-[var(--border)] cursor-pointer transition-transform hover:scale-110 ${settings.theme === key ? 'ring-2 ring-offset-2 ring-[var(--accent)]' : ''}`} 
                            style={{ background: THEME_PRESETS[key]['--bg'] }} 
                            onClick={() => setSettings({...settings, theme: key})} 
                            title={key} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GeneralSettings;
