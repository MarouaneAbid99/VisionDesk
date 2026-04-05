import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  LayoutDashboard, 
  Users, 
  Wrench, 
  Glasses, 
  Circle,
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react';
import api, { resolveApiAssetUrl } from '../../lib/api';
import { cn } from '../../lib/utils';

interface Hotspot {
  id: string;
  moduleKey: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  icon: string;
}

interface PanoramaScene {
  id: string;
  name: string;
  imageUrl: string;
  hotspots: Hotspot[];
}

// Module to icon mapping
const moduleIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  desk: LayoutDashboard,
  clients: Users,
  atelier: Wrench,
  frames: Glasses,
  lenses: Circle,
};

const routeMap: Record<string, string> = {
  desk: '/desk',
  clients: '/clients',
  atelier: '/atelier',
  frames: '/stock/frames',
  lenses: '/stock/lenses',
};

// Zoom constraints
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.15;

export function PanoramaPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [focusedHotspot, setFocusedHotspot] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const { data: scene, isLoading } = useQuery({
    queryKey: ['panorama', 'active-scene'],
    queryFn: async () => {
      const response = await api.get('/panorama/active-scene');
      return response.data.data as PanoramaScene | null;
    },
  });

  const getImageUrl = (imageUrl: string | undefined) => {
    return resolveApiAssetUrl(imageUrl);
  };

  // Clamp pan values to keep content in view
  const clampPan = useCallback((newPan: { x: number; y: number }, currentZoom: number) => {
    if (!containerRef.current) return newPan;
    const container = containerRef.current;
    const maxPanX = (container.offsetWidth * (currentZoom - 1)) / 2;
    const maxPanY = (container.offsetHeight * (currentZoom - 1)) / 2;
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, newPan.x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newPan.y)),
    };
  }, []);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
    
    if (newZoom !== zoom) {
      setZoom(newZoom);
      // Adjust pan when zooming out to keep content centered
      if (newZoom < zoom) {
        setPan(prev => clampPan(prev, newZoom));
      }
    }
  }, [zoom, clampPan]);

  // Handle pan start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1 && e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [zoom, pan]);

  // Handle pan move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const newPan = {
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      };
      setPan(clampPan(newPan, zoom));
    }
  }, [isPanning, panStart, zoom, clampPan]);

  // Handle pan end
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Reset zoom and pan
  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP * 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(MIN_ZOOM, zoom - ZOOM_STEP * 2);
    setZoom(newZoom);
    setPan(prev => clampPan(prev, newZoom));
  }, [zoom, clampPan]);

  // Handle hotspot click with focus animation
  const handleHotspotClick = useCallback((moduleKey: string, hotspotId: string, x: number, y: number) => {
    const route = routeMap[moduleKey];
    if (!route || isNavigating) return;

    // Prevent double clicks
    setIsNavigating(true);
    setFocusedHotspot(hotspotId);

    // Brief zoom focus on hotspot
    if (containerRef.current) {
      const container = containerRef.current;
      const focusZoom = Math.min(2, MAX_ZOOM);
      const targetPanX = (0.5 - x) * container.offsetWidth * (focusZoom - 1);
      const targetPanY = (0.5 - y) * container.offsetHeight * (focusZoom - 1);

      setZoom(focusZoom);
      setPan(clampPan({ x: targetPanX, y: targetPanY }, focusZoom));
    }

    // Navigate after animation
    setTimeout(() => {
      navigate(route);
    }, 400);
  }, [navigate, clampPan, isNavigating]);

  // Get icon for module
  const getModuleIcon = (moduleKey: string) => {
    return moduleIconMap[moduleKey] || Circle;
  };

  // Reset state on mount (clear any stale state from previous navigation)
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setFocusedHotspot(null);
    setIsNavigating(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleReset();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset, handleZoomIn, handleZoomOut]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Get hotspots to render (scene hotspots or fallback)
  const hotspotsToRender = scene?.hotspots || [
    { id: 'fallback-desk', moduleKey: 'desk', label: 'Desk', x: 0.15, y: 0.5, w: 0.12, h: 0.15, icon: '' },
    { id: 'fallback-clients', moduleKey: 'clients', label: 'Clients', x: 0.32, y: 0.45, w: 0.12, h: 0.15, icon: '' },
    { id: 'fallback-atelier', moduleKey: 'atelier', label: 'Atelier', x: 0.5, y: 0.4, w: 0.12, h: 0.15, icon: '' },
    { id: 'fallback-frames', moduleKey: 'frames', label: 'Stock Frames', x: 0.68, y: 0.45, w: 0.12, h: 0.15, icon: '' },
    { id: 'fallback-lenses', moduleKey: 'lenses', label: 'Stock Lenses', x: 0.85, y: 0.5, w: 0.12, h: 0.15, icon: '' },
  ];

  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
      <div 
        ref={containerRef}
        className={cn(
          "relative w-full max-w-7xl aspect-[16/9] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 select-none shadow-2xl",
          isPanning ? "cursor-grabbing" : zoom > 1 ? "cursor-grab" : "cursor-default"
        )}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Zoomable/Pannable content */}
        <div
          ref={contentRef}
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
          }}
        >
          {/* Panorama background - MUST match editor: w-full h-full object-cover */}
          {scene?.imageUrl ? (
            <img
              src={getImageUrl(scene.imageUrl) || ''}
              alt="Panorama"
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
              }}
            />
          )}
          {/* Premium depth effects - vignette + gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/15 pointer-events-none" />
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
            }}
          />
          {/* Subtle ambient light effect */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            }}
          />

        {/* Hotspots - invisible clickable areas with subtle hover feedback */}
        {hotspotsToRender.map((hotspot) => {
          const IconComponent = getModuleIcon(hotspot.moduleKey);
          const x = Number(hotspot.x);
          const y = Number(hotspot.y);
          const w = Number(hotspot.w) || 0.12;
          const h = Number(hotspot.h) || 0.12;
          const isFocused = focusedHotspot === hotspot.id;

          return (
            <button
              key={hotspot.id}
              onClick={(e) => {
                e.stopPropagation();
                handleHotspotClick(hotspot.moduleKey, hotspot.id, x, y);
              }}
              className={cn(
                "absolute group cursor-pointer transition-all duration-200",
                isFocused && "z-50"
              )}
              style={{
                left: `${(x - w / 2) * 100}%`,
                top: `${(y - h / 2) * 100}%`,
                width: `${w * 100}%`,
                height: `${h * 100}%`,
              }}
            >
              {/* Invisible clickable area - the full hotspot region is clickable */}
              {/* No visible border, no background - completely invisible by default */}
              
              {/* Subtle hover indicator - only shows on hover */}
              <div 
                className={cn(
                  "absolute inset-0 rounded-lg transition-all duration-200",
                  "bg-transparent group-hover:bg-white/5",
                  isFocused && "bg-white/15"
                )} 
              />

              {/* Center indicator - very subtle, only on hover */}
              <div className={cn(
                "absolute inset-0 flex items-center justify-center pointer-events-none",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                isFocused && "opacity-100"
              )}>
                <div 
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                    "bg-white/10 backdrop-blur-sm",
                    isFocused && "bg-white/40 scale-125"
                  )}
                >
                  <IconComponent 
                    className={cn(
                      "w-5 h-5 text-white/70 transition-all duration-200",
                      isFocused && "text-white scale-110"
                    )} 
                  />
                </div>
              </div>

              {/* Label - only on hover */}
              <div 
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-200",
                  "opacity-0 group-hover:opacity-100",
                  isFocused && "opacity-100"
                )}
                style={{ bottom: '-28px' }}
              >
                <span className={cn(
                  "text-xs font-medium whitespace-nowrap px-2 py-1 rounded",
                  "bg-black/70 text-white/90 backdrop-blur-sm"
                )}>
                  {hotspot.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Welcome message - fixed position with responsive sizing */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 pointer-events-none">
        <h1 className="text-xl sm:text-3xl font-bold text-white drop-shadow-lg">
          Welcome to VisionDesk
        </h1>
        <p className="text-white/80 mt-1 sm:mt-2 text-sm sm:text-base drop-shadow flex items-center gap-2 flex-wrap">
          <span>Click a module to navigate</span>
          {zoom > 1 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              Drag to pan • Scroll to zoom
            </span>
          )}
        </p>
      </div>

      {/* Zoom controls - responsive positioning */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          disabled={zoom >= MAX_ZOOM}
          className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom in (+)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          disabled={zoom <= MIN_ZOOM}
          className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom out (-)"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={handleReset}
          disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
          className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Reset view (Esc)"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>

        {/* Zoom indicator */}
        {zoom > 1 && (
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-20 bg-white/20 backdrop-blur-md rounded-xl px-3 py-1.5 text-white text-sm font-medium">
            {Math.round(zoom * 100)}%
          </div>
        )}

        {/* Mini map when zoomed */}
        {zoom > 1 && containerRef.current && (
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-24 h-16 sm:w-32 sm:h-20 bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-60"
              style={{
                backgroundImage: scene?.imageUrl
                  ? `url(${getImageUrl(scene.imageUrl)})`
                  : 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
              }}
            />
            <div
              className="absolute border-2 border-white/80 bg-white/10 rounded-sm transition-all duration-200"
              style={{
                width: `${100 / zoom}%`,
                height: `${100 / zoom}%`,
                left: `${50 - 50 / zoom - (pan.x / containerRef.current.offsetWidth) * (100 / zoom)}%`,
                top: `${50 - 50 / zoom - (pan.y / containerRef.current.offsetHeight) * (100 / zoom)}%`,
              }}
            />
            {hotspotsToRender.map((hotspot) => (
              <div
                key={`mini-${hotspot.id}`}
                className="absolute w-1.5 h-1.5 bg-white rounded-full"
                style={{
                  left: `${Number(hotspot.x) * 100}%`,
                  top: `${Number(hotspot.y) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
