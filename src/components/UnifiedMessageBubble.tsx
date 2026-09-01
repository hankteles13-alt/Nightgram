import React from 'react';
import { motion } from 'motion/react';
import {
  CheckCheck,
  CornerUpLeft,
  Image as ImageIcon,
  Mic,
  Smile,
  Lock,
} from 'lucide-react';
import { ChatMessage, Message } from '../types';
import WhatsAppPollMessage, { PollData } from './WhatsAppPollMessage';

export interface UnifiedMessageBubbleProps {
  message: ChatMessage | Message | any;
  isMe: boolean;
  onReply?: (message: any) => void;
  onVotePoll?: (pollId: string, optionId: string) => void;
  onViewImage?: (imageUrl: string) => void;
  VoiceNotePlayerComponent: React.ComponentType<{ audioUrl?: string; duration?: string; isMe?: boolean }>;
  isHighlighted?: boolean;
}

export const UnifiedMessageBubble: React.FC<UnifiedMessageBubbleProps> = ({
  message,
  isMe,
  onReply,
  onVotePoll,
  onViewImage,
  VoiceNotePlayerComponent,
  isHighlighted = false,
}) => {
  const isSticker = message.isSticker || !!message.stickerUrl;
  const hasPoll = !!message.pollData;
  const isVoiceNote =
    !!message.audioUrl ||
    (message.text && (message.text.includes('🎤 Voice Note') || message.text.includes('[AUDIO:')));

  const timeDisplay = message.timestampFormatted || message.timestamp || '12:00';
  const textContent = message.text || '';

  // Render Sticker
  if (isSticker) {
    return (
      <div
        id={`msg-sticker-${message.id}`}
        className={`group relative flex ${isMe ? 'justify-end' : 'justify-start'} my-2`}
      >
        <div className="relative max-w-[200px] sm:max-w-[240px]">
          {/* Sticker Image */}
          <div className="relative rounded-2xl overflow-hidden p-1 bg-transparent transform transition duration-150 hover:scale-105">
            <img
              src={message.stickerUrl || message.imageUrl}
              alt="Sticker"
              className="w-40 h-40 object-contain drop-shadow-xl cursor-pointer"
              onClick={() => onViewImage && onViewImage(message.stickerUrl || message.imageUrl)}
            />
            <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-zinc-400 font-mono bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full w-max ml-auto">
              <span>{timeDisplay}</span>
              {isMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-400 inline ml-0.5" />}
            </div>
          </div>

          {/* Quick Reply Button on Sticker */}
          {onReply && (
            <button
              type="button"
              onClick={() => onReply(message)}
              className="absolute top-2 -left-8 opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-zinc-700 transition cursor-pointer shadow-md"
              title="Reply to sticker"
            >
              <CornerUpLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      id={`msg-bubble-${message.id}`}
      className={`group relative flex ${isMe ? 'justify-end' : 'justify-start'} my-1`}
    >
      {/* Quick Reply Trigger on hover (left for outgoing, right for incoming) */}
      {onReply && !isMe && (
        <button
          type="button"
          onClick={() => onReply(message)}
          className="self-center mr-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-emerald-300 hover:bg-zinc-700 transition cursor-pointer shadow-sm"
          title="Reply"
        >
          <CornerUpLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Main Bubble Container */}
      <div
        className={`max-w-[85%] sm:max-w-[72%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed relative select-text transition-all ${
          isMe
            ? 'bg-gradient-to-br from-[#0c2a38] to-[#0a1f2e] border border-cyan-500/35 rounded-tr-none text-cyan-50 shadow-[0_2px_12px_rgba(6,182,212,0.18)]'
            : 'bg-[#111827]/95 border border-zinc-800/90 rounded-tl-none text-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.4)]'
        } ${isHighlighted ? 'ring-2 ring-cyan-400 scale-[1.02]' : ''}`}
      >
        {/* Quoted Message (Reply Preview Header) */}
        {message.replyTo && (
          <div
            className={`mb-2 p-2 rounded-lg text-left cursor-pointer transition ${
              isMe
                ? 'bg-black/30 border-l-4 border-cyan-400 text-cyan-100 hover:bg-black/40'
                : 'bg-black/40 border-l-4 border-purple-400 text-purple-100 hover:bg-black/50'
            }`}
            onClick={() => {
              const targetEl = document.getElementById(`msg-bubble-${message.replyTo.id}`) || document.getElementById(`demo-msg-${message.replyTo.id}`);
              if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetEl.classList.add('ring-2', 'ring-cyan-400');
                setTimeout(() => targetEl.classList.remove('ring-2', 'ring-cyan-400'), 1500);
              }
            }}
          >
            <span
              className={`text-[11px] font-bold block truncate ${
                isMe ? 'text-cyan-300' : 'text-purple-300'
              }`}
            >
              {message.replyTo.senderName || 'Contact'}
            </span>
            <p className="text-[11px] text-zinc-300 line-clamp-1 mt-0.5">
              {message.replyTo.text || (message.replyTo.imageUrl ? '📷 Photo' : 'Message')}
            </p>
          </div>
        )}

        {/* Attached Photo / Image */}
        {message.imageUrl && (
          <div className="mb-2 rounded-xl overflow-hidden border border-cyan-500/20 group relative bg-black/40">
            <img
              src={message.imageUrl}
              alt="Attachment"
              className="w-full max-h-72 object-cover cursor-pointer hover:scale-[1.01] transition duration-200"
              onClick={() => onViewImage && onViewImage(message.imageUrl)}
            />
            <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] text-cyan-300 font-mono flex items-center space-x-1 border border-cyan-500/30 shadow-md">
              <ImageIcon className="w-3 h-3 text-cyan-400" />
              <span>Media</span>
            </div>
          </div>
        )}

        {/* Interactive Poll */}
        {hasPoll ? (
          <WhatsAppPollMessage
            poll={message.pollData}
            currentUserId={isMe ? 'me' : 'other'}
            isMe={isMe}
            onVote={(pId, optId) => onVotePoll && onVotePoll(pId, optId)}
          />
        ) : isVoiceNote ? (
          /* Voice Note Player */
          <VoiceNotePlayerComponent
            audioUrl={message.audioUrl}
            duration={
              message.audioDuration ||
              textContent.match(/\(([^)]+)\)/)?.[1] ||
              '0:07'
            }
            isMe={isMe}
          />
        ) : (
          /* Plain Text Message */
          textContent && (
            <p className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed break-words">
              {textContent}
            </p>
          )
        )}

        {/* Timestamp and Double Check Status */}
        <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-zinc-300/80 float-right ml-3 font-mono">
          <span>{timeDisplay}</span>
          {isMe && (
            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] inline ml-0.5 stroke-[2.2]" />
          )}
        </div>
      </div>

      {/* Quick Reply Trigger on hover (for outgoing message) */}
      {onReply && isMe && (
        <button
          type="button"
          onClick={() => onReply(message)}
          className="self-center ml-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-emerald-300 hover:bg-zinc-700 transition cursor-pointer shadow-sm"
          title="Reply"
        >
          <CornerUpLeft className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default UnifiedMessageBubble;
