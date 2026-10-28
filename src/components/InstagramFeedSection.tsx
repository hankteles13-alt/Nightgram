import React, { useMemo, useState } from 'react';
import { Bookmark, ChevronLeft, ChevronRight, Heart, MapPin, MessageCircle, MoreHorizontal, Send, Share2 } from 'lucide-react';
import { Post, UserProfile } from '../types';

interface InstagramFeedSectionProps {
  posts: Post[];
  currentUser?: UserProfile | null;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onDeletePost?: (postId: string) => void;
  onOpenChatWithUser?: (user: { uid?: string; username: string; displayName?: string; avatar?: string }) => void;
  onOpenUserProfile?: (user: { uid?: string; username: string; displayName?: string; avatar?: string }) => void;
}

export default function InstagramFeedSection({
  posts,
  currentUser,
  onLike,
  onSave,
  onAddComment,
  onDeletePost,
  onOpenUserProfile,
}: InstagramFeedSectionProps) {
  const [slides, setSlides] = useState<Record<string, number>>({});
  const [openPostMenu, setOpenPostMenu] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState('');

  const photoPosts = useMemo(
    () => posts.filter((post) => post.mediaType !== 'video' && !post.videoUrl).filter((post) => {
      const images = post.images?.filter(Boolean) ?? [];
      return Boolean(post.image?.trim() || images.length);
    }),
    [posts],
  );

  const postLink = (post: Post) => {
    const url = new URL(window.location.href);
    url.hash = `post-${post.id}`;
    return url.toString();
  };

  const copyPostLink = async (post: Post) => {
    try {
      await navigator.clipboard.writeText(postLink(post));
      setNotice('Post link copied.');
    } catch {
      setNotice('Could not copy the link on this browser.');
    }
    setOpenPostMenu(null);
    window.setTimeout(() => setNotice(''), 2200);
  };

  const sharePost = async (post: Post) => {
    const url = postLink(post);
    try {
      if (navigator.share) {
        await navigator.share({ title: `Nightgram post by @${post.username}`, text: post.caption, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setNotice('Post link copied.');
        window.setTimeout(() => setNotice(''), 2200);
      } else {
        setNotice('Sharing is not available on this browser.');
        window.setTimeout(() => setNotice(''), 2200);
      }
    } catch {
      // Sharing was cancelled or is not supported; no action is needed.
    }
  };

  const handleComment = (event: React.FormEvent, post: Post) => {
    event.preventDefault();
    const text = (commentInputs[post.id] || '').trim();
    if (!text) return;
    onAddComment(post.id, text);
    setCommentInputs((previous) => ({ ...previous, [post.id]: '' }));
  };

  return (
    <section className="mx-auto w-full max-w-2xl space-y-5 pb-8" aria-label="Photo feed">
      <div className="sticky top-0 z-20 -mx-2 flex items-center justify-between border-b border-white/10 bg-[#07070d]/95 px-4 py-3 backdrop-blur-xl sm:rounded-t-2xl">
        <div>
          <p className="text-xs font-medium text-zinc-400">From your community</p>
          <h2 className="mt-0.5 text-xl font-bold tracking-tight text-white">Nightgram Feed</h2>
        </div>
        <div className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-zinc-300">
          Photos & stories
        </div>
      </div>

      {notice && <div role="status" className="mx-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">{notice}</div>}

      {photoPosts.length === 0 ? (
        <div className="mx-2 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/15 text-violet-300"><Heart className="h-6 w-6" /></div>
          <h3 className="text-lg font-bold text-white">Your feed starts here</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-400">Share a photo, a memory, or a moment from your day. Posts from the Nightgram community will appear here.</p>
        </div>
      ) : photoPosts.map((post) => {
        const availableImages = (post.images || []).filter(Boolean);
        const images = (availableImages.length ? availableImages : [post.image]).filter(Boolean);
        const slide = Math.min(slides[post.id] || 0, Math.max(0, images.length - 1));
        const liked = Boolean(post.isLiked);
        const saved = Boolean(post.isSaved);
        const username = post.username || 'nightgram_user';
        const avatar = post.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
        const commentCount = post.comments?.length || 0;

        return (
          <article id={`post-${post.id}`} key={post.id} className="overflow-hidden border-y border-white/10 bg-[#09090f] sm:rounded-2xl sm:border">
            <header className="flex items-center gap-3 px-3 py-3 sm:px-4">
              <button type="button" onClick={() => onOpenUserProfile?.({ uid: post.userId, username, displayName: username, avatar })} className="rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-pink-500 to-violet-500" aria-label={`Open @${username}'s profile`}>
                <img src={avatar} alt="" className="h-10 w-10 rounded-full border-2 border-[#09090f] object-cover" referrerPolicy="no-referrer" />
              </button>
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => onOpenUserProfile?.({ uid: post.userId, username, displayName: username, avatar })} className="block max-w-full truncate text-sm font-bold text-white hover:text-fuchsia-200">{username}</button>
                {post.location && <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-zinc-400"><MapPin className="h-3 w-3" />{post.location}</p>}
                {!post.location && <p className="mt-0.5 text-[11px] text-zinc-500">{post.time || 'Just now'}</p>}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenPostMenu((current) => current === post.id ? null : post.id)}
                  className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                  title="More options"
                  aria-label={`More options for @${username}'s post`}
                  aria-expanded={openPostMenu === post.id}
                ><MoreHorizontal className="h-5 w-5" /></button>
                {openPostMenu === post.id && (
                  <div className="absolute right-0 top-11 z-30 min-w-44 overflow-hidden rounded-xl border border-white/10 bg-[#171720] p-1 shadow-xl">
                    <button type="button" onClick={() => void copyPostLink(post)} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/10">Copy post link</button>
                    <button type="button" onClick={() => void sharePost(post)} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/10">Share post</button>
                    {currentUser?.uid && post.userId === currentUser.uid && onDeletePost && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenPostMenu(null);
                          onDeletePost(post.id);
                        }}
                        className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-rose-300 hover:bg-rose-500/10"
                      >Delete post</button>
                    )}
                  </div>
                )}
              </div>
            </header>

            <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
              <img src={images[slide]} alt={post.caption ? `Photo posted by ${username}: ${post.caption}` : `Photo posted by ${username}`} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
              {images.length > 1 && <>
                <span className="absolute right-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white">{slide + 1}/{images.length}</span>
                <button type="button" onClick={() => setSlides((prev) => ({ ...prev, [post.id]: (slide - 1 + images.length) % images.length }))} aria-label="Previous photo" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white backdrop-blur hover:bg-black/75"><ChevronLeft className="h-5 w-5" /></button>
                <button type="button" onClick={() => setSlides((prev) => ({ ...prev, [post.id]: (slide + 1) % images.length }))} aria-label="Next photo" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white backdrop-blur hover:bg-black/75"><ChevronRight className="h-5 w-5" /></button>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">{images.map((_, index) => <span key={index} className={`h-1.5 w-1.5 rounded-full ${index === slide ? 'bg-fuchsia-400' : 'bg-white/50'}`} />)}</div>
              </>}
            </div>

            <div className="px-3 pb-4 pt-3 sm:px-4">
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => onLike(post.id)} aria-label={liked ? 'Unlike post' : 'Like post'} className={`transition active:scale-90 ${liked ? 'text-rose-500' : 'text-white hover:text-rose-400'}`}><Heart className={`h-6 w-6 ${liked ? 'fill-current' : ''}`} /></button>
                <button type="button" onClick={() => document.getElementById(`comment-${post.id}`)?.focus()} aria-label="Comment on post" className="text-white transition hover:text-cyan-300"><MessageCircle className="h-6 w-6" /></button>
                <button type="button" onClick={() => void sharePost(post)} aria-label="Share post" className="text-white transition hover:text-cyan-300"><Send className="h-6 w-6" /></button>
                <span className="flex-1" />
                <button type="button" onClick={() => onSave(post.id)} aria-label={saved ? 'Unsave post' : 'Save post'} className={`transition ${saved ? 'text-fuchsia-300' : 'text-white hover:text-fuchsia-300'}`}><Bookmark className={`h-6 w-6 ${saved ? 'fill-current' : ''}`} /></button>
              </div>

              <p className="mt-3 text-sm font-bold text-white">{Number(post.likes || 0).toLocaleString()} {post.likes === 1 ? 'like' : 'likes'}</p>
              {post.caption && <p className="mt-2 text-sm leading-6 text-zinc-200"><span className="mr-2 font-bold text-white">{username}</span>{expandedCaptions[post.id] || post.caption.length <= 160 ? post.caption : `${post.caption.slice(0, 160).trimEnd()}…`}{post.caption.length > 160 && <button type="button" onClick={() => setExpandedCaptions((prev) => ({ ...prev, [post.id]: !prev[post.id] }))} className="ml-1 text-zinc-500 hover:text-zinc-300">{expandedCaptions[post.id] ? 'less' : 'more'}</button>}</p>}
              {commentCount > 0 && <p className="mt-2 text-sm text-zinc-500">View all {commentCount} {commentCount === 1 ? 'comment' : 'comments'}</p>}
              {(post.comments || []).slice(-2).map((comment, index) => <p key={comment.id || index} className="mt-1 truncate text-sm text-zinc-300"><span className="mr-2 font-semibold text-white">{comment.username}</span>{comment.text}</p>)}
              {post.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
                  {post.tags.slice(0, 8).map((tag) => (
                    <span key={tag} className="text-xs text-cyan-300/80">#{tag.replace(/^#/, '')}</span>
                  ))}
                </div>
              )}
              <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-600">{post.time || 'Just now'}</p>

              <form onSubmit={(event) => handleComment(event, post)} className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                <input id={`comment-${post.id}`} value={commentInputs[post.id] || ''} onChange={(event) => setCommentInputs((prev) => ({ ...prev, [post.id]: event.target.value }))} placeholder="Add a comment…" maxLength={500} className="min-w-0 flex-1 bg-transparent py-1 text-sm text-white outline-none placeholder:text-zinc-600" aria-label={`Comment on ${username}'s post`} />
                <button type="submit" disabled={!(commentInputs[post.id] || '').trim()} className="text-sm font-bold text-cyan-300 transition hover:text-cyan-200 disabled:opacity-30">Post</button>
              </form>
            </div>
          </article>
        );
      })}
    </section>
  );
}
