import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackSrc?: string;
}

export default function ImageWithFallback({ src, alt, className, fallbackSrc, ...props }: ImageWithFallbackProps) {
    const [currentSrc, setCurrentSrc] = useState(src);
    const [isFallback, setIsFallback] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setCurrentSrc(src);
        setIsFallback(false);
        setFailed(false);
    }, [src]);

    const handleError = () => {
        if (!isFallback && fallbackSrc) {
            // First error: Try fallback if provided
            setCurrentSrc(fallbackSrc);
            setIsFallback(true);
        } else {
            // Second error or no fallback: Show placeholder
            setFailed(true);
        }
    };

    if (failed || !currentSrc) {
        return (
            <div className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}>
                <ImageOff size={20} />
            </div>
        );
    }

    return (
        <img
            src={currentSrc}
            alt={alt}
            className={className}
            onError={handleError}
            {...props}
        />
    );
}
