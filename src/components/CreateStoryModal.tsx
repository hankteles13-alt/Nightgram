import React, { useRef, useState } from 'react';
import { ImagePlus, X, LoaderCircle, Trash2, Type } from 'lucide-react';
import { optimizeImageForFirestore } from '../lib/imageOptimizer';
import { UserProfile } from '../types';

interface CreateStoryModalProps {
  currentUser?: UserProfile | null;
  onClose: () => void;
  onSubmit: (story: { mediaUrl: string; caption: string; mood: string }) => Promise<void> | void;
}

const backgrounds = [
  { name: 'Violet', value: '#6d28d9' },
  { name: 'Rose', value: '#be123c' },
  { name: 'Ocean', value: '#0369a1' },
  { name: 'Forest', value: '#166534' },
  { name: 'Sunset', value: '#c2410c' },
  { name: 'Night', value: '#18181b' },
];

export default function CreateStoryModal({ onClose, onSubmit }: CreateStoryModalProps) {
  const [mode, setMode] = useState<'text' | 'photo'>('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [background, setBackground] = useState(backgrounds[0].value);
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
    if (!caption.trim()) {
      setUploadError(mode === 'text' ? 'Type something to share as your status.' : 'Add a caption or choose a photo.');
      return;
    }
    if (mode === 'photo' && !mediaUrl) {
      setUploadError('Choose a photo before publishing this story.');
      return;
    }

    setIsPublishing(true);
    setUploadError(null);
    try {
      await onSubmit({
        mediaUrl: mode === 'photo' ? mediaUrl : '',
        caption: caption.trim(),
        mood: mode === 'text' ? `text:${background}` : 'Urban Neon',
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Could not publish your story. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6" id="create-story-overlay">
      <form onSubmit={handlePublish} className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0c14] text-zinc-100 shadow-2xl" aria-labelledby="create-story-title">
        <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 id="create-story-title" className="text-lg font-bold">Create a story</h2>
            <p className="mt-1 text-xs text-zinc-400">Share a thought or a photo. Stories last 24 hours.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close create story" className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"><X className="h-5 w-5" /></button>
        </header>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-900 p-1">
            <button type="button" onClick={() => { setMode('text'); setUploadError(null); }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${mode === 'text' ? 'bg-fuchsia-600 text-white' : 'text-zinc-400 hover:text-white'}`}><Type className="h-4 w-4" /> Text status</button>
            <button type="button" onClick={() => { setMode('photo'); setUploadError(null); }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${mode === 'photo' ? 'bg-fuchsia-600 text-white' : 'text-zinc-400 hover:text-white'}`}><ImagePlus className="h-4 w-4" /> Photo story</button>
          </div>

          <input ref={fileInputRef} id="story-file-input" type="file" accept="image/*" className="hidden" onChange={(event) => void handleFile(event.target.files?.[0])} />

          {mode === 'text' ? (
            <div className="space-y-3">
              <div className="relative flex min-h-[270px] items-center justify-center overflow-hidden rounded-xl p-6 text-center" style={{ backgroundColor: background }}>
                <textarea value={caption} onChange={(event) => setCaption(event.target.value.slice(0, 500))} placeholder="Type a status..." rows={5} maxLength={500} aria-label="Status text" className="w-full resize-none bg-transparent text-center text-2xl font-bold leading-relaxed text-white outline-none placeholder:text-white/60" />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-zinc-400">Choose a background</p>
                <div className="flex flex-wrap gap-3">
                  {backgrounds.map((item) => <button key={item.value} type="button" title={item.name} aria-label={`${item.name} background`} onClick={() => setBackground(item.value)} className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${background === item.value ? 'border-white ring-2 ring-white/30' : 'border-white/20'}`} style={{ backgroundColor: item.value }} />)}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {mediaUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-black">
                  <img src={mediaUrl} alt="Story preview" className="mx-auto max-h-[42vh] w-full object-contain" />
                  <button type="button" onClick={() => { setMediaUrl(''); setFileName(''); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/75 px-3 py-2 text-xs font-medium text-white hover:bg-black"><Trash2 className="h-4 w-4" /> Remove photo</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 px-5 py-8 text-center hover:border-fuchsia-400 hover:bg-zinc-900">
                  <span className="rounded-full bg-fuchsia-500/15 p-4 text-fuchsia-300"><ImagePlus className="h-7 w-7" /></span>
                  <span className="font-semibold">Choose a photo</span><span className="text-xs text-zinc-400">Select an image from your device</span>
                </button>
              )}
              {fileName && <p className="truncate text-xs text-zinc-400">{fileName}</p>}
              {isOptimizing && <p className="text-sm text-fuchsia-300">Preparing your photo…</p>}
              <textarea value={caption} onChange={(event) => setCaption(event.target.value.slice(0, 500))} placeholder="Add a caption to your story…" rows={3} maxLength={500} className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-fuchsia-400" />
            </div>
          )}

          <div className="flex justify-end text-xs text-zinc-500">{caption.length}/500</div>
          {uploadError && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{uploadError}</p>}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800">Cancel</button>
          <button type="submit" disabled={!caption.trim() || (mode === 'photo' && !mediaUrl) || isOptimizing || isPublishing} className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {(isOptimizing || isPublishing) && <LoaderCircle className="h-4 w-4 animate-spin" />}{isPublishing ? 'Publishing…' : isOptimizing ? 'Preparing…' : 'Publish story'}
          </button>
        </footer>
      </form>
    </div>
  );
}
