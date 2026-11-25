import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Image as ImageIcon, Video, Upload, Search, Folder, X, Check, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from './Toast';
import { useDebounce } from '../../hooks/useDebounce';

/**
 * Reusable, high-performance Media Picker Modal.
 * Used by Content Studio, Create Post / Composer, and Edit Post Modal.
 * Features in-memory cached asset retrieval, debounced search, instant filtering,
 * and optional on-the-fly direct upload.
 */
export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = 'Select from Media Library',
  allowedTypes = 'all' // 'all' | 'image' | 'video'
}) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [assets, setAssets] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(allowedTypes);
  const [selectedCol, setSelectedCol] = useState('');

  const debouncedSearch = useDebounce(search, 250);

  // Fetch collections once on open
  useEffect(() => {
    if (!isOpen) return;
    api.collections.list()
      .then((data) => setCollections(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isOpen]);

  // Fetch media assets
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    setLoading(true);
    const params = {};
    if (typeFilter !== 'all') params.media_type = typeFilter;
    if (selectedCol) params.collection_id = parseInt(selectedCol, 10);
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

    api.media.list(params)
      .then((data) => {
        if (!isCancelled) {
          setAssets(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load media assets:', err);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, typeFilter, selectedCol, debouncedSearch]);

  const handleQuickUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const isVideo = file.type.startsWith('video');
      const uploaded = await api.media.upload(
        file,
        {
          title: file.name.replace(/\.[^/.]+$/, ''),
          collection_id: selectedCol ? parseInt(selectedCol, 10) : null,
          tags: isVideo ? ['video'] : ['image']
        }
      );
      showToast(`Uploaded "${file.name}" to Media Library`, 'success');
      // Prepend to current list
      setAssets((prev) => [uploaded, ...prev]);
      // Select immediately
      if (onSelect) {
        onSelect(uploaded);
        onClose();
      }
    } catch (err) {
      showToast('Upload failed: ' + (err.message || 'Server error'), 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-secondary/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden animate-scale-up text-text"
      >
        {/* Header */}
        <div
          className="p-5 sm:px-6 border-b border-border flex items-center justify-between bg-surface-raised transition-colors"
        >
          <div>
            <h3 className="m-0 text-base sm:text-lg font-bold text-text flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <span>{title}</span>
            </h3>
            <p className="m-0 mt-1 text-xs sm:text-sm text-text-secondary">
              Click any image or video from your verified cloud assets to attach it to your post.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <input
              type="file" ref={fileInputRef}
              className="hidden"
              accept={allowedTypes === 'video' ? 'video/*' : allowedTypes === 'image' ? 'image/*' : 'image/*,video/*'}
              onChange={handleQuickUpload}
            />
            <button
              className="btn-smooth px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-selected text-text-secondary hover:text-text text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-primary" />
                  Quick Upload
                </span>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text rounded-lg hover:bg-surface-selected transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div
          className="p-3.5 sm:px-6 border-b border-border flex flex-wrap gap-3 items-center bg-surface"
        >
          <div className="flex-[1_1_200px] relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border bg-surface-raised text-text text-xs sm:text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary shadow-xs transition-all"
            />
          </div>

          {allowedTypes === 'all' && (
            <div className="flex gap-1 bg-surface-raised p-1 rounded-xl border border-border">
              {['all', 'image', 'video'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`btn-smooth px-3 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                    typeFilter === t
                      ? 'bg-primary text-primary-on shadow-xs font-bold'
                      : 'text-text-secondary hover:text-text hover:bg-surface-selected'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'image' ? 'Images' : 'Videos'}
                </button>
              ))}
            </div>
          )}

          {collections.length > 0 && (
            <select
              value={selectedCol}
              onChange={(e) => setSelectedCol(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-surface-raised text-text text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs transition-all cursor-pointer"
            >
              <option value="">All Collections</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Assets Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-bg">
          {loading ? (
            <div className="text-center py-16 text-text-muted">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading media assets...</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-primary-soft text-primary flex items-center justify-center border border-border">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-text">No media assets found</h4>
              <p className="max-w-md mx-auto my-1.5 text-xs sm:text-sm text-text-muted">
                {search.trim() ? `No media matched "${search}".` : 'No media assets have been uploaded to your library yet.'}
              </p>
              <button
                className="btn-smooth mt-3 px-4 py-2 rounded-xl bg-primary hover:brightness-105 text-primary-on font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload an Asset Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {assets.map((asset) => {
                const isVid = asset.media_type === 'video' || asset.file_type === 'video';
                return (
                  <div
                    key={asset.id}
                    onClick={() => {
                      if (onSelect) {
                        onSelect(asset);
                        onClose();
                      }
                    }}
                    className="card-smooth border border-border rounded-xl overflow-hidden cursor-pointer bg-surface hover:border-primary/50 hover:shadow-md transition-all group"
                  >
                    <div className="w-full h-28 bg-surface-raised relative overflow-hidden">
                      {isVid ? (
                        asset.thumbnail_url ? (
                          <img src={asset.thumbnail_url} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <video src={asset.file_url} className="w-full h-full object-cover" muted />
                        )
                      ) : (
                        <img
                          src={asset.file_url || asset.thumbnail_url}
                          alt={asset.title || 'asset'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      )}
                      <span className="absolute top-1.5 right-1.5 bg-secondary/80 backdrop-blur-xs text-on-secondary px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-border">
                        {isVid ? 'Video' : 'Image'}
                      </span>
                    </div>
                    <div className="p-2.5">
                      <p
                        className="m-0 text-xs font-bold text-text truncate"
                        title={asset.title || asset.file_name}
                      >
                        {asset.title || asset.file_name}
                      </p>
                      <span className="text-[11px] text-text-secondary mt-0.5 block">
                        {asset.width && asset.height ? `${asset.width}×${asset.height}` : isVid ? 'Video asset' : 'Image asset'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-3.5 sm:px-6 border-t border-border flex justify-between items-center bg-surface-raised text-xs text-text-secondary"
        >
          <span>{assets.length} asset{assets.length === 1 ? '' : 's'} available</span>
          <button
            className="btn-smooth px-3.5 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-selected text-text font-semibold cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default MediaPickerModal;
