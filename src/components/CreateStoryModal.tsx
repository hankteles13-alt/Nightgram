import React, { useRef, useState } from 'react';
import { ImagePlus, X, LoaderCircle, Trash2 } from 'lucide-react';
import { optimizeImageForFirestore } from '../lib/imageOptimizer';
import { UserProfile } from '../types';

interface CreateStoryModalProps {
  currentUser?: UserProfile | null;
  onClose: () => void;
  onSubmit: (story: { mediaUrl: string; caption: string; mood: string }) => Promise<void> | void;
}

export default function CreateStoryModal({ onClose, onSubmit }: CreateStoryModalProps) {
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Choose an image file for your story.');
      return;
    }

    setUploadError(null);
    setIsOptimizing(true);
    setFileName(file.name);
    try {
      const optimized = await optimizeImageForFirestore(file, {
        maxDimension: 1080,
        quality: 0.82,
        maxSizeBytes: 380000,
      });
      if (!optimized) throw new Error('The image could not be processed. Please choose another photo.');
      setMediaUrl(optimized);
    } catch (error) {
      setMediaUrl('');
      setFileName('');
      setUploadError(error instanceof Error ? error.message : 'Could not read that photo. Please try another.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handlePublish = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isPublishing || isOptimizing) return;
    if (!mediaUrl) {
      setUploadError('Add a photo before publishing your story.');
      return;
    }

    setIsPublishing(true);
    setUploadError(null);
    try {
      await onSubmit({
        mediaUrl,
        caption: caption.trim(),
        mood: 'Urban Neon',
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Could not publish your story. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6" id="create-story-overlay">
      <form
        onSubmit={handlePublish}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0c14] text-zinc-100 shadow-2xl"
        aria-labelledby="create-story-title"
      >
        <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 id="create-story-title" className="text-lg font-bold">Create a story</h2>
            <p className="mt-1 text-xs text-zinc-400">Share a photo that stays visible for 24 hours.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close create story" className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 p-5">
          <input
            ref={fileInputRef}
            id="story-file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />

          {mediaUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-black">
              <img src={mediaUrl} alt="Story preview" className="mx-auto max-h-[52vh] w-full object-contain" />
              <button
                type="button"
                onClick={() => {
                  setMediaUrl('');
                  setFileName('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/75 px-3 py-2 text-xs font-medium text-white hover:bg-black"
              >
                <Trash2 className="h-4 w-4" /> Remove photo
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-52 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 px-5 py-8 text-center hover:border-fuchsia-400 hover:bg-zinc-900"
            >
              <span className="rounded-full bg-fuchsia-500/15 p-4 text-fuchsia-300"><ImagePlus className="h-7 w-7" /></span>
              <span className="font-semibold">Choose a photo</span>
              <span className="text-xs text-zinc-400">JPG, PNG, WEBP or another supported image</span>
            </button>
          )}

          {fileName && <p className="truncate text-xs text-zinc-400">{fileName}</p>}
          {isOptimizing && <p className="text-sm text-fuchsia-300">Preparing your photo…</p>}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="story-caption" className="text-sm font-medium">Caption <span className="font-normal text-zinc-500">(optional)</span></label>
              <span className="text-xs text-zinc-500">{caption.length}/500</span>
            </div>
            <textarea
              id="story-caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value.slice(0, 500))}
              placeholder="Add a thought to your story…"
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-fuchsia-400"
            />
          </div>

          {uploadError && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{uploadError}</p>}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800">Cancel</button>
          <button
            type="submit"
            disabled={!mediaUrl || isOptimizing || isPublishing}
            className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {(isOptimizing || isPublishing) && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {isPublishing ? 'Publishing…' : isOptimizing ? 'Preparing…' : 'Publish story'}
          </button>
        </footer>
      </form>
    </div>
  );
}
