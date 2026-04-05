import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Upload,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Image as ImageIcon,
  GripVertical,
  X,
  Check,
  AlertCircle,
  RotateCcw,
  Lock,
  Unlock,
  Copy,
  Square,
} from 'lucide-react';

import api, { resolveApiAssetUrl } from '../../lib/api';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | null;
type DragMode = 'move' | 'resize' | null;

interface Hotspot {
  id: string;
  sceneId: string;
  moduleKey: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface PanoramaScene {
  id: string;
  name: string;
  imageUrl: string;
  isActive: boolean;
  hotspots: Hotspot[];
}

const MODULE_OPTIONS = [
  { value: 'desk', label: 'Desk' },
  { value: 'clients', label: 'Clients' },
  { value: 'atelier', label: 'Atelier' },
  { value: 'frames', label: 'Stock Frames' },
  { value: 'lenses', label: 'Stock Lenses' },
];

export function PanoramaManagementPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; hotspot: Hotspot } | null>(null);
  const [newHotspot, setNewHotspot] = useState({
    moduleKey: 'desk',
    label: '',
    x: 0.5,
    y: 0.5,
  });

  // Editor UI state
  const [lockedHotspots, setLockedHotspots] = useState<Set<string>>(new Set());
  const [showHotspotAreas, setShowHotspotAreas] = useState(true);

  // Minimum hotspot size (5% of container)
  const MIN_SIZE = 0.05;
  const DEFAULT_SIZE = 0.12;

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';

  // Fetch scenes
  const { data: scenes, isLoading: scenesLoading } = useQuery({
    queryKey: ['panorama', 'scenes'],
    queryFn: async () => {
      const response = await api.get('/panorama/scenes');
      return response.data.data as PanoramaScene[];
    },
  });

  const activeScene = scenes?.find((s) => s.isActive) || scenes?.[0];

  // Upload scene mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', 'Main Panorama');
      formData.append('isActive', 'true');
      const response = await api.post('/panorama/scenes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panorama'] });
    },
  });

  // Update scene mutation
  const updateSceneMutation = useMutation({
    mutationFn: async ({ id, file, name }: { id: string; file?: File; name?: string }) => {
      const formData = new FormData();
      if (file) formData.append('image', file);
      if (name) formData.append('name', name);
      const response = await api.put(`/panorama/scenes/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panorama'] });
    },
  });

  // Create hotspot mutation
  const createHotspotMutation = useMutation({
    mutationFn: async (data: { sceneId: string; moduleKey: string; label: string; x: number; y: number; w?: number; h?: number }) => {
      const response = await api.post('/panorama/hotspots', {
        ...data,
        w: data.w ?? DEFAULT_SIZE,
        h: data.h ?? DEFAULT_SIZE,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panorama'] });
      setShowAddModal(false);
      setNewHotspot({ moduleKey: 'desk', label: '', x: 0.5, y: 0.5 });
    },
  });

  // Update hotspot mutation
  const updateHotspotMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; moduleKey?: string; label?: string; isActive?: boolean }) => {
      const response = await api.put(`/panorama/hotspots/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panorama'] });
    },
  });

  // Update hotspot position mutation (supports x, y, w, h)
  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, x, y, w, h }: { id: string; x: number; y: number; w?: number; h?: number }) => {
      const response = await api.patch(`/panorama/hotspots/${id}/position`, { x, y, w, h });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panorama'] });
    },
  });

  // Toggle hotspot status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.patch(`/panorama/hotspots/${id}/status`, { isActive });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panorama'] });
    },
  });

  // Delete hotspot mutation
  const deleteHotspotMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/panorama/hotspots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panorama'] });
      setSelectedHotspot(null);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (activeScene) {
        updateSceneMutation.mutate({ id: activeScene.id, file });
      } else {
        uploadMutation.mutate(file);
      }
    }
  };

  // Check if hotspot is locked
  const isHotspotLocked = useCallback((hotspotId: string) => {
    return lockedHotspots.has(hotspotId);
  }, [lockedHotspots]);

  // Toggle hotspot lock
  const toggleHotspotLock = useCallback((hotspotId: string) => {
    setLockedHotspots(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hotspotId)) {
        newSet.delete(hotspotId);
      } else {
        newSet.add(hotspotId);
      }
      return newSet;
    });
  }, []);

  // Duplicate hotspot
  const handleDuplicateHotspot = useCallback((hotspot: Hotspot) => {
    if (!activeScene) return;
    // Offset the duplicate slightly (5% right and down)
    const offsetX = Math.min(1, Number(hotspot.x) + 0.05);
    const offsetY = Math.min(1, Number(hotspot.y) + 0.05);
    createHotspotMutation.mutate({
      sceneId: activeScene.id,
      moduleKey: hotspot.moduleKey,
      label: `${hotspot.label} (copy)`,
      x: offsetX,
      y: offsetY,
      w: Number(hotspot.w),
      h: Number(hotspot.h),
    });
  }, [activeScene, createHotspotMutation]);

  // Start dragging (move mode)
  const handleMoveStart = useCallback((hotspot: Hotspot, e: React.MouseEvent) => {
    if (!isEditorMode || !containerRef.current) return;
    // Don't allow move if locked
    if (isHotspotLocked(hotspot.id)) {
      e.stopPropagation();
      setSelectedHotspot({ ...hotspot, x: Number(hotspot.x), y: Number(hotspot.y), w: Number(hotspot.w), h: Number(hotspot.h) });
      return;
    }
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;
    setSelectedHotspot({ ...hotspot, x: Number(hotspot.x), y: Number(hotspot.y), w: Number(hotspot.w), h: Number(hotspot.h) });
    setDragStart({ x: mouseX, y: mouseY, hotspot: { ...hotspot, x: Number(hotspot.x), y: Number(hotspot.y), w: Number(hotspot.w), h: Number(hotspot.h) } });
    setDragMode('move');
    setResizeHandle(null);
  }, [isEditorMode, isHotspotLocked]);

  // Start resizing
  const handleResizeStart = useCallback((hotspot: Hotspot, handle: ResizeHandle, e: React.MouseEvent) => {
    if (!isEditorMode || !containerRef.current) return;
    // Don't allow resize if locked
    if (isHotspotLocked(hotspot.id)) {
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;
    setSelectedHotspot({ ...hotspot, x: Number(hotspot.x), y: Number(hotspot.y), w: Number(hotspot.w), h: Number(hotspot.h) });
    setDragStart({ x: mouseX, y: mouseY, hotspot: { ...hotspot, x: Number(hotspot.x), y: Number(hotspot.y), w: Number(hotspot.w), h: Number(hotspot.h) } });
    setDragMode('resize');
    setResizeHandle(handle);
  }, [isEditorMode, isHotspotLocked]);

  // Handle mouse move for both move and resize
  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!dragMode || !selectedHotspot || !containerRef.current || !dragStart) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;
    const deltaX = mouseX - dragStart.x;
    const deltaY = mouseY - dragStart.y;

    if (dragMode === 'move') {
      // Move the hotspot center
      const newX = Math.max(0, Math.min(1, dragStart.hotspot.x + deltaX));
      const newY = Math.max(0, Math.min(1, dragStart.hotspot.y + deltaY));
      setSelectedHotspot({ ...selectedHotspot, x: newX, y: newY });
    } else if (dragMode === 'resize' && resizeHandle) {
      // Resize based on which handle is being dragged
      let newX = dragStart.hotspot.x;
      let newY = dragStart.hotspot.y;
      let newW = dragStart.hotspot.w;
      let newH = dragStart.hotspot.h;

      // Calculate new dimensions based on handle
      if (resizeHandle.includes('e')) {
        newW = Math.max(MIN_SIZE, Math.min(1, dragStart.hotspot.w + deltaX * 2));
      }
      if (resizeHandle.includes('w')) {
        newW = Math.max(MIN_SIZE, Math.min(1, dragStart.hotspot.w - deltaX * 2));
      }
      if (resizeHandle.includes('s')) {
        newH = Math.max(MIN_SIZE, Math.min(1, dragStart.hotspot.h + deltaY * 2));
      }
      if (resizeHandle.includes('n')) {
        newH = Math.max(MIN_SIZE, Math.min(1, dragStart.hotspot.h - deltaY * 2));
      }

      // Clamp to valid bounds
      newW = Math.max(MIN_SIZE, newW);
      newH = Math.max(MIN_SIZE, newH);

      setSelectedHotspot({ ...selectedHotspot, x: newX, y: newY, w: newW, h: newH });
    }
  }, [dragMode, selectedHotspot, dragStart, resizeHandle, MIN_SIZE]);

  // End drag/resize
  const handleDragEnd = useCallback(() => {
    if (dragMode && selectedHotspot) {
      updatePositionMutation.mutate({
        id: selectedHotspot.id,
        x: selectedHotspot.x,
        y: selectedHotspot.y,
        w: selectedHotspot.w,
        h: selectedHotspot.h,
      });
    }
    setDragMode(null);
    setResizeHandle(null);
    setDragStart(null);
  }, [dragMode, selectedHotspot, updatePositionMutation]);

  // Reset hotspot size to default
  const handleResetSize = useCallback((hotspot: Hotspot) => {
    updatePositionMutation.mutate({
      id: hotspot.id,
      x: Number(hotspot.x),
      y: Number(hotspot.y),
      w: DEFAULT_SIZE,
      h: DEFAULT_SIZE,
    });
  }, [updatePositionMutation, DEFAULT_SIZE]);

  const handleAddHotspot = () => {
    if (!activeScene || !newHotspot.label.trim()) return;
    createHotspotMutation.mutate({
      sceneId: activeScene.id,
      moduleKey: newHotspot.moduleKey,
      label: newHotspot.label,
      x: newHotspot.x,
      y: newHotspot.y,
    });
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (!isEditorMode || !showAddModal || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setNewHotspot((prev) => ({ ...prev, x, y }));
  };

  if (scenesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-800">Only administrators can manage the panorama.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panorama Management</h1>
          <p className="text-gray-500 mt-1">Upload and configure your shop's panorama view</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditorMode(!isEditorMode)}
            className={cn(
              'px-4 py-2 rounded-lg flex items-center gap-2 transition-colors',
              isEditorMode
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <Settings className="w-4 h-4" />
            {isEditorMode ? 'Exit Editor' : 'Edit Hotspots'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending || updateSceneMutation.isPending}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 hover:bg-primary-700 disabled:opacity-50"
          >
            {uploadMutation.isPending || updateSceneMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {activeScene ? 'Replace Image' : 'Upload Panorama'}
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panorama Preview */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-gray-500" />
                Panorama Preview
              </h2>
              {isEditorMode && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowHotspotAreas(!showHotspotAreas)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                      showHotspotAreas
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    <Square className="w-4 h-4" />
                    {showHotspotAreas ? 'Hide Areas' : 'Show Areas'}
                  </button>
                  <span className="text-sm text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                    Editor Mode Active
                  </span>
                </div>
              )}
            </div>

            <div
              ref={containerRef}
              className={cn(
                'relative aspect-[16/9] bg-gray-100 select-none',
                isEditorMode && !dragMode && 'cursor-crosshair',
                dragMode === 'move' && 'cursor-grabbing',
                dragMode === 'resize' && 'cursor-nwse-resize'
              )}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onClick={handleImageClick}
            >
              {activeScene?.imageUrl ? (
                <img
                  src={resolveApiAssetUrl(activeScene.imageUrl)}
                  alt="Panorama"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ImageIcon className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">No panorama uploaded</p>
                  <p className="text-sm">Click "Upload Panorama" to get started</p>
                </div>
              )}

              {/* Hotspots */}
              {activeScene?.hotspots?.map((hotspot) => {
                const isSelected = selectedHotspot?.id === hotspot.id;
                const displayHotspot = isSelected && dragMode ? selectedHotspot : hotspot;
                const isLocked = isHotspotLocked(hotspot.id);
                // Convert string coordinates to numbers (Prisma Decimal returns strings)
                const x = Number(displayHotspot.x);
                const y = Number(displayHotspot.y);
                const w = Number(displayHotspot.w) || DEFAULT_SIZE;
                const h = Number(displayHotspot.h) || DEFAULT_SIZE;

                return (
                  <div
                    key={hotspot.id}
                    className={cn(
                      'absolute transition-all',
                      !hotspot.isActive && 'opacity-50',
                      isSelected && dragMode && 'z-50'
                    )}
                    style={{
                      left: `${(x - w / 2) * 100}%`,
                      top: `${(y - h / 2) * 100}%`,
                      width: `${w * 100}%`,
                      height: `${h * 100}%`,
                    }}
                  >
                    {/* Editor Mode: Visible bounding box with resize handles */}
                    {isEditorMode ? (
                      <div
                        className={cn(
                          'absolute inset-0 rounded-lg transition-all',
                          showHotspotAreas ? 'border-2' : 'border-0',
                          isLocked ? 'cursor-not-allowed' : 'cursor-move',
                          isSelected
                            ? 'border-primary-500 bg-primary-500/20 shadow-lg'
                            : showHotspotAreas
                              ? 'border-white/60 bg-white/10 hover:border-primary-400 hover:bg-primary-400/10'
                              : 'bg-transparent'
                        )}
                        onMouseDown={(e) => handleMoveStart(hotspot, e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!dragMode) {
                            setSelectedHotspot({ ...hotspot, x: Number(hotspot.x), y: Number(hotspot.y), w: Number(hotspot.w), h: Number(hotspot.h) });
                          }
                        }}
                      >
                        {/* Center label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <div className="relative">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md',
                                hotspot.isActive ? 'bg-primary-600' : 'bg-gray-400'
                              )}
                            >
                              {hotspot.label.charAt(0).toUpperCase()}
                            </div>
                            {/* Lock indicator */}
                            {isLocked && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                                <Lock className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-medium text-white bg-black/60 px-2 py-0.5 rounded mt-1 whitespace-nowrap max-w-full truncate">
                            {hotspot.label}
                          </span>
                        </div>

                        {/* Resize handles - only show when selected and not locked */}
                        {isSelected && !isLocked && (
                          <>
                            {/* NW handle */}
                            <div
                              className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-primary-500 rounded-sm cursor-nw-resize shadow-sm"
                              onMouseDown={(e) => handleResizeStart(hotspot, 'nw', e)}
                            />
                            {/* NE handle */}
                            <div
                              className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-primary-500 rounded-sm cursor-ne-resize shadow-sm"
                              onMouseDown={(e) => handleResizeStart(hotspot, 'ne', e)}
                            />
                            {/* SW handle */}
                            <div
                              className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-primary-500 rounded-sm cursor-sw-resize shadow-sm"
                              onMouseDown={(e) => handleResizeStart(hotspot, 'sw', e)}
                            />
                            {/* SE handle */}
                            <div
                              className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-primary-500 rounded-sm cursor-se-resize shadow-sm"
                              onMouseDown={(e) => handleResizeStart(hotspot, 'se', e)}
                            />
                          </>
                        )}
                      </div>
                    ) : (
                      /* Live Mode: Invisible clickable area with subtle hover effect */
                      <div className="absolute inset-0 group cursor-pointer hover:bg-white/5 rounded-lg transition-all" />
                    )}
                  </div>
                );
              })}

              {/* New hotspot preview */}
              {showAddModal && (
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: `${newHotspot.x * 100}%`,
                    top: `${newHotspot.y * 100}%`,
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-green-500 border-4 border-white shadow-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Add Hotspot */}
          {isEditorMode && activeScene && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Hotspot
              </h3>
              {showAddModal ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Click on the image to place the hotspot</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                    <input
                      type="text"
                      value={newHotspot.label}
                      onChange={(e) => setNewHotspot((prev) => ({ ...prev, label: e.target.value }))}
                      placeholder="e.g., Reception Desk"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                    <select
                      value={newHotspot.moduleKey}
                      onChange={(e) => setNewHotspot((prev) => ({ ...prev, moduleKey: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {MODULE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddHotspot}
                      disabled={!newHotspot.label.trim() || createHotspotMutation.isPending}
                      className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {createHotspotMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm hover:bg-primary-100 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Hotspot
                </button>
              )}
            </div>
          )}

          {/* Selected Hotspot Editor */}
          {isEditorMode && selectedHotspot && !dragMode && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Edit Hotspot
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                  <input
                    type="text"
                    value={selectedHotspot.label}
                    onChange={(e) => setSelectedHotspot({ ...selectedHotspot, label: e.target.value })}
                    onBlur={() => {
                      updateHotspotMutation.mutate({
                        id: selectedHotspot.id,
                        label: selectedHotspot.label,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                  <select
                    value={selectedHotspot.moduleKey}
                    onChange={(e) => {
                      const newModuleKey = e.target.value;
                      setSelectedHotspot({ ...selectedHotspot, moduleKey: newModuleKey });
                      updateHotspotMutation.mutate({
                        id: selectedHotspot.id,
                        moduleKey: newModuleKey,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {MODULE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Lock and Duplicate buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleHotspotLock(selectedHotspot.id)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1',
                      isHotspotLocked(selectedHotspot.id)
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {isHotspotLocked(selectedHotspot.id) ? (
                      <>
                        <Unlock className="w-4 h-4" />
                        Unlock
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Lock
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDuplicateHotspot(selectedHotspot)}
                    disabled={createHotspotMutation.isPending}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                </div>
                {/* Visibility and Delete buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      toggleStatusMutation.mutate({
                        id: selectedHotspot.id,
                        isActive: !selectedHotspot.isActive,
                      });
                      setSelectedHotspot({ ...selectedHotspot, isActive: !selectedHotspot.isActive });
                    }}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1',
                      selectedHotspot.isActive
                        ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    )}
                  >
                    {selectedHotspot.isActive ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Show
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this hotspot?')) {
                        deleteHotspotMutation.mutate(selectedHotspot.id);
                      }
                    }}
                    className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {/* Size info and reset */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Size: {Math.round(Number(selectedHotspot.w) * 100)}% × {Math.round(Number(selectedHotspot.h) * 100)}%</span>
                    <span>Pos: {Math.round(Number(selectedHotspot.x) * 100)}%, {Math.round(Number(selectedHotspot.y) * 100)}%</span>
                  </div>
                  <button
                    onClick={() => handleResetSize(selectedHotspot)}
                    className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Size
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hotspots List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <GripVertical className="w-4 h-4" />
              Hotspots ({activeScene?.hotspots?.length || 0})
            </h3>
            {activeScene?.hotspots?.length ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activeScene.hotspots.map((hotspot) => (
                  <div
                    key={hotspot.id}
                    onClick={() => isEditorMode && setSelectedHotspot(hotspot)}
                    className={cn(
                      'p-2 rounded-lg border transition-colors',
                      selectedHotspot?.id === hotspot.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300',
                      isEditorMode && 'cursor-pointer',
                      !hotspot.isActive && 'opacity-50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold',
                            hotspot.isActive ? 'bg-primary-600' : 'bg-gray-400'
                          )}
                        >
                          {hotspot.label.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{hotspot.label}</p>
                          <p className="text-xs text-gray-500">{hotspot.moduleKey}</p>
                        </div>
                      </div>
                      {!hotspot.isActive && (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No hotspots yet. {isEditorMode ? 'Click "New Hotspot" to add one.' : 'Enable editor mode to add hotspots.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
