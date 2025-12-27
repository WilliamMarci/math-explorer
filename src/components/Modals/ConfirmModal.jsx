import React from 'react';
import Icon from '../UI/Icon';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, position, icons, isAlert }) => {
    if (!isOpen) return null;

    const style = position ? {
        position: 'fixed',
        top: Math.min(position.y, window.innerHeight - 200),
        left: Math.min(position.x, window.innerWidth - 320),
        zIndex: 10001
    } : {};

    const containerClass = position 
        ? "bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-xl w-80 overflow-hidden"
        : "modal-overlay";

    const content = (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-xl w-80 overflow-hidden" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--border)] bg-[var(--bg)]">
                <h3 className="text-sm font-bold text-[var(--text)]">{title}</h3>
                <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)]">
                    <Icon icon={icons?.close} />
                </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
                <p className="text-sm text-[var(--text)]">{message}</p>
                <div className="flex justify-end gap-2">
                    {!isAlert && (
                        <button onClick={onClose} className="px-3 py-1.5 text-xs rounded border border-[var(--border)] hover:bg-[var(--hover-bg)] text-[var(--text)]">
                            Cancel
                        </button>
                    )}
                    <button onClick={() => { onConfirm(); onClose(); }} className={`px-3 py-1.5 text-xs rounded text-white ${isAlert ? 'bg-[var(--accent)] hover:opacity-90' : 'bg-red-500 hover:bg-red-600'}`}>
                        {isAlert ? 'OK' : 'Confirm'}
                    </button>
                </div>
            </div>
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

export default ConfirmModal;
