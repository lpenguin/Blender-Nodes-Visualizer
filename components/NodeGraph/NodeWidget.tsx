import React, { useState } from 'react';
import { NodeData, NodePort, NodeProperty } from '../../types';
import { getPortColor, isValidVector3, isValidColor, isValidGradient, generateGradientCSS, rgbToHex, isValidRotation } from '../../utils';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { useToast } from '../UI/Toast';
import { TSL_NODE_BY_TYPE } from '../../tslNodes';

interface NodeWidgetProps {
  data: NodeData;
  isSelected?: boolean;
  activePortId?: string | null;
  hoveredPortId?: string | null;
  hoveredPortValid?: boolean;
}

type PortHighlightState = 'idle' | 'active' | 'hover-valid' | 'hover-invalid';

const PortDot: React.FC<{ type: string; isConnected?: boolean; highlightState?: PortHighlightState }> = ({ type, isConnected, highlightState = 'idle' }) => {
  const color = getPortColor(type);
  const highlightClass =
    highlightState === 'active'
      ? 'scale-125 ring-2 ring-white/70 shadow-[0_0_0_3px_rgba(250,204,21,0.35)]'
      : highlightState === 'hover-valid'
        ? 'scale-125 ring-2 ring-emerald-300/80 shadow-[0_0_0_3px_rgba(74,222,128,0.3)]'
        : highlightState === 'hover-invalid'
          ? 'scale-110 ring-2 ring-red-400/80 shadow-[0_0_0_3px_rgba(248,113,113,0.25)]'
          : '';

  return (
    <div 
      className={`w-[12px] h-[12px] rounded-full border border-neutral-900 ${isConnected ? '' : 'opacity-80'} shrink-0 transition-all duration-100 ${highlightClass}`}
      style={{ backgroundColor: color }}
    />
  );
};

// --- Widgets ---

const FloatCurveDisplay: React.FC<{ value: any }> = ({ value }) => {
    const { showToast } = useToast();
    const [selectedPointIndex, setSelectedPointIndex] = useState<number>(0);

    if (!Array.isArray(value)) return <div className="h-24 bg-neutral-900 border border-red-900 flex items-center justify-center text-[10px] text-red-500">Invalid Curve</div>;
    
    // Normalize and sort
    const points = value
        .filter(p => typeof p.x === 'number' && typeof p.y === 'number')
        .sort((a, b) => a.x - b.x);

    const selectedPoint = points[selectedPointIndex] || points[0];

    const handleCopy = (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        showToast('Copied to clipboard');
    };

    // Generate Path
    let pathD = "";
    if (points.length > 0) {
        pathD = `M ${points[0].x * 100} ${100 - (points[0].y * 100)}`;
        for (let i = 1; i < points.length; i++) {
             pathD += ` L ${points[i].x * 100} ${100 - (points[i].y * 100)}`;
        }
    } else {
        pathD = "M 0 100 L 100 0";
    }

    return (
        <div className="w-full flex flex-col gap-1 pointer-events-auto mt-1" onPointerDown={e => e.stopPropagation()}>
            <div className="w-full h-28 bg-[#222] border border-neutral-600 rounded relative select-none overflow-hidden">
                {/* Grid Lines */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" 
                     style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '25% 25%' }} 
                />
                
                {/* Curve Line */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d={pathD} fill="none" stroke="#a1a1a1" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                </svg>

                {/* Point Markers (HTML div to avoid aspect ratio distortion) */}
                {points.map((p, i) => (
                    <div 
                        key={i}
                        className={`absolute w-[7px] h-[7px] rounded-full border border-neutral-900 cursor-pointer transition-all z-10 hover:scale-125
                            ${i === selectedPointIndex ? 'bg-white ring-1 ring-neutral-400 scale-125 z-20' : 'bg-[#6363C7]'}`}
                        style={{
                            left: `${p.x * 100}%`,
                            bottom: `${p.y * 100}%`,
                            transform: 'translate(-50%, 50%)' 
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPointIndex(i);
                        }}
                    />
                ))}
            </div>

            {/* Details Panel */}
             <div className="flex items-center gap-1 h-[20px] bg-neutral-900/50 rounded px-1 border border-neutral-700/50">
                {selectedPoint ? (
                    <>
                        <div 
                            className="flex items-center gap-1 px-1 hover:bg-neutral-700/50 rounded cursor-pointer group transition-colors min-w-0 flex-1"
                            onClick={(e) => handleCopy(selectedPoint.x.toString(), e)}
                            title="Copy X position"
                        >
                            <span className="text-[9px] text-neutral-500 font-mono">X:</span>
                            <span className="text-[10px] text-neutral-300 font-mono truncate">{selectedPoint.x.toFixed(3)}</span>
                        </div>
                        <div className="w-[1px] h-[10px] bg-neutral-700 mx-1"/>
                        <div 
                            className="flex items-center gap-1 px-1 hover:bg-neutral-700/50 rounded cursor-pointer group transition-colors min-w-0 flex-1"
                             onClick={(e) => handleCopy(selectedPoint.y.toString(), e)}
                             title="Copy Y value"
                        >
                             <span className="text-[9px] text-neutral-500 font-mono">Y:</span>
                             <span className="text-[10px] text-neutral-300 font-mono truncate">{selectedPoint.y.toFixed(3)}</span>
                        </div>
                    </>
                ) : <span className="text-[9px] text-neutral-500 p-1">No point selected</span>}
             </div>
        </div>
    )
}

const GradientDisplay: React.FC<{ value: any }> = ({ value }) => {
  const { showToast } = useToast();
  const [selectedStopIndex, setSelectedStopIndex] = useState<number>(0);

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  };

  const valid = isValidGradient(value);
  const background = valid ? generateGradientCSS(value) : '#4b4b4b';

  if (!valid) return null;

  const stops = value as Array<{ pos: number, color: number[] }>;
  const selectedStop = stops[selectedStopIndex] || stops[0];
  const selectedColorHex = rgbToHex(selectedStop.color);

  return (
    <div 
      className="w-full flex flex-col gap-1 pointer-events-auto mt-1"
      onPointerDown={(e) => e.stopPropagation()} 
    >
      <div className="h-[16px] rounded border border-neutral-600 shadow-sm relative" style={{ background }}>
         {stops.map((stop, idx) => {
            const isSelected = idx === selectedStopIndex;
            return (
                <div 
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setSelectedStopIndex(idx); }}
                    className={`absolute top-0 w-0 h-full border-l-2 cursor-pointer hover:border-white transition-colors z-10 ${isSelected ? 'border-white z-20' : 'border-black/40'}`}
                    style={{ left: `${Math.max(0, Math.min(1, stop.pos)) * 100}%` }}
                >
                    <div className={`absolute -top-[4px] -left-[3px] w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent ${isSelected ? 'border-t-white' : 'border-t-black/60'}`} />
                </div>
            )
         })}
      </div>

      <div className="flex items-center gap-1 h-[20px] bg-neutral-900/50 rounded px-1 border border-neutral-700/50">
         <div 
            className="flex items-center gap-1 px-1 hover:bg-neutral-700/50 rounded cursor-pointer group transition-colors"
            onClick={(e) => handleCopy(selectedStop.pos.toString(), e)}
            title="Click to copy position"
         >
             <span className="text-[9px] text-neutral-500 font-mono">Pos:</span>
             <span className="text-[10px] text-neutral-300 font-mono">{selectedStop.pos.toFixed(3)}</span>
         </div>

         <div className="w-[1px] h-[10px] bg-neutral-700 mx-1"/>

         <div 
            className="flex items-center gap-1 px-1 hover:bg-neutral-700/50 rounded cursor-pointer group flex-1 transition-colors"
            onClick={(e) => handleCopy(selectedColorHex, e)}
            title="Click to copy color hex"
         >
             <div className="w-[8px] h-[8px] rounded-sm border border-neutral-600" style={{ backgroundColor: selectedColorHex }} />
             <span className="text-[10px] text-neutral-300 font-mono">{selectedColorHex}</span>
         </div>
      </div>
    </div>
  );
};

const ValueWidget: React.FC<{ type: string; value: any }> = ({ type, value }) => {
    const { showToast } = useToast();
    const copy = (val: string) => {
        navigator.clipboard.writeText(val);
        showToast("Copied");
    }

    if (type === 'float') {
        const num = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(num)) return <span className="text-red-500 text-[10px]">NaN</span>;
        return (
            <div 
                className="bg-neutral-700 px-2 py-0.5 rounded text-neutral-300 text-xs font-mono min-w-[40px] text-center border border-transparent hover:border-neutral-500 cursor-pointer ml-auto"
                onPointerDown={e => e.stopPropagation()}
                onClick={() => copy(num.toString())}
            >
                {num.toFixed(3)}
            </div>
        );
    }
    if (type === 'vector3') {
        if (!isValidVector3(value)) return null;
        return (
            <div className="flex gap-1 ml-auto">
                {['X', 'Y', 'Z'].map((axis, i) => (
                     <div 
                        key={axis} 
                        className="flex items-center justify-center bg-neutral-900/50 rounded px-1.5 h-[18px] min-w-[32px] cursor-pointer hover:bg-neutral-800 transition-colors"
                        onPointerDown={e => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            copy(value[i].toString());
                        }}
                        title={`Copy ${axis}`}
                     >
                         <span className={`text-[10px] font-mono leading-none ${
                             i===0 ? 'text-red-400' : 
                             i===1 ? 'text-[#4ade80]' : // Green-400
                             'text-blue-400'
                         }`}>
                             {value[i]?.toFixed(2)}
                         </span>
                     </div>
                ))}
            </div>
        )
    }
    if (type === 'rotation') {
        if (!isValidRotation(value)) return null;
        return (
            <div className="flex gap-1 ml-auto">
                {['X', 'Y', 'Z'].map((axis, i) => (
                     <div 
                        key={axis} 
                        className="flex items-center justify-center bg-neutral-900/50 rounded px-1.5 h-[18px] min-w-[32px] cursor-pointer hover:bg-neutral-800 transition-colors"
                        onPointerDown={e => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            copy(value[i].toString());
                        }}
                        title={`Copy ${axis} Rotation`}
                     >
                         <span className={`text-[10px] font-mono leading-none ${
                             i===0 ? 'text-red-400' : 
                             i===1 ? 'text-[#4ade80]' : 
                             'text-blue-400'
                         }`}>
                             {typeof value[i] === 'number' ? value[i].toFixed(1) : value[i]}°
                         </span>
                     </div>
                ))}
            </div>
        )
    }
    if (type === 'color') {
        if (!isValidColor(value)) return null;
        const bg = `rgb(${value[0] * 255}, ${value[1] * 255}, ${value[2] * 255})`;
        const hex = rgbToHex(value);
        return (
             <div 
                className="w-[40px] h-[18px] rounded border border-neutral-600 shadow-sm ml-auto cursor-pointer" 
                style={{ backgroundColor: bg }} 
                onClick={() => copy(hex)}
                onPointerDown={e => e.stopPropagation()}
                title={hex}
             />
        );
    }
    if (type === 'string') {
        return <div className="ml-auto text-xs bg-black/20 px-1 rounded truncate max-w-[80px]">{String(value)}</div>
    }
    if (type === 'gradient') return <GradientDisplay value={value} />;
    if (type === 'float_curve') return <FloatCurveDisplay value={value} />;
    if (type === 'geometry') return null; // Geometry has no value widget

    return null;
}

const getPortHighlightState = (portId: string, activePortId?: string | null, hoveredPortId?: string | null, hoveredPortValid?: boolean): PortHighlightState => {
    if (portId === activePortId) return 'active';
    if (portId === hoveredPortId) return hoveredPortValid ? 'hover-valid' : 'hover-invalid';
    return 'idle';
};

const InputRow: React.FC<{
    port: NodePort;
    activePortId?: string | null;
    hoveredPortId?: string | null;
    hoveredPortValid?: boolean;
}> = ({ port, activePortId, hoveredPortId, hoveredPortValid }) => {
    // Logic:
    // Connected: Show Dot + Label. (Widget hidden).
    // Not Connected:
    //    Hide Port: Show Label + Widget. No Dot.
    //    Show Port: Show Dot + Label + Widget.

    const showDot = port.connected || (!port.connected && !port.hide_port);
    const showWidget = !port.connected; 
    
    // Large widgets (Gradient, Curve) break onto a new line
    const isLargeWidget = port.type === 'gradient' || port.type === 'float_curve';
    const highlightState = getPortHighlightState(port.id, activePortId, hoveredPortId, hoveredPortValid);

    return (
        <div className={`flex flex-col min-h-[24px] justify-center ${isLargeWidget ? 'mb-2' : ''}`}>
             <div className="flex items-center gap-2 h-[24px] rounded">
                 {/* Port Dot - Positioned on the left edge with negative margin */}
                 <div
                     className={`relative z-[60] w-[12px] flex items-center justify-center -ml-[14px] cursor-default ${!showDot ? 'invisible' : ''}`}
                     data-port-id={port.id}
                     data-port-direction="input"
                     data-port-type={port.type}
                 >
                     <PortDot type={port.type} isConnected={port.connected} highlightState={highlightState} />
                 </div>
                 
                 {/* Label */}
                 <span className="text-neutral-300 text-xs truncate select-none">{port.name}</span>

                 {/* Inline Widget (if not connected and small) */}
                 {showWidget && !isLargeWidget && (
                     <ValueWidget type={port.type} value={port.value} />
                 )}
             </div>

             {/* Block Widget (if not connected and large) */}
             {showWidget && isLargeWidget && (
                 <div className="pl-4 pr-1">
                      <ValueWidget type={port.type} value={port.value} />
                 </div>
             )}
        </div>
    )
}

const OutputRow: React.FC<{
    port: NodePort;
    activePortId?: string | null;
    hoveredPortId?: string | null;
    hoveredPortValid?: boolean;
}> = ({ port, activePortId, hoveredPortId, hoveredPortValid }) => {
    const highlightState = getPortHighlightState(port.id, activePortId, hoveredPortId, hoveredPortValid);

    return (
        <div className="flex items-center justify-end gap-2 h-[24px] w-full rounded">
            <span className="text-neutral-300 text-xs truncate text-right select-none">{port.name}</span>
            {/* Port Dot - Positioned on the right edge with negative margin */}
            <div className="relative z-[60] -mr-[14px] cursor-default" data-port-id={port.id} data-port-direction="output" data-port-type={port.type}>
                <PortDot type={port.type} isConnected={true} highlightState={highlightState} /> 
            </div>
        </div>
    )
}

const PropertyRow: React.FC<{ property: NodeProperty }> = ({ property }) => {
    // Properties behave like disconnected inputs but without the dot slot
    // Large widgets break line
    const isLargeWidget = property.type === 'gradient' || property.type === 'float_curve';

    return (
        <div className={`flex flex-col min-h-[24px] justify-center ${isLargeWidget ? 'mb-2' : ''}`}>
             <div className="flex items-center gap-2 h-[24px] px-2">
                 {/* Label */}
                 <span className="text-neutral-400 text-xs truncate select-none italic">{property.name}</span>

                 {/* Inline Widget (if small) */}
                 {!isLargeWidget && (
                     <ValueWidget type={property.type} value={property.value} />
                 )}
             </div>

             {/* Block Widget (if large) */}
             {isLargeWidget && (
                 <div className="pl-2 pr-1">
                      <ValueWidget type={property.type} value={property.value} />
                 </div>
             )}
        </div>
    )
}

export const NodeWidget: React.FC<NodeWidgetProps> = ({ data, isSelected, activePortId, hoveredPortId, hoveredPortValid }) => {
  const { x, y } = data.position;
  // Handle optional size gracefully
  const width = data.size?.width ?? 200;
  const height = data.size?.height ?? 100;

  // TSL node type header colors
  let headerClass = "bg-neutral-700";
  if (data.type.startsWith('tsl:')) {
    const tslType = data.type.slice(4);
    if (tslType === 'MaterialOutput' || tslType === 'PhysicalMaterialOutput') {
      headerClass = "bg-neutral-800 border-b border-neutral-600";
    } else if (['Add', 'Sub', 'Mul', 'Div', 'Abs', 'Sin', 'Cos', 'Pow', 'Sqrt', 'Clamp', 'Mix',
                 'Step', 'Smoothstep', 'Min', 'Max', 'Fract', 'Floor', 'Ceil', 'Round',
                 'Mod', 'Sign', 'Log', 'Exp'].includes(tslType)) {
      headerClass = "bg-violet-900/70";
    } else if (['Dot', 'Cross', 'Normalize', 'Length', 'Distance', 'Reflect', 'Refract',
                 'SplitXYZ', 'CombineXYZ'].includes(tslType)) {
      headerClass = "bg-indigo-900/70";
    } else if (['UV', 'Time', 'PositionLocal', 'PositionWorld', 'PositionView',
                 'NormalLocal', 'NormalWorld', 'NormalView', 'CameraPosition', 'VertexColor'].includes(tslType)) {
      headerClass = "bg-amber-900/70";
    } else if (['FloatNode', 'Vec2Node', 'Vec3Node', 'Vec4Node', 'ColorNode',
                 'UniformFloat', 'UniformVec3', 'UniformColor'].includes(tslType)) {
      headerClass = "bg-sky-900/70";
    } else if (['TextureSample'].includes(tslType)) {
      headerClass = "bg-teal-900/70";
    } else if (['MixColor', 'Hue', 'Saturation', 'Luminance'].includes(tslType)) {
      headerClass = "bg-yellow-900/60";
    } else if (['OneMinus', 'Negate', 'Reciprocal', 'ToFloat', 'ToVec3', 'ToColor'].includes(tslType)) {
      headerClass = "bg-neutral-700";
    }
  } else {
    // Legacy Blender node colours
    if (data.type.includes("Input") || data.type.includes("Coord")) headerClass = "bg-red-900/80";
    if (data.type.includes("Output")) headerClass = "bg-neutral-800 border-b border-neutral-600";
    if (data.type.includes("Shader")) headerClass = "bg-green-900/60";
    if (data.type.includes("Geometry")) headerClass = "bg-emerald-900/60";
    if (data.type.includes("ValToRGB")) headerClass = "bg-yellow-900/60";
  }

  const baseHandleClass = "absolute z-50 pointer-events-auto bg-transparent";
  const cornerSize = "w-3 h-3";

  return (
    <div
      data-node-id={data.id}
      className={`absolute flex flex-col rounded-lg shadow-2xl bg-neutral-800/95 overflow-visible text-sm select-none touch-none pointer-events-auto
        ${isSelected ? 'ring-2 ring-yellow-400 z-10' : 'border border-neutral-700'}`}
      style={{
        left: x,
        top: y,
        width: width,
        minHeight: height,
      }}
    >
      {/* Handles */}
      <div data-resize-handle="nw" className={`${baseHandleClass} ${cornerSize} -top-1.5 -left-1.5 cursor-nw-resize`} />
      <div data-resize-handle="ne" className={`${baseHandleClass} ${cornerSize} -top-1.5 -right-1.5 cursor-ne-resize`} />
      <div data-resize-handle="sw" className={`${baseHandleClass} ${cornerSize} -bottom-1.5 -left-1.5 cursor-sw-resize`} />
      <div data-resize-handle="se" className={`${baseHandleClass} ${cornerSize} -bottom-1.5 -right-1.5 cursor-se-resize`} />
      <div data-resize-handle="n" className={`${baseHandleClass} cursor-n-resize h-[6px] -top-[3px] left-2 right-2`} />
      <div data-resize-handle="s" className={`${baseHandleClass} cursor-s-resize h-[6px] -bottom-[3px] left-2 right-2`} />
      <div data-resize-handle="w" className={`${baseHandleClass} cursor-w-resize w-[6px] -left-[3px] top-2 bottom-2`} />
      <div data-resize-handle="e" className={`${baseHandleClass} cursor-e-resize w-[6px] -right-[3px] top-2 bottom-2`} />

      {/* Header */}
      <div className={`h-[32px] px-3 ${headerClass} rounded-t-md text-white font-medium text-xs tracking-wide flex items-center justify-between shrink-0 overflow-hidden`}>
        <span className="truncate">{data.name}</span>
        {data.type.startsWith('tsl:') && TSL_NODE_BY_TYPE.get(data.type)?.tslFn && (
          <span className="text-[9px] font-mono text-white/40 shrink-0 ml-2 hidden sm:inline">
            {TSL_NODE_BY_TYPE.get(data.type)!.tslFn}()
          </span>
        )}
      </div>

      {/* Body: Outputs -> Properties -> Inputs */}
      <div className="flex flex-col flex-1 p-[8px] gap-[4px] relative overflow-visible">
        
        {/* Outputs Section */}
        {data.outputs && data.outputs.length > 0 && (
                 <div className="flex flex-col gap-[4px] w-full items-end border-b border-neutral-700/30 pb-1 mb-1">
                 {data.outputs.map((port) => (
                    <OutputRow key={port.id} port={port} activePortId={activePortId} hoveredPortId={hoveredPortId} hoveredPortValid={hoveredPortValid} />
                 ))}
             </div>
         )}

        {/* Properties Section */}
        {data.properties && data.properties.length > 0 && (
             <div className="flex flex-col gap-[4px] w-full border-b border-neutral-700/30 pb-1 mb-1">
                {data.properties.map((prop, idx) => (
                    <PropertyRow key={prop.id || `prop-${idx}`} property={prop} />
                ))}
            </div>
        )}

        {/* Inputs Section */}
        {data.inputs && data.inputs.length > 0 && (
             <div className="flex flex-col gap-[4px] w-full">
                 {data.inputs.map((port) => (
                    <InputRow key={port.id} port={port} activePortId={activePortId} hoveredPortId={hoveredPortId} hoveredPortValid={hoveredPortValid} />
                 ))}
             </div>
         )}

      </div>
    </div>
  );
};
