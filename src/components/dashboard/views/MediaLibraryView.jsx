import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useContent } from '../../../contexts/ContentContext';
import { useToast } from '../../common/Toast';
import { useDebounce } from '../../../hooks/useDebounce';
import { api } from '../../../services/api';
import { SpotlightCard } from '../../common/SpotlightCard';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import { 
  FolderPlus, 
  UploadCloud, 
  Image as ImageIcon, 
  Video, 
  Folder, 
  Search, 
  LayoutGrid, 
  List, 
  CheckSquare, 
  Square, 
  Trash2, 
  Edit3, 
  Copy, 
  Send, 
  Play, 
  X, 
  Sparkles,
  Layers,
  HardDrive
} from 'lucide-react';

import { CollectionsView } from './CollectionsView';

export function MediaLibraryView({
  onNavigate,
  onSelectMediaForStudio,
  onCreatePostWithMedia,
  initialCollectionId = null,
  initialTab = 'assets'
}) {
  const { user, currentBusiness } = useAuth();
  const { brandProfile } = useContent();
  const { showToast } = useToast();

  const [activeMediaTab, setActiveMediaTab] = useState(initialTab || (initialCollectionId ? 'assets' : 'assets'));

  useEffect(() => {
    if (initialTab) {
      setActiveMediaTab(initialTab);
    }
  }, [initialTab]);

  const [assets, setAssets] = useState([]);
  const [collections, setCollections] = useState([]);
  const [mediaCategories, setMediaCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'image' | 'video'
  const [collectionFilter, setCollectionFilter] = useState(initialCollectionId ? String(initialCollectionId) : '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list' // Selection & Bulk Actions
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);
  const [bulkCollectionId, setBulkCollectionId] = useState('');

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadAltText, setUploadAltText] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadCollectionId, setUploadCollectionId] = useState('');
  const [uploadCategoryId, setUploadCategoryId] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modals state
  const [createColModalOpen, setCreateColModalOpen] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [editAsset, setEditAsset] = useState(null);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [deletingAsset, setDeletingAsset] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef(null);
  const modalFileInputRef = useRef(null);

  const debouncedSearch = useDebounce(search, 250);

  const fetchCollections = async () => {
    try {
      const data = await api.collections.list();
      setCollections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  };

  const fetchMediaCategories = async () => {
    try {
      const data = await api.mediaCategories.list();
      setMediaCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load media categories:', err);
    }
  };

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter !== 'all') params.media_type = typeFilter;
      if (collectionFilter) params.collection_id = parseInt(collectionFilter, 10);
      if (categoryFilter) params.category_id = parseInt(categoryFilter, 10);
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (sortBy) params.sort_by = sortBy;

      const data = await api.media.list(params);
      setAssets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load media assets:', err);
      showToast('Failed to load media library: ' + (err.message || 'Server error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
    fetchMediaCategories();
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [typeFilter, collectionFilter, categoryFilter, sortBy, debouncedSearch]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await api.mediaCategories.create({ name: newCategoryName.trim() });
      setNewCategoryName('');
      await fetchMediaCategories();
      setCategoryFilter(String(created.id));
      showToast('Media category created.', 'success');
    } catch (err) {
      showToast(err.message || 'Could not create media category.', 'error');
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    try {
      const created = await api.collections.create({
        name: newColTitle.trim(),
        description: newColDesc.trim()
      });
      showToast('Collection created successfully!', 'success');
      setNewColTitle('');
      setNewColDesc('');
      setCreateColModalOpen(false);
      fetchCollections();
      setCollectionFilter(String(created.id));
    } catch (err) {
      showToast('Failed to create collection: ' + (err.message || 'Error'), 'error');
    }
  };

  const handleModalUpload = async (e) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) {
      showToast('Please select at least one file to upload.', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      let targetColId = uploadCollectionId ? parseInt(uploadCollectionId, 10) : null;
      if (newCollectionName.trim()) {
        const createdCol = await api.collections.create({ name: newCollectionName.trim() });
        targetColId = createdCol.id;
        fetchCollections();
      }

      const tagsArray = uploadTags
        ? uploadTags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const progress = new Array(uploadFiles.length).fill(0);
      await Promise.all(uploadFiles.map((file, index) => api.media.upload(
        file,
        {
          title: uploadFiles.length === 1 && uploadTitle.trim() ? uploadTitle.trim() : file.name,
          description: uploadDesc.trim(),
          alt_text: uploadAltText.trim(),
          tags: tagsArray,
          collection_id: targetColId,
          category_id: uploadCategoryId ? Number(uploadCategoryId) : null
        },
        (pct) => {
          progress[index] = pct;
          setUploadProgress(Math.round(progress.reduce((sum, value) => sum + value, 0) / progress.length));
        }
      )));

      showToast(`Successfully uploaded ${uploadFiles.length} file(s)!`, 'success');
      setUploadModalOpen(false);
      setUploadFiles([]);
      setUploadTitle('');
      setUploadDesc('');
      setUploadAltText('');
      setUploadTags('');
      setUploadCategoryId('');
      setNewCollectionName('');
      fetchMedia();
    } catch (err) {
      console.error('Upload failed:', err);
      showToast('Upload failed: ' + (err.message || 'Error'), 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSaveEditAsset = async (e) => {
    e.preventDefault();
    if (!editAsset) return;
    try {
      const tagsArray = Array.isArray(editAsset.tags)
        ? editAsset.tags
        : (editAsset.tags || '').split(',').map((t) => t.trim()).filter(Boolean);

      await api.media.update(editAsset.id, {
        title: editAsset.title,
        description: editAsset.description,
        alt_text: editAsset.alt_text,
        tags: tagsArray,
        collection_ids: editAsset.selectedCollectionIds,
        category_id: editAsset.category_id || null
      });

      showToast('Asset updated successfully!', 'success');
      setEditAsset(null);
      fetchMedia();
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingAsset) return;
    setIsDeleting(true);
    try {
      await api.media.delete(deletingAsset.id);
      setAssets((prev) => prev.filter((a) => a.id !== deletingAsset.id));
      showToast(`Media asset "${deletingAsset.file_name}" deleted.`, 'success');
      setDeletingAsset(null);
    } catch (err) {
      showToast(`Delete failed: ${err.message || 'Server error'}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAssignCollection = async () => {
    if (!bulkCollectionId || selectedAssetIds.length === 0) return;
    try {
      await api.collections.addMedia(parseInt(bulkCollectionId, 10), selectedAssetIds);
      showToast(`Added ${selectedAssetIds.length} asset(s) to collection!`, 'success');
      setSelectedAssetIds([]);
      setBulkCollectionId('');
      fetchMedia();
      fetchCollections();
    } catch (err) {
      showToast('Failed to assign assets: ' + err.message, 'error');
    }
  };

  const toggleSelectAsset = (id) => {
    if (selectedAssetIds.includes(id)) {
      setSelectedAssetIds(selectedAssetIds.filter((x) => x !== id));
    } else {
      setSelectedAssetIds([...selectedAssetIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedAssetIds.length === assets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(assets.map((a) => a.id));
    }
  };

  const copyUrl = (url) => {
    const fullUrl = url.startsWith('http') ? url : window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    showToast('Media URL copied to clipboard!', 'success');
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalBytes = assets.reduce((acc, a) => acc + (a.file_size_bytes || 0), 0);
  const imagesCount = assets.filter((a) => a.media_type === 'image' || a.mime_type?.startsWith('image')).length;
  const videosCount = assets.filter((a) => a.media_type === 'video' || a.mime_type?.startsWith('video')).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardPageHeader
        badge="Media Repository" badgeColor="indigo" title="Media Library" subtitle="Upload, organize into collections, and preview media before scheduling posts across social platforms." actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCreateColModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-border hover:bg-surface text-text-secondary shadow-sm transition-all flex items-center gap-2" >
              <FolderPlus className="w-4 h-4 text-primary" />
              <span>Create Collection</span>
            </button>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary text-primary-on shadow-md shadow-xs transition-all flex items-center gap-2" >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Media</span>
            </button>
          </div>
        }
      />

      {/* ── Sub-view Tabs (Assets vs Collections & Folders) ── */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface border border-border w-fit">
        <button
          type="button"
          onClick={() => setActiveMediaTab('assets')}
          className={`btn-smooth flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeMediaTab === 'assets'
              ? 'bg-primary text-primary-on shadow-sm'
              : 'text-text-secondary dark:text-text-muted hover:text-text dark:hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>All Media Assets</span>
          {assets.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20 dark:bg-black/20">
              {assets.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveMediaTab('collections')}
          className={`btn-smooth flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeMediaTab === 'collections'
              ? 'bg-primary text-primary-on shadow-sm'
              : 'text-text-secondary dark:text-text-muted hover:text-text dark:hover:text-white'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Collections & Folders</span>
          {collections.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20 dark:bg-black/20">
              {collections.length}
            </span>
          )}
        </button>
      </div>

      {activeMediaTab === 'collections' ? (
        <CollectionsView
          onNavigate={onNavigate}
          isEmbedded={true}
          onSelectCollectionForLibrary={(colId) => {
            setCollectionFilter(String(colId));
            setActiveMediaTab('assets');
            showToast('Filtered media by selected collection.', 'info');
          }}
        />
      ) : (
        <>
          {/* Bento Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SpotlightCard className="p-4 sm:p-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Total Assets</div>
              <div className="text-xl font-extrabold text-text mt-0.5">{assets.length}</div>
              <div className="text-[11px] text-text-muted mt-0.5">{formatBytes(totalBytes)} used</div>
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-4 sm:p-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-bg text-primary flex items-center justify-center shrink-0 shadow-sm">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Images</div>
              <div className="text-xl font-extrabold text-primary mt-0.5">{imagesCount}</div>
              <div className="text-[11px] text-text-muted mt-0.5">High-res photos</div>
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-4 sm:p-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0 shadow-sm">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Videos</div>
              <div className="text-xl font-extrabold text-warning mt-0.5">{videosCount}</div>
              <div className="text-[11px] text-text-muted mt-0.5">Reels & Clips</div>
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-4 sm:p-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 shadow-sm">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Collections</div>
              <div className="text-xl font-extrabold text-violet-600 mt-0.5">{collections.length}</div>
              <div className="text-[11px] text-text-muted mt-0.5">Active themes</div>
            </div>
          </div>
        </SpotlightCard>
      </div>

      {/* Toolbar: Search, Filters, Sort, Grid/List */}
      <SpotlightCard className="p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Type Filter Pills */}
            <div className="flex items-center p-1 bg-bg rounded-xl border border-border">
              {['all', 'image', 'video'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                    typeFilter === t
                      ? 'bg-white text-text shadow-sm' : 'text-text-secondary hover:text-text' }`}
                >
                  {t === 'all' ? 'All' : `${t}s`}
                </button>
              ))}
            </div>

            {/* Collection Filter */}
            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-white text-xs font-medium text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary" >
              <option value="">All Collections</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.media_count})</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-white text-xs font-medium text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary" >
              <option value="">All Categories</option>
              {mediaCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name} ({category.asset_count})</option>
              ))}
            </select>

            <div className="flex items-center gap-1.5">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); } }}
                placeholder="New category"
                className="w-28 px-2.5 py-1.5 rounded-xl border border-border bg-white text-xs text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button onClick={handleCreateCategory} className="px-2.5 py-1.5 rounded-xl bg-primary text-primary-on text-xs font-semibold hover:bg-primary">
                Add
              </button>
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-white text-xs font-medium text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary" >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="name">Sort: Filename</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text" placeholder="Search filename, title, tags..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-white text-xs text-text-secondary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 self-end md:self-center">
            <div className="flex items-center p-1 bg-bg rounded-xl border border-border">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text' }`}
                title="Grid View" >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text' }`}
                title="List View" >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* Bulk Action Bar */}
      {selectedAssetIds.length > 0 && (
        <div className="bg-surface-raised border border-border text-text rounded-2xl px-5 py-3 flex items-center justify-between flex-wrap gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary/10 animate-pulse" />
            <span className="text-xs font-semibold text-slate-200">
              {selectedAssetIds.length} asset{selectedAssetIds.length === 1 ? '' : 's'} selected
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={bulkCollectionId}
              onChange={(e) => setBulkCollectionId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-surface-raised border border-border text-xs text-text focus:outline-none" >
              <option value="">Assign to Collection...</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={handleBulkAssignCollection}
              disabled={!bulkCollectionId}
              className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-sm" >
              Assign Bulk
            </button>
            <button
              onClick={() => setSelectedAssetIds([])}
              className="px-3 py-1.5 rounded-xl text-text-muted hover:text-white text-xs transition-colors" >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Media Content */}
      {loading ? (
        <SpotlightCard className="p-16 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-text-muted">Loading media library assets...</p>
        </SpotlightCard>
      ) : assets.length === 0 ? (
        <SpotlightCard className="p-16 text-center border-dashed border-2 border-border">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-text mb-1">No Media Assets Uploaded Yet</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto mb-5 leading-relaxed">
            Upload images and videos to populate your Media Library and attach them to posts or schedule rules.
          </p>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary text-primary-on text-xs font-semibold shadow-md shadow-xs transition-all inline-flex items-center gap-2" >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Media Now</span>
          </button>
        </SpotlightCard>
      ) : viewMode === 'grid' ? (
        /* Bento Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {assets.map((asset) => {
            const isVid = asset.media_type === 'video' || asset.mime_type?.startsWith('video');
            const isSelected = selectedAssetIds.includes(asset.id);

            return (
              <div
                key={asset.id}
                className={`group relative bg-surface border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col hover:shadow-lg ${
                  isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40' }`}
              >
                {/* Select Checkbox */}
                <button
                  type="button" onClick={() => toggleSelectAsset(asset.id)}
                  className="absolute top-3 left-3 z-10 p-1.5 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-md transition-all text-white" >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4 text-white/80" />
                  )}
                </button>

                {/* Preview Box */}
                <div
                  className="relative w-full h-44 bg-surface cursor-pointer overflow-hidden" onClick={() => setPreviewAsset(asset)}
                >
                  {isVid ? (
                    <video
                      src={asset.file_url}
                      className="w-full h-full object-contain bg-surface group-hover:scale-105 transition-transform duration-500" muted
                      preload="metadata" />
                  ) : (
                    <img
                      src={asset.file_url}
                      alt={asset.file_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  )}

                  {/* Video Play Badge */}
                  {isVid && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Badge */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-black/60 backdrop-blur-md text-white border border-white/20">
                      {isVid ? ((asset.meta_info?.aspect_ratio === '9:16' || asset.aspect_ratio === '9:16') ? '9:16 Reel' : 'Video') : 'Image'}
                    </span>
                    {asset.is_duplicate && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-rose-600 text-white shadow-md animate-pulse">
                        DUPLICATE
                      </span>
                    )}
                    {asset.validation_status === 'BLOCK' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-red-800 text-white shadow-md">
                        BLOCKED
                      </span>
                    )}
                    {asset.validation_status === 'PASS' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-emerald-600 text-white">
                        {asset.quality_score ? `${asset.quality_score}% VALID` : 'VALIDATED'}
                      </span>
                    )}
                  </div>

                  {/* Duplicate warning ribbon */}
                  {asset.is_duplicate && (
                    <div className="absolute bottom-0 inset-x-0 bg-rose-950/90 text-rose-200 text-[10px] font-bold px-2.5 py-1 backdrop-blur-xs flex items-center justify-between">
                      <span>⚠️ Duplicate Media</span>
                      <span>{asset.duplicate_of_id ? `#${asset.duplicate_of_id}` : 'Historical'}</span>
                    </div>
                  )}
                </div>

                {/* Card Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4
                      className="text-xs font-bold text-text truncate mb-1" title={asset.title || asset.file_name}
                    >
                      {asset.title || asset.file_name}
                    </h4>

                    {asset.description && (
                      <p className="text-[11px] text-text-muted truncate mb-2">
                        {asset.description}
                      </p>
                    )}

                    {/* Collections & Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(asset.collections || []).map((c) => (
                        <span
                          key={c.id}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary-soft text-primary border border-primary/20" >
                          {c.name}
                        </span>
                      ))}
                      {(asset.tags || []).slice(0, 2).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded-md text-[10px] text-text-secondary bg-bg" >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-text-muted mb-3 pt-2 border-t border-border">
                      <span>{formatBytes(asset.file_size_bytes)}</span>
                      <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onCreatePostWithMedia ? onCreatePostWithMedia(asset) : onNavigate?.('content-studio')}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-primary hover:bg-primary text-primary-on text-[11px] font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5" >
                        <Send className="w-3 h-3" />
                        <span>Post</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditAsset({
                            ...asset,
                            selectedCollectionIds: (asset.collections || []).map((c) => c.id)
                          });
                        }}
                        className="p-1.5 rounded-xl border border-border hover:bg-surface text-text-secondary transition-colors" title="Edit metadata" >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingAsset(asset)}
                        className="p-1.5 rounded-xl border border-border hover:bg-rose-50 text-rose-500 transition-colors" title="Delete asset" >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Bento List View */
        <SpotlightCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface border-b border-border text-text-secondary font-semibold">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox" onChange={selectAll}
                      checked={selectedAssetIds.length === assets.length && assets.length > 0}
                      className="rounded text-primary focus:ring-primary" />
                  </th>
                  <th className="py-3 px-4 w-16">Preview</th>
                  <th className="py-3 px-4">Title & Filename</th>
                  <th className="py-3 px-4">Collections</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((asset) => {
                  const isVid = asset.media_type === 'video' || asset.mime_type?.startsWith('video');
                  const isSelected = selectedAssetIds.includes(asset.id);

                  return (
                    <tr
                      key={asset.id}
                      className={`hover:bg-surface transition-colors ${isSelected ? 'bg-primary/10' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox" checked={isSelected}
                          onChange={() => toggleSelectAsset(asset.id)}
                          className="rounded text-primary focus:ring-primary" />
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className="w-11 h-11 rounded-lg bg-surface-raised overflow-hidden cursor-pointer border border-border" onClick={() => setPreviewAsset(asset)}
                        >
                          {isVid ? (
                            <video src={asset.file_url} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={asset.file_url} alt={asset.file_name} className="w-full h-full object-cover" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text">{asset.title || asset.file_name}</div>
                        <div className="text-[11px] text-text-muted">{asset.file_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        {(asset.collections || []).map((c) => c.name).join(', ') || '—'}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold text-text-muted">
                        {asset.media_type}
                      </td>
                      <td className="py-3 px-4 text-text-muted">
                        {formatBytes(asset.file_size_bytes)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {asset.is_duplicate ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                              DUPLICATE {asset.duplicate_of_id ? `(#${asset.duplicate_of_id})` : ''}
                            </span>
                          ) : asset.validation_status === 'BLOCK' ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700 border border-red-300">
                              BLOCKED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {asset.quality_score != null ? `${asset.quality_score}% PASS` : 'PASS'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-muted">
                        {new Date(asset.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onCreatePostWithMedia ? onCreatePostWithMedia(asset) : onNavigate?.('content-studio')}
                            className="px-2.5 py-1 rounded-lg bg-primary hover:brightness-105 text-primary-on text-[11px] font-medium shadow-xs cursor-pointer" >
                            Post
                          </button>
                          <button
                            onClick={() => setEditAsset({ ...asset, selectedCollectionIds: (asset.collections || []).map((c) => c.id) })}
                            className="p-1 rounded-lg border border-border hover:bg-surface text-text-secondary" >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingAsset(asset)}
                            className="p-1 rounded-lg border border-border hover:bg-rose-50 text-rose-500" >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SpotlightCard>
      )}

      {/* RICH UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-text">Upload Media Assets</h3>
              </div>
              {!uploading && (
                <button
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg transition-colors" onClick={() => setUploadModalOpen(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleModalUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Select File(s) *
                </label>
                <input
                  type="file" multiple
                  required
                  accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm" ref={modalFileInputRef}
                  onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                  className="w-full text-xs text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary-soft cursor-pointer border border-border rounded-xl p-1.5" />
                {uploadFiles.length > 0 && (
                  <p className="text-[11px] text-primary mt-1 font-medium">
                    {uploadFiles.length} file(s) selected: {uploadFiles.map((f) => f.name).join(', ')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Title (Optional)
                </label>
                <input
                  type="text" placeholder="e.g. Hero Banner Promo, Summer Toy Demo" value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs text-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Media description for reference or draft caption..." value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs text-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text" placeholder="toys, promo, reels" value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs text-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5">
                    Alt Text (Accessibility)
                  </label>
                  <input
                    type="text" placeholder="Short description of image" value={uploadAltText}
                    onChange={(e) => setUploadAltText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs text-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              {/* Collection Selection */}
              <div className="bg-surface p-3 rounded-xl border border-border">
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Assign to Collection
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={uploadCollectionId}
                    onChange={(e) => setUploadCollectionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs text-text focus:outline-none" >
                    <option value="">Select Existing Collection...</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <input
                    type="text" placeholder="Or create new collection..." value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs text-text placeholder-slate-400 focus:outline-none" />
                </div>
              </div>

              <div className="bg-surface p-3 rounded-xl border border-border">
                <label className="block text-xs font-bold text-text-secondary mb-1.5">Media Category</label>
                <select
                  value={uploadCategoryId}
                  onChange={(e) => setUploadCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs text-text focus:outline-none"
                >
                  <option value="">No category</option>
                  {mediaCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-text-secondary flex justify-between">
                    <span>Streaming to Cloudinary CDN...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button" onClick={() => setUploadModalOpen(false)}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-bg transition-colors" >
                  Cancel
                </button>
                <button
                  type="submit" disabled={uploading || uploadFiles.length === 0}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary disabled:opacity-50 text-white shadow-md shadow-xs transition-all" >
                  {uploading ? 'Uploading...' : `Upload ${uploadFiles.length} File(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COLLECTION MODAL */}
      {createColModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="text-base font-bold text-text">Create Media Collection</h3>
              <button
                className="p-1 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg" onClick={() => setCreateColModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Collection Name *</label>
                <input
                  type="text" required
                  placeholder="e.g. Summer Toy Promotions" value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs text-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Collection purpose and usage..." value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs text-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button" onClick={() => setCreateColModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-bg" >
                  Cancel
                </button>
                <button
                  type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary text-primary-on shadow-md shadow-xs" >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ASSET MODAL */}
      {editAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="text-base font-bold text-text">Edit Asset Metadata</h3>
              <button
                className="p-1 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg" onClick={() => setEditAsset(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEditAsset} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Title</label>
                <input
                  type="text" value={editAsset.title || ''}
                  onChange={(e) => setEditAsset({ ...editAsset, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs text-text focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editAsset.description || ''}
                  onChange={(e) => setEditAsset({ ...editAsset, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs text-text focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Alt Text</label>
                <input
                  type="text" value={editAsset.alt_text || ''}
                  onChange={(e) => setEditAsset({ ...editAsset, alt_text: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs text-text focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Tags (Comma-separated)</label>
                <input
                  type="text" value={Array.isArray(editAsset.tags) ? editAsset.tags.join(', ') : (editAsset.tags || '')}
                  onChange={(e) => setEditAsset({ ...editAsset, tags: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs text-text focus:outline-none" />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button" onClick={() => setEditAsset(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-bg" >
                  Cancel
                </button>
                <button
                  type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary text-primary-on shadow-md shadow-xs" >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PREVIEW MODAL */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="text-base font-bold text-text truncate pr-4">
                {previewAsset.title || previewAsset.file_name}
              </h3>
              <button
                className="p-1 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg" onClick={() => setPreviewAsset(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`bg-surface rounded-2xl overflow-hidden text-center mb-4 flex items-center justify-center ${
              (previewAsset.media_type === 'video' && (previewAsset.meta_info?.aspect_ratio === '9:16' || previewAsset.aspect_ratio === '9:16'))
                ? 'max-w-[280px] h-[500px] mx-auto aspect-[9/16] shadow-2xl border border-border'
                : 'max-h-[480px] w-full'
            }`}>
              {previewAsset.media_type === 'video' ? (
                <video src={previewAsset.file_url} controls autoPlay playsInline className="w-full h-full object-contain" />
              ) : (
                <img src={previewAsset.file_url} alt="Preview" className="max-w-full max-h-[460px] object-contain" />
              )}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-xs text-text-muted">
                Size: <span className="font-semibold text-text-secondary">{formatBytes(previewAsset.file_size_bytes)}</span> • Format: <span className="font-semibold text-text-secondary">{previewAsset.mime_type || previewAsset.media_type}</span> • Ratio: <span className="font-semibold text-text-secondary">{previewAsset.meta_info?.aspect_ratio || (previewAsset.media_type === 'video' ? '9:16' : '1:1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyUrl(previewAsset.file_url)}
                  className="px-3 py-1.5 rounded-xl border border-border hover:bg-surface text-text-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors" >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy URL</span>
                </button>
                <button
                  onClick={() => {
                    setPreviewAsset(null);
                    if (onCreatePostWithMedia) onCreatePostWithMedia(previewAsset);
                    else onNavigate?.('content-studio');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary text-primary-on text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-xs transition-all" >
                  <Send className="w-3.5 h-3.5" />
                  <span>Create Post with Media</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text mb-1.5">Delete Media Asset</h3>
            <p className="text-xs text-text-muted mb-5 leading-relaxed">
              Are you sure you want to delete <strong className="text-text">"{deletingAsset.file_name}"</strong>? This will remove the file from Cloudinary CDN and delete all database references.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeletingAsset(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-bg" >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 disabled:opacity-50" >
                {isDeleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
