import React from 'react';

const Icon = ({ icon, className }) => {
    if (!icon) return null;
    
    if (icon.type === 'image') {
        return (
            <div 
                className={`pixel-icon ${className}`} 
                style={{ 
                    width: '1em', 
                    height: '1em', 
                    display: 'inline-block', 
                    verticalAlign: 'middle',
                    backgroundColor: 'currentColor',
                    WebkitMaskImage: `url(${icon.value})`,
                    maskImage: `url(${icon.value})`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center'
                }} 
            />
        );
    }
    
    return <i className={`${icon.value} ${className}`}></i>;
};

export default Icon;
