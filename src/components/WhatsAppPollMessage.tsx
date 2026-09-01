import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, CheckCircle2, Circle, Users, BarChart2 } from 'lucide-react';

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // user IDs or usernames who voted
}

export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  allowMultiple?: boolean;
  createdBy: string;
  createdAt: string;
}

interface WhatsAppPollMessageProps {
  poll: PollData;
  currentUserId?: string;
  isMe?: boolean;
  onVote: (pollId: string, optionId: string) => void;
  onViewVotes?: (poll: PollData) => void;
}

export default function WhatsAppPollMessage({
  poll,
  currentUserId = 'me',
  isMe = false,
  onVote,
  onViewVotes,
}: WhatsAppPollMessageProps) {
  const [showVotesModal, setShowVotesModal] = useState(false);

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);

  return (
    <div className="w-full min-w-[240px] max-w-[320px] sm:max-w-[360px] text-zinc-100 select-none" id={`poll-msg-${poll.id}`}>
      {/* Poll Question Header */}
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-zinc-100 tracking-tight leading-snug">
          {poll.question}
        </h4>
        <div className="flex items-center space-x-1 text-[10px] text-zinc-400 mt-0.5 font-sans">
          <Circle className="w-3 h-3 text-zinc-400" />
          <span>{poll.allowMultiple ? 'Select one or more' : 'Select one'}</span>
        </div>
      </div>

      {/* Poll Options List */}
      <div className="space-y-2 my-2.5">
        {poll.options.map((option, optIdx) => {
          const hasVoted = option.votes.includes(currentUserId);
          const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;

          return (
            <div
              key={`poll-opt-${poll.id}-${option.id || optIdx}-${optIdx}`}
              onClick={() => onVote(poll.id, option.id)}
              className={`relative overflow-hidden rounded-xl border p-2.5 transition-all cursor-pointer ${
                hasVoted
                  ? 'bg-cyan-950/60 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-zinc-900/70 border-zinc-800 hover:bg-zinc-800/80 hover:border-cyan-500/40'
              }`}
            >
              {/* Progress bar fill for votes */}
              {totalVotes > 0 && (
                <div
                  className={`absolute top-0 bottom-0 left-0 transition-all duration-300 opacity-30 ${
                    hasVoted ? 'bg-gradient-to-r from-cyan-400 to-purple-400' : 'bg-zinc-600'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <div className="flex-shrink-0">
                    {hasVoted ? (
                      <div className="w-4 h-4 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.9)]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-zinc-500 hover:border-cyan-400 transition" />
                    )}
                  </div>
                  <span className={`text-xs font-medium truncate ${hasVoted ? 'text-cyan-200 font-semibold' : 'text-zinc-200'}`}>
                    {option.text}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 flex-shrink-0 text-[11px] font-mono text-cyan-300/80">
                  <span>{option.votes.length}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Votes Action link */}
      <div className="pt-1.5 border-t border-white/10 flex items-center justify-center">
        <button
          type="button"
          onClick={() => {
            if (onViewVotes) {
              onViewVotes(poll);
            } else {
              setShowVotesModal(true);
            }
          }}
          className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition py-0.5 px-2 rounded-lg hover:bg-cyan-950/40 cursor-pointer flex items-center space-x-1"
        >
          <BarChart2 className="w-3 h-3" />
          <span>View votes</span>
        </button>
      </div>

      {/* Inline View Votes Modal if standalone */}
      {showVotesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowVotesModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#111b21] border border-zinc-700/80 rounded-2xl p-4 shadow-2xl space-y-3 text-zinc-100"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-zinc-100 truncate">{poll.question}</h3>
              <span className="text-xs text-emerald-400 font-mono font-semibold">{totalVotes} votes</span>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
              {poll.options.map((opt, optIdx) => (
                <div key={`modal-poll-opt-${poll.id}-${opt.id || optIdx}-${optIdx}`} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-zinc-200">
                    <span>{opt.text}</span>
                    <span className="text-emerald-400 font-mono">{opt.votes.length}</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all"
                      style={{ width: `${totalVotes > 0 ? (opt.votes.length / totalVotes) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-400 pl-1">
                    {opt.votes.length > 0
                      ? `Voted: ${opt.votes.join(', ')}`
                      : 'No votes yet'}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowVotesModal(false)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
