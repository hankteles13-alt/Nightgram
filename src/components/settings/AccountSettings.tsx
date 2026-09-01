import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Fingerprint, Mail, Download, Trash2, ChevronRight, Check, X, Smartphone } from 'lucide-react';
import { playSoundEffect } from '../../lib/settingsManager';

interface AccountSettingsProps {
  email?: string;
  onUpdateEmail?: (newEmail: string) => void;
  twoFactorEnabled: boolean;
  onToggleTwoFactor: () => void;
  securityNotifs: boolean;
  onToggleSecurityNotifs: () => void;
  passkeysEnabled: boolean;
  onTogglePasskeys: () => void;
  onDeleteAccount?: () => void;
}

export default function AccountSettings({
  email = 'user@nightgram.com',
  onUpdateEmail,
  twoFactorEnabled,
  onToggleTwoFactor,
  securityNotifs,
  onToggleSecurityNotifs,
  passkeysEnabled,
  onTogglePasskeys,
  onDeleteAccount,
}: AccountSettingsProps) {
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [totpCode, setTotpCode] = useState('842 190');

  const handleRefresh2FACode = () => {
    const code1 = Math.floor(100 + Math.random() * 900);
    const code2 = Math.floor(100 + Math.random() * 900);
    setTotpCode(`${code1} ${code2}`);
    playSoundEffect('pop');
  };

  const handleRegisterPasskey = () => {
    setShowPasskeyModal(true);
    setTimeout(() => {
      onTogglePasskeys();
      playSoundEffect('sent');
    }, 1000);
  };

  const handleSaveEmail = () => {
    if (newEmailInput.includes('@') && newEmailInput.includes('.')) {
      if (onUpdateEmail) onUpdateEmail(newEmailInput.trim());
      setShowEmailModal(false);
      playSoundEffect('sent');
      alert(`Account email updated to ${newEmailInput.trim()}`);
    } else {
      alert('Please enter a valid email address.');
    }
  };

  return (
    <div className="p-4 space-y-4" id="settings-account-page">
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
        {/* Two-Factor Authentication */}
        <button
          type="button"
          onClick={() => setShow2FAModal(true)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-800/40 transition cursor-pointer"
        >
          <div>
            <div className="flex items-center space-x-2">
              <h5 className="text-xs font-semibold text-zinc-200">Two-Factor Authentication</h5>
              {twoFactorEnabled ? (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-semibold border border-emerald-500/30">
                  Active
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[9px] font-semibold">
                  Disabled
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">6-digit security code required on login</p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>

        {/* Security Notifications */}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Security notifications</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">Get alerted when a login occurs on a new device</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleSecurityNotifs();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              securityNotifs ? 'bg-cyan-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                securityNotifs ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Passkeys */}
        <button
          type="button"
          onClick={handleRegisterPasskey}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-800/40 transition cursor-pointer"
        >
          <div>
            <div className="flex items-center space-x-2">
              <h5 className="text-xs font-semibold text-zinc-200">Passkeys</h5>
              {passkeysEnabled && (
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-semibold">
                  Configured
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Biometric & hardware security key (Touch ID / Face ID)</p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>

        {/* Account Email */}
        <button
          type="button"
          onClick={() => {
            setNewEmailInput(email);
            setShowEmailModal(true);
          }}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-800/40 transition cursor-pointer"
        >
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Account Email</h5>
            <p className="text-[11px] text-cyan-400 mt-0.5">{email}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      {/* Account Info Export & Delete */}
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
        <button
          type="button"
          onClick={() => {
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
              appName: 'Nightgram',
              email,
              twoFactorEnabled,
              exportDate: new Date().toISOString(),
            }, null, 2));
            const dl = document.createElement('a');
            dl.setAttribute('href', dataStr);
            dl.setAttribute('download', `nightgram_account_${Date.now()}.json`);
            document.body.appendChild(dl);
            dl.click();
            dl.remove();
            playSoundEffect('sent');
          }}
          className="w-full p-3.5 px-4 text-left text-xs font-medium text-zinc-300 hover:bg-zinc-800/40 transition flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Request Account Info Archive</span>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Are you sure you want to delete your account? This action is permanent and will remove all messages, posts, and keys.')) {
              if (onDeleteAccount) onDeleteAccount();
            }
          }}
          className="w-full p-3.5 px-4 text-left text-xs font-bold text-red-400 hover:bg-red-950/30 transition flex items-center space-x-2.5 cursor-pointer"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
          <span>Delete My Account</span>
        </button>
      </div>

      {/* Modal: 2FA Settings & Code */}
      {show2FAModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#12121e] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Two-Factor Security Code</h4>
            <p className="text-xs text-zinc-400">
              When enabled, enter this temporary 6-digit authenticator code on unrecognized devices:
            </p>

            <div className="p-3 bg-zinc-950 rounded-xl border border-emerald-500/30 text-emerald-300 font-mono text-xl font-bold tracking-widest">
              {totpCode}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleRefresh2FACode}
                className="text-xs text-cyan-400 hover:underline"
              >
                Generate New Code
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggleTwoFactor();
                  playSoundEffect('pop');
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  twoFactorEnabled ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {twoFactorEnabled ? 'Turn Off' : 'Turn On'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShow2FAModal(false)}
              className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Modal: Update Email */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#12121e] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-white">Update Account Email</h4>
            <input
              type="email"
              value={newEmailInput}
              onChange={(e) => setNewEmailInput(e.target.value)}
              placeholder="name@domain.com"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEmail}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Passkey Biometric Feedback */}
      {showPasskeyModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#12121e] border border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-2xl text-center">
            <Fingerprint className="w-12 h-12 text-cyan-400 animate-pulse mx-auto" />
            <h4 className="text-sm font-bold text-white">Passkey Registered</h4>
            <p className="text-xs text-zinc-400">
              Your biometric passkey is now linked to this browser for instantaneous one-touch login.
            </p>
            <button
              type="button"
              onClick={() => setShowPasskeyModal(false)}
              className="w-full py-2 rounded-xl bg-cyan-500 text-zinc-950 text-xs font-bold transition"
            >
              Great!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
