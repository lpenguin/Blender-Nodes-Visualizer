import React, { useMemo } from 'react';
import { calculateBezierPath, getPortColor } from '../../utils';
import { DataType } from '../../types';

interface ConnectionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  sourceType: DataType;
  targetType: DataType;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ x1, y1, x2, y2, sourceType, targetType }) => {
  const pathData = calculateBezierPath(x1, y1, x2, y2);
  const startColor = getPortColor(sourceType);
  const endColor = getPortColor(targetType);

  // Use coordinates to generate a stable, unique ID for the gradient
  // We use Math.floor to ensure integer values for the ID string
  const gradientId = useMemo(() => 
    `grad-${Math.floor(x1)}-${Math.floor(y1)}-${Math.floor(x2)}-${Math.floor(y2)}`, 
    [x1, y1, x2, y2]
  );

  const isGradient = startColor !== endColor;

  return (
    <g>
      {/* Define Gradient if needed */}
      {isGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>
      )}

      {/* Shadow/Outline for better visibility on dark bg */}
      <path
        d={pathData}
        fill="none"
        stroke="#171717" // Neutral-900 matches bg
        strokeWidth="4"
        strokeLinecap="round"
        className="opacity-50"
      />
      
      {/* Actual Line */}
      <path
        d={pathData}
        fill="none"
        stroke={isGradient ? `url(#${gradientId})` : startColor}
        strokeWidth="2"
        strokeLinecap="round"
        className="transition-colors duration-200"
      />
    </g>
  );
};