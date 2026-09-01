import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, ChevronDown, Check, X, ShieldCheck, FileText, Sparkles, Moon } from 'lucide-react';

interface WelcomeCoverScreenProps {
  onAgree: () => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', welcome: 'Welcome to Nightgram', agree: 'Agree and continue', read: 'Read our', privacy: 'Privacy Policy', tap: '. Tap "Agree and continue" to accept the', terms: 'Terms of Service.' },
  { code: 'es', name: 'Español', native: 'Español', welcome: 'Te damos la bienvenida a Nightgram', agree: 'Aceptar y continuar', read: 'Lee nuestra', privacy: 'Política de privacidad', tap: '. Toca "Aceptar y continuar" para aceptar las', terms: 'Condiciones del servicio.' },
  { code: 'pt', name: 'Português', native: 'Português (Brasil)', welcome: 'Bem-vindo ao Nightgram', agree: 'Concordar e continuar', read: 'Leia nossa', privacy: 'Política de Privacidade', tap: '. Toque em "Concordar e continuar" para aceitar os', terms: 'Termos de Serviço.' },
  { code: 'fr', name: 'Français', native: 'Français', welcome: 'Bienvenue sur Nightgram', agree: 'Accepter et continuer', read: 'Consultez notre', privacy: 'Politique de confidentialité', tap: '. Appuyez sur « Accepter et continuer » pour accepter les', terms: "Conditions d'utilisation." },
  { code: 'de', name: 'Deutsch', native: 'Deutsch', welcome: 'Willkommen bei Nightgram', agree: 'Zustimmen und fortfahren', read: 'Lies unsere', privacy: 'Datenschutzrichtlinie', tap: '. Tippe auf „Zustimmen und fortfahren“, um den', terms: 'Nutzungsbedingungen zuzustimmen.' },
  { code: 'ja', name: '日本語', native: '日本語', welcome: 'Nightgram へようこそ', agree: '同意して続ける', read: '当社の', privacy: 'プライバシーポリシー', tap: 'をご確認ください。「同意して続ける」をタップすると、', terms: '利用規約に同意したことになります。' },
];

export default function WelcomeCoverScreen({ onAgree }: WelcomeCoverScreenProps) {
  const [selectedLang, setSelectedLang] = useState(SUPPORTED_LANGUAGES[0]);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAccessibilityModal, setShowAccessibilityModal] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  return (
    <div
      className={`fixed inset-0 z-50 w-full h-full ${
        highContrast ? 'bg-black' : 'bg-[#030305]'
      } text-white flex flex-col justify-between items-center px-6 py-8 select-none overflow-hidden transition-colors duration-300`}
      id="welcome-cover-screen"
    >
      {/* Top Bar with Accessibility Icon */}
      <div className="w-full max-w-sm flex items-center justify-end pt-2">
        <button
          onClick={() => setShowAccessibilityModal(true)}
          className="w-10 h-10 rounded-full border border-cyan-500/30 bg-cyan-950/20 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.15)]"
          title="Accessibility options"
          aria-label="Accessibility options"
        >
          {/* Universal Accessibility Glyph (Person icon) */}
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <circle cx="12" cy="4" r="2" />
            <path d="M19 13v-2c-1.54.02-3.09-.75-4.07-1.83l-1.29-1.43c-.4-.44-1.04-.69-1.64-.69-.6 0-1.24.25-1.64.69l-1.29 1.43C7.09 10.25 5.54 11.02 4 11v2c1.78-.02 3.48-.91 4.67-2.19L10 9.25V21h4V9.25l1.33 1.56C16.52 12.09 18.22 12.98 19 13z" />
          </svg>
        </button>
      </div>

      {/* Center Hero Area */}
      <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto py-6 text-center">
        {/* Glowing Circular App Emblem */}
        <div className="relative mb-10 flex items-center justify-center">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute w-52 h-52 rounded-full bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-3xl pointer-events-none animate-pulse"></div>

          {/* Center Glow Ring */}
          <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-[#0a0a14] border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.25)] flex items-center justify-center p-3 relative">
            {/* Inner Ring Glow */}
            <div className="w-full h-full rounded-full bg-[#05050a] border border-cyan-400/40 flex items-center justify-center relative overflow-hidden shadow-inner">
              {/* Distinctive Nightgram neon emblem */}
              <div className="relative">
                <Moon className="w-16 h-16 sm:w-18 sm:h-18 text-cyan-400 fill-cyan-400/90 drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]" />
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-pink-500 shadow-[0_0_12px_#ec4899] animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-pink-500 shadow-[0_0_10px_#ec4899]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Large Welcome Heading */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-4 font-sans drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          {selectedLang.welcome}
        </h1>

        {/* Terms & Privacy Description */}
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xs font-normal">
          <span>{selectedLang.read} </span>
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline inline transition cursor-pointer"
          >
            {selectedLang.privacy}
          </button>
          <span>{selectedLang.tap} </span>
          <button
            onClick={() => setShowTermsModal(true)}
            className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline inline transition cursor-pointer"
          >
            {selectedLang.terms}
          </button>
        </p>

        {/* Language Selector Dropdown Button */}
        <div className="mt-7">
          <button
            onClick={() => setShowLangModal(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-[#0a0a14] hover:bg-[#121222] border border-cyan-900/50 text-cyan-300 hover:text-cyan-200 transition text-xs font-medium cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.1)]"
          >
            <Globe className="w-4 h-4 stroke-[2] text-cyan-400" />
            <span className="font-semibold">{selectedLang.name}</span>
            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Bottom Full-Width "Agree and continue" CTA Button */}
      <div className="w-full max-w-sm pb-4">
        <button
          onClick={onAgree}
          className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-purple-600 hover:from-cyan-300 hover:to-purple-500 active:scale-[0.98] text-white font-bold text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] cursor-pointer flex items-center justify-center space-x-2 font-sans"
        >
          <span>{selectedLang.agree}</span>
        </button>
      </div>

      {/* Language Selection Modal Drawer */}
      <AnimatePresence>
        {showLangModal && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setShowLangModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-sm bg-[#0a0a14] border border-cyan-900/50 rounded-t-3xl sm:rounded-3xl p-5 flex flex-col max-h-[70vh] shadow-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>Choose your language</span>
                </h3>
                <button
                  onClick={() => setShowLangModal(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="divide-y divide-zinc-800/50 overflow-y-auto py-2">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLang(lang);
                      setShowLangModal(false);
                    }}
                    className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-cyan-950/30 rounded-xl transition text-left cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{lang.name}</p>
                      <p className="text-xs text-zinc-400">{lang.native}</p>
                    </div>
                    {selectedLang.code === lang.code && (
                      <div className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowPrivacyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0a0a14] border border-cyan-900/50 rounded-2xl p-6 shadow-2xl text-left max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span>Privacy Policy</span>
                </h3>
                <button onClick={() => setShowPrivacyModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 text-xs text-zinc-300 space-y-3 leading-relaxed">
                <p className="font-semibold text-white">Your Privacy on Nightgram</p>
                <p>
                  We treat nocturnal creativity with end-to-end respect. Your direct messages, mood frequencies, and private memories are securely encrypted in your personalized workspace.
                </p>
                <p>
                  1. <strong>Local Storage & Cloud Sync:</strong> All preferences, audio presets, and drafts are cached securely on your device and synchronized to your account only when authenticated.
                </p>
                <p>
                  2. <strong>No Ad Trackers:</strong> We do not sell your nocturnal rhythm data or personal habits to third-party ad networks.
                </p>
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Terms of Service Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0a0a14] border border-cyan-900/50 rounded-2xl p-6 shadow-2xl text-left max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <span>Terms of Service</span>
                </h3>
                <button onClick={() => setShowTermsModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 text-xs text-zinc-300 space-y-3 leading-relaxed">
                <p className="font-semibold text-white">Community & Usage Guidelines</p>
                <p>
                  By creating an account on Nightgram, you agree to engage respectfully with other creators, respect copyright on short videos and audio samples, and keep interactions safe and positive.
                </p>
                <p>
                  1. <strong>Content Ownership:</strong> You retain ownership of all media and nocturnal shorts you publish.
                </p>
                <p>
                  2. <strong>Account Responsibility:</strong> You are responsible for safeguarding your login credentials and ensuring accurate profile representations.
                </p>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg"
              >
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Accessibility Modal */}
      <AnimatePresence>
        {showAccessibilityModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowAccessibilityModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#0a0a14] border border-cyan-900/50 rounded-2xl p-5 shadow-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-white">Accessibility Options</h3>
                <button onClick={() => setShowAccessibilityModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="py-4 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">High Contrast True Black</p>
                    <p className="text-zinc-400 text-[11px]">Enhances contrast for OLED screens</p>
                  </div>
                  <button
                    onClick={() => setHighContrast(!highContrast)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      highContrast ? 'bg-cyan-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        highContrast ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowAccessibilityModal(false)}
                className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
