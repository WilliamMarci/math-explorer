import React, { useState, useEffect, useRef } from 'react';
import Icon from '../UI/Icon';

const InputModal = ({ isOpen, onClose, onConfirm, title, initialValue, placeholder, icons, position }) => {
    const [value, setValue] = useState(initialValue || '');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setValue(initialValue || '');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(value);
        onClose();
    };

    const style = position ? {
        position: 'fixed',
        top: Math.min(position.y, window.innerHeight - 200),
        left: Math.min(position.x, window.innerWidth - 320),
        zIndex: 10001
    } : {};

    const content = (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-xl w-80 overflow-hidden" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--border)] bg-[var(--bg)]">
                <h3 className="text-sm font-bold text-[var(--text)]">{title}</h3>
                <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)]">
                    <Icon icon={icons?.close} />
                </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:border-[var(--accent)] outline-none"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs rounded border border-[var(--border)] hover:bg-[var(--hover-bg)] text-[var(--text)]">
                        Cancel
                    </button>
                    <button type="submit" className="px-3 py-1.5 text-xs rounded bg-[var(--accent)] text-white hover:opacity-90">
                        Confirm
                    </button>
                </div>
            </form>
        </div>
    );

    if (position) {
        return (
            <>
                <div className="fixed inset-0 z-[10000]" onClick={onClose}></div>
                <div style={style}>{content}</div>
            </>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            {content}
        </div>
    );
};

export default InputModal;
