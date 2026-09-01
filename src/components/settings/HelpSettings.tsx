import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Send, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { playSoundEffect } from '../../lib/settingsManager';

export default function HelpSettings() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [reportText, setReportText] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [showLegalDoc, setShowLegalDoc] = useState<'privacy' | 'terms' | null>(null);

  const faqs = [
    {
      q: 'How does End-to-End Encryption work on Nightgram?',
      a: 'All 1-on-1 and group chat messages are encrypted with AES-GCM cryptography keys generated on your device. Only you and your chat partner hold the decryption keys.',
    },
    {
      q: 'How do I start a video or audio call?',
      a: 'Open any chat conversation and tap the Phone or Video icon in the top header. You can also generate an encrypted Call Invite Link to share with friends.',
    },
    {
      q: 'Can I change my Nightgram @username?',
      a: 'Yes! Go to Settings > Profile, type your new reserved username, and tap Save Changes. Your unique username updates instantly across the global network.',
    },
    {
      q: 'How do custom Chat Filters / Lists work?',
      a: 'Under Settings > Lists, you can create custom circles like "Close Friends" or "Work". These appear as filter pills at the top of your Chats screen.',
    },
  ];

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    setReportSubmitted(true);
    playSoundEffect('sent');
    setTimeout(() => {
      setReportText('');
      setReportSubmitted(false);
    }, 3000);
  };

  return (
    <div className="p-4 space-y-4 text-zinc-200" id="settings-help-page">
      {/* Help Overview Banner */}
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl p-4 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white">Nightgram Help & Support Center</h4>
          <p className="text-[11px] text-zinc-400">Version 2.4.0 • E2EE Build</p>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
        <div className="p-3 bg-[#161626]">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Frequently Asked Questions</span>
        </div>

        {faqs.map((faq, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div key={idx} className="p-3.5">
              <button
                type="button"
                onClick={() => {
                  setOpenFaq(isOpen ? null : idx);
                  playSoundEffect('pop');
                }}
                className="w-full flex items-center justify-between text-left text-xs font-semibold text-zinc-200 hover:text-cyan-300 transition"
              >
                <span>{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-cyan-400 flex-shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0 ml-2" />
                )}
              </button>
              {isOpen && (
                <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed pl-1 border-l-2 border-cyan-500/50">
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Support / Report Bug Form */}
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Report a Bug or Feedback</h4>
        {reportSubmitted ? (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Thank you! Your feedback has been sent directly to the Nightgram engineering team.</span>
          </div>
        ) : (
          <form onSubmit={handleSendReport} className="space-y-2.5">
            <textarea
              rows={3}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Describe what happened or request a feature..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Report</span>
            </button>
          </form>
        )}
      </div>

      {/* Legal Links */}
      <div className="flex items-center justify-center space-x-4 text-xs text-zinc-500 pt-1">
        <button
          type="button"
          onClick={() => setShowLegalDoc('privacy')}
          className="hover:text-cyan-400 transition cursor-pointer flex items-center space-x-1"
        >
          <FileText className="w-3 h-3" />
          <span>Privacy Policy</span>
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={() => setShowLegalDoc('terms')}
          className="hover:text-cyan-400 transition cursor-pointer flex items-center space-x-1"
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Terms of Service</span>
        </button>
      </div>

      {/* Legal Doc Modal */}
      {showLegalDoc && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#12121e] border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-2xl">
            <h4 className="text-sm font-bold text-white capitalize">
              {showLegalDoc === 'privacy' ? 'Nightgram Privacy Policy' : 'Terms of Service'}
            </h4>
            <div className="text-xs text-zinc-400 space-y-2 max-h-60 overflow-y-auto leading-relaxed pr-1">
              <p>
                Nightgram is built on the principle of private, atmospheric communication. We do not sell your personal data or read your encrypted messages.
              </p>
              <p>
                All biometric passkeys, PIN codes, and session keys are secured using standard client-side hardware security frameworks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowLegalDoc(null)}
              className="w-full py-2 rounded-xl bg-cyan-500 text-zinc-950 font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
