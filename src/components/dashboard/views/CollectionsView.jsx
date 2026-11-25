import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useToast } from '../../common/Toast';
import { useDebounce } from '../../../hooks/useDebounce';
import { SpotlightCard } from '../../common/SpotlightCard';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import { 
  FolderPlus, 
  Folder, 
  Search, 
  Sparkles, 
  Image as ImageIcon, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  X, 
  AlertTriangle,
  Layers
} from 'lucide-react';

export function CollectionsView({ onNavigate, onSelectCollectionForLibrary, isEmbedded = false }) {
  const { showToast } = useToast();

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalCollection, setEditModalCollection] = useState(null);
  const [viewModalCollection, setViewModalCollection] = useState(null);
  const [deleteModalCollection, setDeleteModalCollection] = useState(null);
  const [deleteMediaChecked, setDeleteMediaChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverAssetId, setCoverAssetId] = useState('');
  const [nameError, setNameError] = useState('');
  const [editNameError, setEditNameError] = useState('');
  const [availableMedia, setAvailableMedia] = useState([]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const data = await api.collections.list(debouncedSearch);
      setCollections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load collections:', err);
      showToast('Error loading collections: ' + (err.message || 'Server error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [debouncedSearch]);

  const handleOpenCreateModal = () => {
    setName('');
    setDescription('');
    setCoverAssetId('');
    setNameError('');
    setCreateModalOpen(true);
    api.media.list({ media_type: 'image' })
      .then((data) => setAvailableMedia(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  const handleOpenEditModal = (col) => {
    setEditModalCollection({ ...col, cover_asset_id: col.cover_asset_id ? String(col.cover_asset_id) : '' });
    setEditNameError('');
    api.media.list({ media_type: 'image' })
      .then((data) => setAvailableMedia(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Collection name is required.');
      return;
    }
    setNameError('');
    setSubmitting(true);
    try {
      await api.collections.create({
        name: name.trim(),
        description: description.trim(),
        cover_asset_id: coverAssetId ? parseInt(coverAssetId, 10) : null
      });
      showToast('Collection created successfully!', 'success');
      setName('');
      setDescription('');
      setCoverAssetId('');
      setCreateModalOpen(false);
      fetchCollections();
    } catch (err) {
      showToast('Failed to create collection: ' + (err.message || 'Error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editModalCollection) return;
    if (!editModalCollection.name?.trim()) {
      setEditNameError('Collection name is required.');
      return;
    }
    setEditNameError('');
    setSubmitting(true);
    try {
      await api.collections.update(editModalCollection.id, {
        name: editModalCollection.name.trim(),
        description: editModalCollection.description,
        cover_asset_id: editModalCollection.cover_asset_id ? parseInt(editModalCollection.cover_asset_id, 10) : null
      });
      showToast('Collection updated successfully!', 'success');
      setEditModalCollection(null);
      fetchCollections();
    } catch (err) {
      showToast('Failed to update collection: ' + (err.message || 'Error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalCollection) return;
    setSubmitting(true);
    try {
      await api.collections.delete(deleteModalCollection.id, deleteMediaChecked);
      showToast(`Collection deleted${deleteMediaChecked ? ' and media files removed' : ' (media files preserved)'}`, 'success');
      setDeleteModalCollection(null);
      fetchCollections();
    } catch (err) {
      showToast('Failed to delete collection: ' + (err.message || 'Error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMediaFromCollection = async (collectionId, mediaId) => {
    try {
      await api.collections.removeMedia(collectionId, mediaId);
      showToast('Media removed from collection', 'success');
      // Refresh current open view modal
      const updated = await api.collections.get(collectionId);
      setViewModalCollection(updated);
      fetchCollections();
    } catch (err) {
      showToast('Failed to remove media: ' + (err.message || 'Error'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header (when standalone) */}
      {!isEmbedded && (
        <DashboardPageHeader
          badge="Asset Organization" badgeColor="indigo" title="Media Collections" subtitle="Organize assets into curated themes, campaign batches, and automated posting buckets." actions={
            <button
              id="open-create-collection-btn" onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary text-primary-on shadow-md shadow-xs transition-all flex items-center gap-2" >
              <FolderPlus className="w-4 h-4" />
              <span>Create Collection</span>
            </button>
          }
        />
      )}

      {/* Toolbar */}
      <SpotlightCard className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text" placeholder="Search collections by name or description..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-white text-xs text-text-secondary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <Folder className="w-4 h-4 text-primary" />
            <span>{collections.length} {collections.length === 1 ? 'collection' : 'collections'}</span>
          </div>
        </div>
      </SpotlightCard>

      {/* Grid or Empty State */}
      {loading ? (
        <SpotlightCard className="p-16 text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-text-muted">Loading collections...</p>
        </SpotlightCard>
      ) : collections.length === 0 ? (
        <SpotlightCard className="p-16 text-center border-dashed border-2 border-border">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <Folder className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-text mb-1">No Collections Created Yet</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto mb-5 leading-relaxed">
            Collections group images and videos together for structured scheduling, campaign tagging, and recurring bucket automation.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary text-primary-on text-xs font-semibold shadow-md shadow-xs transition-all inline-flex items-center gap-2" >
            <FolderPlus className="w-4 h-4" />
            <span>Create Your First Collection</span>
          </button>
        </SpotlightCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <div
              key={col.id}
              className="group bg-surface border border-border hover:border-primary/40 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col" >
              {/* Cover Banner */}
              <div
                className="h-44 relative bg-surface-raised overflow-hidden flex items-end p-4" style={{
                  backgroundImage: col.cover_asset_url ? `url("${col.cover_asset_url}")` : undefined,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover' }}
              >
                {!col.cover_asset_url && (
                  <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface-raised to-surface-selected" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="relative z-10 w-full flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3" />
                    <span>{col.media_count} {col.media_count === 1 ? 'Asset' : 'Assets'}</span>
                  </span>
                  <span className="text-[11px] font-medium text-white/80">
                    {new Date(col.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-text mb-1 truncate" title={col.name}>
                    {col.name}
                  </h3>
                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-4">
                    {col.description || 'No description provided.'}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-border flex items-center gap-2">
                  <button
                    onClick={() => setViewModalCollection(col)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-primary hover:bg-primary text-primary-on text-xs font-semibold shadow-xs transition-all" >
                    View ({col.media_count})
                  </button>
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate('media-library');
                      if (onSelectCollectionForLibrary) onSelectCollectionForLibrary(col.id);
                    }}
                    title="Filter Media Library with this collection" className="p-1.5 rounded-xl border border-border hover:bg-surface text-text-secondary transition-colors" >
                    <Search className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(col)}
                    className="p-1.5 rounded-xl border border-border hover:bg-surface text-text-secondary transition-colors" title="Edit Collection" >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteModalCollection(col);
                      setDeleteMediaChecked(false);
                    }}
                    className="p-1.5 rounded-xl border border-border hover:bg-rose-50 text-rose-500 transition-colors" title="Delete Collection" >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-text">Create New Collection</h3>
              </div>
              <button
                className="p-1 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg" onClick={() => setCreateModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Collection Name *
                </label>
                <input
                  id="collection-name-input" type="text" placeholder="e.g. Summer Toy Promotions, Product Demos" value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  className={`w-full px-3 py-2 rounded-xl border text-xs text-text placeholder-slate-400 focus:outline-none ${
                    nameError ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20' : 'border-border focus:ring-2 focus:ring-primary' }`}
                />
                {nameError && (
                  <p id="collection-name-error" className="text-[11px] text-rose-500 mt-1">
                    {nameError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="collection-description-input" rows={3}
                  placeholder="What media assets belong here and how will they be scheduled?" value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs text-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Cover Image (Optional)
                </label>
                <select
                  id="collection-cover-select" value={coverAssetId}
                  onChange={(e) => setCoverAssetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs text-text focus:outline-none" >
                  <option value="">Auto-assign first media asset as cover</option>
                  {availableMedia.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title || m.file_name} (#{m.id})
                    </option>
                  ))}
                </select>
                {coverAssetId && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-surface rounded-xl border border-border">
                    {(() => {
                      const sel = availableMedia.find((m) => String(m.id) === String(coverAssetId));
                      return sel ? (
                        <>
                          <img src={sel.file_url} alt="Cover preview" className="w-10 h-10 object-cover rounded-lg" />
                          <span className="text-[11px] font-medium text-text-secondary">Selected cover image</span>
                        </>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button" onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-bg" >
                  Cancel
                </button>
                <button
                  id="submit-create-collection-btn" type="submit" disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary text-primary-on shadow-md shadow-xs disabled:opacity-50" >
                  {submitting ? 'Creating...' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="text-base font-bold text-text">Edit Collection</h3>
              <button
                className="p-1 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg" onClick={() => setEditModalCollection(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Collection Name *
                </label>
                <input
                  type="text" value={editModalCollection.name}
                  onChange={(e) => {
                    setEditModalCollection({ ...editModalCollection, name: e.target.value });
                    if (editNameError) setEditNameError('');
                  }}
                  className={`w-full px-3 py-2 rounded-xl border text-xs text-text focus:outline-none ${
                    editNameError ? 'border-rose-400' : 'border-border' }`}
                />
                {editNameError && (
                  <p className="text-[11px] text-rose-500 mt-1">{editNameError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editModalCollection.description || ''}
                  onChange={(e) => setEditModalCollection({ ...editModalCollection, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs text-text focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Cover Image
                </label>
                <select
                  value={editModalCollection.cover_asset_id || ''}
                  onChange={(e) => setEditModalCollection({ ...editModalCollection, cover_asset_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs text-text focus:outline-none" >
                  <option value="">Auto-assign first media asset as cover</option>
                  {availableMedia.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title || m.file_name} (#{m.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button" onClick={() => setEditModalCollection(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-bg" >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary text-primary-on shadow-md shadow-xs disabled:opacity-50" >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ASSETS MODAL */}
      {viewModalCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-white/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div>
                <h3 className="text-base font-bold text-text">{viewModalCollection.name}</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {viewModalCollection.media_count} assets in this collection
                </p>
              </div>
              <button
                className="p-1 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg" onClick={() => setViewModalCollection(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {(!viewModalCollection.media_assets || viewModalCollection.media_assets.length === 0) ? (
                <div className="text-center py-12 text-text-muted">
                  <p className="text-xs mb-3">No media assets in this collection yet.</p>
                  <button
                    className="px-3.5 py-1.5 rounded-xl bg-bg hover:bg-slate-200 text-text-secondary text-xs font-semibold" onClick={() => {
                      setViewModalCollection(null);
                      if (onNavigate) onNavigate('media-library');
                    }}
                  >
                    Go to Media Library to add assets
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {viewModalCollection.media_assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="border border-border rounded-xl overflow-hidden bg-white shadow-sm flex flex-col" >
                      <div className="h-28 bg-surface flex items-center justify-center overflow-hidden">
                        {asset.media_type === 'video' ? (
                          <video src={asset.file_url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={asset.file_url} alt={asset.file_name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-2.5">
                        <div className="text-xs font-semibold text-text truncate mb-1">
                          {asset.title || asset.file_name}
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="uppercase text-text-muted font-bold">{asset.media_type}</span>
                          <button
                            onClick={() => handleRemoveMediaFromCollection(viewModalCollection.id, asset.id)}
                            className="text-rose-500 hover:text-rose-600 font-semibold" title="Remove from collection (keeps file in library)" >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
              <button
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-bg hover:bg-slate-200 text-text-secondary" onClick={() => {
                  const colId = viewModalCollection.id;
                  setViewModalCollection(null);
                  if (onNavigate) onNavigate('media-library');
                  if (onSelectCollectionForLibrary) onSelectCollectionForLibrary(colId);
                }}
              >
                Manage Assets in Library
              </button>
              <button
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary text-primary-on shadow-md shadow-xs" onClick={() => setViewModalCollection(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModalCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text mb-1.5">Delete Collection</h3>
            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              Are you sure you want to delete the collection <strong className="text-text">"{deleteModalCollection.name}"</strong>?
            </p>

            <div className="bg-surface border border-border rounded-xl p-3 mb-5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox" checked={deleteMediaChecked}
                  onChange={(e) => setDeleteMediaChecked(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500" />
                <div>
                  <strong className={`text-xs block ${deleteMediaChecked ? 'text-rose-600' : 'text-text'}`}>
                    Also delete all {deleteModalCollection.media_count} media files inside from storage?
                  </strong>
                  <span className="text-[11px] text-text-muted block mt-1 leading-snug">
                    {deleteMediaChecked
                      ? 'Warning: Media files will be permanently erased from Cloudinary CDN and database.' : 'ℹ️ Safe option: Collection structure is deleted, but all images and videos are preserved in your Media Library.'}
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button" onClick={() => setDeleteModalCollection(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-bg" >
                Cancel
              </button>
              <button
                type="button" onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 disabled:opacity-50" >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
