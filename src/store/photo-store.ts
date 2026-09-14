import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { produce } from 'immer';

import { type Photo, type PhotoFilters } from '@/types/photo';
import { type AnalysisResult } from '@/types/analysis';
import { type Caption } from '@/types/caption';

export interface PhotoState {
  // Data
  photos: Photo[];
  selectedPhotos: Set<string>;
  selectedPhotoIds: string[];
  activeFilters: PhotoFilters;
  topPhotos: Photo[];
  analysisResults: Map<string, AnalysisResult>;
  captions: Map<string, Caption[]>;
  uploadQueue: File[];

  // UI State
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  viewMode: 'grid' | 'list' | 'carousel';
  sortBy: 'score' | 'date' | 'name';
  sortOrder: 'asc' | 'desc';

  // Immich
  immichPhotos: Photo[];
  immichAlbums: any[];
  isSyncing: boolean;
  syncProgress: number;

  // Actions
  addPhotos: (photos: Photo[]) => void;
  removePhoto: (photoId: string) => void;
  updatePhoto: (photoId: string, updates: Partial<Photo>) => void;
  setSelectedPhotos: (photoIds: string[]) => void;
  togglePhotoSelection: (photoId: string) => void;
  selectAllVisible: () => void;
  clearSelection: () => void;

  setFilters: (filters: Partial<PhotoFilters>) => void;
  clearFilters: () => void;
  setSorting: (sortBy: PhotoState['sortBy'], sortOrder: PhotoState['sortOrder']) => void;

  addAnalysisResult: (photoId: string, result: AnalysisResult) => void;
  addCaptions: (photoId: string, captions: Caption[]) => void;

  setTopPhotos: (photos: Photo[]) => void;
  setImmichPhotos: (photos: Photo[]) => void;
  setImmichAlbums: (albums: any[]) => void;
  setSyncProgress: (progress: number) => void;

  setLoading: (loading: boolean) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setError: (error: string | null) => void;
  setViewMode: (mode: PhotoState['viewMode']) => void;

  clearAll: () => void;
}

export const usePhotoStore = create<PhotoState>()(
  devtools(
    persist(
      (set) => ({
        // Initial State
        photos: [],
        selectedPhotos: new Set(),
        selectedPhotoIds: [],
        activeFilters: {},
        topPhotos: [],
        analysisResults: new Map(),
        captions: new Map(),
        uploadQueue: [],
        isLoading: false,
        isAnalyzing: false,
        error: null,
        viewMode: 'grid',
        sortBy: 'score',
        sortOrder: 'desc',
        immichPhotos: [],
        immichAlbums: [],
        isSyncing: false,
        syncProgress: 0,

        // Photo Actions
        addPhotos: (newPhotos) =>
          set(
            produce((state: PhotoState) => {
              state.photos.push(...newPhotos);
            }),
            false,
            'photoStore/addPhotos'
          ),

        removePhoto: (photoId) =>
          set(
            produce((state: PhotoState) => {
              state.photos = state.photos.filter((p) => p.id !== photoId);
              state.selectedPhotos.delete(photoId);
              state.selectedPhotoIds = state.selectedPhotoIds.filter((id) => id !== photoId);
              state.analysisResults.delete(photoId);
              state.captions.delete(photoId);
            }),
            false,
            'photoStore/removePhoto'
          ),

        updatePhoto: (photoId, updates) =>
          set(
            produce((state: PhotoState) => {
              const index = state.photos.findIndex((p) => p.id === photoId);
              if (index !== -1) {
                Object.assign(state.photos[index], updates);
              }
            }),
            false,
            'photoStore/updatePhoto'
          ),

        setSelectedPhotos: (photoIds) =>
          set(
            produce((state: PhotoState) => {
              state.selectedPhotos = new Set(photoIds);
              state.selectedPhotoIds = photoIds;
            }),
            false,
            'photoStore/setSelectedPhotos'
          ),

        togglePhotoSelection: (photoId) =>
          set(
            produce((state: PhotoState) => {
              if (state.selectedPhotos.has(photoId)) {
                state.selectedPhotos.delete(photoId);
              } else {
                state.selectedPhotos.add(photoId);
              }
              // Keep selectedPhotoIds in sync
              state.selectedPhotoIds = Array.from(state.selectedPhotos);
            }),
            false,
            'photoStore/togglePhotoSelection'
          ),

        selectAllVisible: () =>
          set(
            produce((state: PhotoState) => {
              const ids = state.photos.map((p) => p.id);
              state.selectedPhotos = new Set(ids);
              state.selectedPhotoIds = ids;
            }),
            false,
            'photoStore/selectAllVisible'
          ),

        clearSelection: () =>
          set(
            produce((state: PhotoState) => {
              state.selectedPhotos.clear();
              state.selectedPhotoIds = [];
            }),
            false,
            'photoStore/clearSelection'
          ),

        // Filter Actions
        setFilters: (filters) =>
          set(
            produce((state: PhotoState) => {
              state.activeFilters = { ...state.activeFilters, ...filters };
            }),
            false,
            'photoStore/setFilters'
          ),

        clearFilters: () =>
          set(
            produce((state: PhotoState) => {
              state.activeFilters = {};
            }),
            false,
            'photoStore/clearFilters'
          ),

        setSorting: (sortBy, sortOrder) =>
          set(
            produce((state: PhotoState) => {
              state.sortBy = sortBy;
              state.sortOrder = sortOrder;
            }),
            false,
            'photoStore/setSorting'
          ),

        // Analysis Actions
        addAnalysisResult: (photoId, result) =>
          set(
            produce((state: PhotoState) => {
              state.analysisResults.set(photoId, result);
              const photo = state.photos.find((p) => p.id === photoId);
              if (photo) {
                photo.analyzed = true;
                photo.analyzedAt = new Date();
                photo.overallScore = Number(JSON.parse(result.composition).score || 0) +
                                     Number(JSON.parse(result.emotion).score || 0) +
                                     Number(JSON.parse(result.aesthetic).score || 0) +
                                     Number(JSON.parse(result.social).score || 0) / 4;
              }
            }),
            false,
            'photoStore/addAnalysisResult'
          ),

        addCaptions: (photoId, captions) =>
          set(
            produce((state: PhotoState) => {
              state.captions.set(photoId, captions);
            }),
            false,
            'photoStore/addCaptions'
          ),

        setTopPhotos: (photos) =>
          set(
            produce((state: PhotoState) => {
              state.topPhotos = photos;
            }),
            false,
            'photoStore/setTopPhotos'
          ),

        // Immich Actions
        setImmichPhotos: (photos) =>
          set(
            produce((state: PhotoState) => {
              state.immichPhotos = photos;
            }),
            false,
            'photoStore/setImmichPhotos'
          ),

        setImmichAlbums: (albums) =>
          set(
            produce((state: PhotoState) => {
              state.immichAlbums = albums;
            }),
            false,
            'photoStore/setImmichAlbums'
          ),

        setSyncProgress: (progress) =>
          set(
            produce((state: PhotoState) => {
              state.syncProgress = progress;
              state.isSyncing = progress > 0 && progress < 100;
            }),
            false,
            'photoStore/setSyncProgress'
          ),

        // UI Actions
        setLoading: (loading) =>
          set(
            produce((state: PhotoState) => {
              state.isLoading = loading;
            }),
            false,
            'photoStore/setLoading'
          ),

        setAnalyzing: (analyzing) =>
          set(
            produce((state: PhotoState) => {
              state.isAnalyzing = analyzing;
            }),
            false,
            'photoStore/setAnalyzing'
          ),

        setError: (error) =>
          set(
            produce((state: PhotoState) => {
              state.error = error;
            }),
            false,
            'photoStore/setError'
          ),

        setViewMode: (mode) =>
          set(
            produce((state: PhotoState) => {
              state.viewMode = mode;
            }),
            false,
            'photoStore/setViewMode'
          ),

        clearAll: () =>
          set(
            produce((state: PhotoState) => {
              state.photos = [];
              state.selectedPhotos.clear();
              state.analysisResults.clear();
              state.captions.clear();
              state.topPhotos = [];
              state.activeFilters = {};
              state.error = null;
            }),
            false,
            'photoStore/clearAll'
          ),
      }),
      {
        name: 'photo-store',
        partialize: (state) => ({
          photos: state.photos,
          activeFilters: state.activeFilters,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          viewMode: state.viewMode,
        }),
      }
    )
  )
);

// Selectors
export const usePhotoSelectors = () => {
  const photos = usePhotoStore((s) => s.photos);
  const selectedPhotos = usePhotoStore((s) => s.selectedPhotos);
  const activeFilters = usePhotoStore((s) => s.activeFilters);

  const filteredPhotos = photos.filter((photo) => {
    if (activeFilters.minScore && (photo.overallScore || 0) < activeFilters.minScore) {
      return false;
    }
    if (activeFilters.maxScore && (photo.overallScore || 0) > activeFilters.maxScore) {
      return false;
    }
    if (activeFilters.category && photo.category !== activeFilters.category) {
      return false;
    }
    if (activeFilters.source && photo.source !== activeFilters.source) {
      return false;
    }
    return true;
  });

  const selectedCount = selectedPhotos.size;
  const totalCount = photos.length;
  const hasSelection = selectedCount > 0;
  const allSelected = selectedCount === filteredPhotos.length && selectedCount > 0;

  return {
    filteredPhotos,
    selectedCount,
    totalCount,
    hasSelection,
    allSelected,
    hasPhotos: totalCount > 0,
    isEmpty: totalCount === 0,
    selectedPhotosList: Array.from(selectedPhotos),
  };
};