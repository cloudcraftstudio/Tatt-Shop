import React, { useState, useRef } from 'react';
import {
  Upload,
  Layers,
  X,
  CheckCircle2,
  Sparkles,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { storageService } from '../services/storage';
import { ArtCategoryKey, GalleryItem } from '../types';

interface BulkGalleryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGalleryUpdated: () => void;
}

interface StagedImage {
  id: string;
  dataUrl: string;
  title: string;
  category: ArtCategoryKey;
  isCoverUp: boolean;
}

export const BulkGalleryUploadModal: React.FC<BulkGalleryUploadModalProps> = ({
  isOpen,
  onClose,
  onGalleryUpdated
}) => {
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [defaultCategory, setDefaultCategory] = useState<ArtCategoryKey>('realism');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newStaged: StagedImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await storageService.fileToBase64(file);
        // Clean name from file name (e.g. "raven-tattoo.jpg" -> "Raven Tattoo")
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());

        newStaged.push({
          id: `stage-${Date.now()}-${i}`,
          dataUrl: base64,
          title: cleanName || `Tattoo Piece #${i + 1}`,
          category: defaultCategory,
          isCoverUp: defaultCategory === 'coverups' || cleanName.toLowerCase().includes('cover')
        });
      } catch (err) {
        console.warn('Failed to process file', file.name, err);
      }
    }

    setStagedImages(prev => [...prev, ...newStaged]);
    setIsProcessing(false);
  };

  const handleRemoveStaged = (id: string) => {
    setStagedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSaveAllToGallery = () => {
    if (stagedImages.length === 0) return;

    const categoryLabels: Record<ArtCategoryKey, string> = {
      all: 'All Masterpieces',
      realism: 'Black & Grey Realism',
      coverups: 'Cover-Up Transformation',
      portraits: 'Portraits & Figures',
      dark_neo: 'Dark Neo & Skulls',
      machines: 'Old Skool & Machines',
      biomech: 'Biomechanical & Voltage'
    };

    stagedImages.forEach(img => {
      storageService.createGalleryItem({
        title: img.title,
        category: img.category,
        categoryLabel: categoryLabels[img.category] || 'Black & Grey Realism',
        imageUrl: img.dataUrl,
        description: `Custom artwork crafted by Tex at Lights Out Tattoo in Winchester, VA.`,
        sessionHours: 4,
        placement: 'Custom',
        isCoverUp: img.isCoverUp,
        tags: [img.category, 'Tex', 'WinchesterVA', 'CustomInk']
      });
    });

    setSuccessCount(stagedImages.length);
    onGalleryUpdated();
    setTimeout(() => {
      setStagedImages([]);
      setSuccessCount(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#080d1a] border-2 border-cyan-400/60 shadow-[0_0_35px_rgba(0,240,255,0.3)] p-5 sm:p-7 my-6 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-cyan-400 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_#00f0ff]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg sm:text-xl text-white">
              BULK STUDIO GALLERY IMPORT
            </h3>
            <p className="text-xs text-cyan-300 font-mono">
              Upload multiple tattoo photos at once into your portfolio
            </p>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-xs text-gray-300 leading-relaxed mb-4">
          Select several images from your Chromebook or phone files. The app will ingest them immediately and publish them to your Lights Out Tattoo portfolio gallery.
        </p>

        {/* File Drop / Select Area */}
        <div className="mb-4">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*"
            onChange={handleFilesSelected}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-6 px-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-blue-950/40 hover:from-cyan-950/60 hover:to-blue-950/60 border-2 border-dashed border-cyan-400 text-cyan-300 font-heading font-bold text-xs uppercase tracking-wider transition flex flex-col items-center justify-center gap-2"
          >
            <Upload className="w-8 h-8 text-cyan-400 animate-bounce" />
            <span className="text-sm">Click to Select Multiple Tattoo Images</span>
            <span className="text-[11px] font-mono text-gray-400 font-normal">
              Supports JPG, PNG, WEBP • Select as many as you have
            </span>
          </button>
        </div>

        {/* Default Category selector */}
        <div className="flex flex-wrap items-center gap-2 mb-4 p-2.5 rounded-xl bg-black/50 border border-gray-800">
          <span className="text-xs font-mono text-gray-400">Default Category:</span>
          <select
            value={defaultCategory}
            onChange={e => setDefaultCategory(e.target.value as any)}
            className="px-2.5 py-1 rounded bg-black border border-cyan-500/40 text-xs font-mono text-cyan-300 outline-none"
          >
            <option value="realism">Black & Grey Realism</option>
            <option value="coverups">Cover-Up Transformations</option>
            <option value="portraits">Portraits & Figures</option>
            <option value="dark_neo">Dark Neo & Skulls</option>
            <option value="biomech">Biomechanical & Voltage</option>
          </select>
        </div>

        {/* Staged Images List */}
        {stagedImages.length > 0 && (
          <div className="space-y-2 mb-5">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
              <span>{stagedImages.length} Images Ready to Import</span>
              <button
                onClick={() => setStagedImages([])}
                className="text-red-400 hover:underline text-[11px]"
              >
                Clear All
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {stagedImages.map(img => (
                <div
                  key={img.id}
                  className="p-2 rounded-xl bg-black/60 border border-cyan-500/30 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={img.dataUrl}
                      alt={img.title}
                      className="w-12 h-12 rounded-lg object-cover border border-cyan-400 shrink-0"
                    />
                    <div>
                      <input
                        type="text"
                        value={img.title}
                        onChange={e => {
                          const val = e.target.value;
                          setStagedImages(prev =>
                            prev.map(item =>
                              item.id === img.id ? { ...item, title: val } : item
                            )
                          );
                        }}
                        className="px-2 py-1 rounded bg-black/80 border border-gray-700 text-white text-xs font-mono w-44 sm:w-64"
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-cyan-400">
                          {img.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveStaged(img.id)}
                    className="p-1.5 rounded bg-red-950/60 border border-red-500/30 text-red-400 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Confirmation Banner */}
        {successCount !== null && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-xs font-mono flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Successfully imported {successCount} images to your studio portfolio!</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-900 text-gray-400 text-xs font-mono hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={stagedImages.length === 0 || isProcessing}
            onClick={handleSaveAllToGallery}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-40 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Publish {stagedImages.length} Images to Gallery</span>
          </button>
        </div>
      </div>
    </div>
  );
};
