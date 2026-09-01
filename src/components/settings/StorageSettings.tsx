import React, { useState } from 'react';
import { HardDrive, Wifi, Smartphone, Globe, ChevronRight, Trash2, Check, Sparkles } from 'lucide-react';
import { getStorageBreakdown, playSoundEffect } from '../../lib/settingsManager';

interface StorageSettingsProps {
  mobileAutoDownload: { photos: boolean; audio: boolean; videos: boolean; documents: boolean };
  onChangeMobileAutoDownload: (obj: { photos: boolean; audio: boolean; videos: boolean; documents: boolean }) => void;
  wifiAutoDownload: { photos: boolean; audio: boolean; videos: boolean; documents: boolean };
  onChangeWifiAutoDownload: (obj: { photos: boolean; audio: boolean; videos: boolean; documents: boolean }) => void;
  roamingAutoDownload: { photos: boolean; audio: boolean; videos: boolean; documents: boolean };
  onChangeRoamingAutoDownload: (obj: { photos: boolean; audio: boolean; videos: boolean; documents: boolean }) => void;
  dataSaver: boolean;
  onToggleDataSaver: () => void;
}

export default function StorageSettings({
  mobileAutoDownload,
  onChangeMobileAutoDownload,
  wifiAutoDownload,
  onChangeWifiAutoDownload,
  roamingAutoDownload,
  onChangeRoamingAutoDownload,
  dataSaver,
  onToggleDataSaver,
}: StorageSettingsProps) {
  const [dialogType, setDialogType] = useState<'mobile' | 'wifi' | 'roaming' | null>(null);
  const [storageData, setStorageData] = useState(() => getStorageBreakdown());
  const [showManageModal, setShowManageModal] = useState(false);

  const handleClearCache = () => {
    // Clear temporary cache keys
    try {
      sessionStorage.clear();
      setStorageData({
        totalMb: '0.00',
        messagesMb: '0.00',
        mediaMb: '0.00',
        systemMb: '0.00',
      });
      playSoundEffect('sent');
      alert('Temporary storage and cached media have been cleared.');
    } catch {
      alert('Storage cleared.');
    }
  };

  return (
    <div className="p-4 space-y-4" id="settings-storage-page">
      {/* Storage Overview */}
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowManageModal(true)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-800/40 transition cursor-pointer"
        >
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Manage storage</h5>
            <p className="text-[11px] text-cyan-400 mt-0.5">{storageData.totalMb} MB used across device</p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>

        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Data Saver Mode</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">Reduces image resolution and pauses heavy video preload</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleDataSaver();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              dataSaver ? 'bg-cyan-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                dataSaver ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Media Auto-Download Section */}
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
        <div className="p-3 bg-[#161626]">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Media Auto-Download</span>
        </div>

        <button
          type="button"
          onClick={() => setDialogType('mobile')}
          className="w-full p-3.5 text-left hover:bg-zinc-800/60 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">When using mobile data</h5>
            <p className="text-[11px] text-cyan-400 mt-0.5 capitalize">
              {Object.entries(mobileAutoDownload)
                .filter(([_, v]) => v)
                .map(([k]) => k)
                .join(', ') || 'No media'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>

        <button
          type="button"
          onClick={() => setDialogType('wifi')}
          className="w-full p-3.5 text-left hover:bg-zinc-800/60 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">When connected on Wi-Fi</h5>
            <p className="text-[11px] text-cyan-400 mt-0.5 capitalize">
              {Object.entries(wifiAutoDownload)
                .filter(([_, v]) => v)
                .map(([k]) => k)
                .join(', ') || 'No media'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>

        <button
          type="button"
          onClick={() => setDialogType('roaming')}
          className="w-full p-3.5 text-left hover:bg-zinc-800/60 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">When roaming</h5>
            <p className="text-[11px] text-cyan-400 mt-0.5 capitalize">
              {Object.entries(roamingAutoDownload)
                .filter(([_, v]) => v)
                .map(([k]) => k)
                .join(', ') || 'No media'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      {/* Modal: Manage Storage Detail */}
      {showManageModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#12121e] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-white">Storage Breakdown</h4>
            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="flex justify-between">
                <span>Chat Messages & Polls</span>
                <span className="font-mono text-zinc-400">{storageData.messagesMb} MB</span>
              </div>
              <div className="flex justify-between">
                <span>Media & Stickers</span>
                <span className="font-mono text-zinc-400">{storageData.mediaMb} MB</span>
              </div>
              <div className="flex justify-between">
                <span>System Cache</span>
                <span className="font-mono text-zinc-400">{storageData.systemMb} MB</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleClearCache}
                className="w-full py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cache Now</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowManageModal(false)}
              className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal: Media Auto-Download Checkboxes */}
      {dialogType && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#12121e] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl text-zinc-100">
            <h4 className="text-sm font-bold text-white capitalize">
              {dialogType === 'mobile'
                ? 'When using mobile data'
                : dialogType === 'wifi'
                ? 'When connected on Wi-Fi'
                : 'When roaming'}
            </h4>

            <div className="space-y-2.5 pt-1">
              {(['photos', 'audio', 'videos', 'documents'] as const).map((mediaKey) => {
                const currentObj =
                  dialogType === 'mobile'
                    ? mobileAutoDownload
                    : dialogType === 'wifi'
                    ? wifiAutoDownload
                    : roamingAutoDownload;
                const isChecked = currentObj[mediaKey];

                return (
                  <label
                    key={mediaKey}
                    className="flex items-center space-x-3 cursor-pointer select-none text-xs text-zinc-300 hover:text-white"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (dialogType === 'mobile') {
                          onChangeMobileAutoDownload({ ...mobileAutoDownload, [mediaKey]: !mobileAutoDownload[mediaKey] });
                        } else if (dialogType === 'wifi') {
                          onChangeWifiAutoDownload({ ...wifiAutoDownload, [mediaKey]: !wifiAutoDownload[mediaKey] });
                        } else {
                          onChangeRoamingAutoDownload({ ...roamingAutoDownload, [mediaKey]: !roamingAutoDownload[mediaKey] });
                        }
                        playSoundEffect('pop');
                      }}
                      className="w-4 h-4 rounded text-emerald-500 bg-zinc-800 border-zinc-700 focus:ring-0"
                    />
                    <span className="capitalize">{mediaKey}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDialogType(null)}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
