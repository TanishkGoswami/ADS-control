import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface InfoTooltipProps {
  title?: string;
  text: string;
  hinglishHelp?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'auto' | 'start' | 'center' | 'end';
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  text,
  hinglishHelp,
  side = 'top',
  align = 'auto',
  className,
  iconClassName,
  size = 'sm'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [resolvedAlign, setResolvedAlign] = useState<'start' | 'center' | 'end'>('center');
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute smart alignment to avoid viewport / modal boundary clipping
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    if (align !== 'auto') {
      setResolvedAlign(align);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    // If near right edge of screen (< 200px from right edge), anchor to right
    if (rect.right > viewportWidth - 200) {
      setResolvedAlign('end');
    } else if (rect.left < 200) {
      setResolvedAlign('start');
    } else {
      setResolvedAlign('center');
    }
  }, [isOpen, align]);

  // Position classes depending on side & resolved alignment
  const getPositionClasses = () => {
    if (side === 'top' || side === 'bottom') {
      const vertical = side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';
      if (resolvedAlign === 'end') {
        return `${vertical} right-0`;
      }
      if (resolvedAlign === 'start') {
        return `${vertical} left-0`;
      }
      return `${vertical} left-1/2 -translate-x-1/2`;
    }

    if (side === 'left') {
      return 'right-full top-1/2 -translate-y-1/2 mr-2';
    }

    // side === 'right'
    return 'left-full top-1/2 -translate-y-1/2 ml-2';
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-flex items-center align-middle', className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="text-[#8595a4] hover:text-[#0064e0] transition-colors p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-[#0064e0]"
        aria-label="More information"
      >
        <Info className={cn(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4', iconClassName)} />
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          className={cn(
            'absolute z-[9999] w-64 max-w-[calc(100vw-32px)] p-2.5 bg-[#1c1e21] text-white rounded-lg shadow-2xl border border-white/10 text-left pointer-events-auto animate-in fade-in zoom-in-95 duration-150',
            getPositionClasses()
          )}
        >
          {title && (
            <div className="font-semibold text-xs text-white mb-1 flex items-center gap-1.5 border-b border-white/10 pb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0064e0] shrink-0" />
              <span className="truncate">{title}</span>
            </div>
          )}
          <p className="text-[11px] text-gray-200 leading-relaxed font-sans">{text}</p>
          {hinglishHelp && (
            <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[10px] text-blue-200 leading-normal bg-blue-950/50 p-1.5 rounded border border-blue-500/20">
              <span className="font-semibold text-blue-300">💡 Hinglish Guide:</span> {hinglishHelp}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
