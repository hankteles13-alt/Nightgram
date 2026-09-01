import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Send, Equal, Plus, X } from 'lucide-react';
import { PollData } from './WhatsAppPollMessage';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (poll: PollData) => void;
}

export default function CreatePollModal({
  isOpen,
  onClose,
  onSubmit,
}: CreatePollModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;

    // If typing in the last option, automatically append an empty one up to 12 options
    if (index === options.length - 1 && value.trim() && options.length < 12) {
      newOptions.push('');
    }

    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleSendPoll = () => {
    if (!question.trim()) {
      showToast('Please enter a question for the poll.');
      return;
    }

    const filledOptions = options.filter((opt) => opt.trim().length > 0);
    if (filledOptions.length < 2) {
      showToast('Add at least two options.');
      return;
    }

    const newPoll: PollData = {
      id: `poll-${Date.now()}`,
      question: question.trim(),
      options: filledOptions.map((text, idx) => ({
        id: `opt-${idx + 1}-${Date.now()}`,
        text: text.trim(),
        votes: [],
      })),
      allowMultiple,
      createdBy: 'me',
      createdAt: new Date().toISOString(),
    };

    onSubmit(newPoll);
    // Reset form
    setQuestion('');
    setOptions(['', '']);
    onClose();
  };

  const showToast = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => {
      setErrorToast(null);
    }, 2800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="absolute inset-0 z-50 bg-[#090d16] text-zinc-100 flex flex-col"
      id="create-poll-screen"
    >
      {/* Top Navigation Bar matching Nightgram theme */}
      <div className="flex items-center space-x-3.5 px-4 py-3 bg-[#0e1422] border-b border-zinc-800/90 shadow-md">
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-zinc-300 hover:text-cyan-300 hover:bg-zinc-800/80 transition cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold text-zinc-100 tracking-wide">Create poll</h2>
      </div>

      {/* Main Form Body */}
      <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full space-y-6 scrollbar-thin">
        {/* 1. Question Section */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-cyan-400">Question</label>
          <div className="relative">
            <input
              type="text"
              id="poll-question-input"
              value={question}
              maxLength={255}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask question"
              autoFocus
              className="w-full bg-[#121827] border border-zinc-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition shadow-inner"
            />
            <div className="text-right text-[11px] font-mono text-zinc-500 mt-1">
              {question.length}/255
            </div>
          </div>
        </div>

        {/* 2. Options Section */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-cyan-400">Options</label>
          <div className="space-y-2.5">
            {options.map((opt, index) => (
              <div key={`poll-option-row-${index}`} className="space-y-1">
                <div className="relative flex items-center bg-[#121827] border border-zinc-700/80 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 rounded-xl px-3.5 py-2.5 transition shadow-inner">
                  <input
                    type="text"
                    id={`poll-option-input-${index}`}
                    value={opt}
                    maxLength={100}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder="+ Add"
                    className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none pr-3"
                  />
                  <div className="flex items-center space-x-2 text-zinc-500 flex-shrink-0">
                    {opt.trim() && options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="p-1 hover:text-red-400 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <Equal className="w-4 h-4 text-zinc-500 cursor-grab" />
                  </div>
                </div>
                {opt.length > 0 && (
                  <div className="text-right text-[10px] font-mono text-zinc-500 pr-1">
                    {opt.length}/100
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Allow multiple answers switch */}
        <div className="flex items-center justify-between p-3.5 bg-[#121827] border border-zinc-800/80 rounded-xl">
          <div>
            <h4 className="text-xs font-semibold text-zinc-200">Allow multiple answers</h4>
            <p className="text-[11px] text-zinc-400">Respondents can choose more than one option</p>
          </div>
          <button
            type="button"
            onClick={() => setAllowMultiple(!allowMultiple)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
              allowMultiple ? 'bg-cyan-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                allowMultiple ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Floating Action Send Button */}
      <div className="p-3.5 bg-[#0e1422] border-t border-zinc-800/90 flex justify-end">
        <button
          type="button"
          id="submit-poll-btn"
          onClick={handleSendPoll}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer active:scale-95"
          title="Send Poll"
        >
          <Send className="w-5 h-5 translate-x-0.5" />
        </button>
      </div>

      {/* Error Toast Banner */}
      {errorToast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#161f2e] border border-rose-500/60 text-rose-200 text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center space-x-2"
        >
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span>{errorToast}</span>
        </motion.div>
      )}
    </motion.div>
  );
}
