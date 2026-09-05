import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { toggleMute, getMuteState } from '../utils/audio';

export default function SoundToggle() {
  const [muted, setMuted] = useState(getMuteState());

  const handleToggle = () => {
    const newState = toggleMute();
    setMuted(newState);
  };

  return (
    <button
      id="sound-toggle-btn"
      onClick={handleToggle}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all active:scale-95 text-xs font-semibold
        ${muted 
          ? 'bg-rose-50 border-rose-300 text-rose-500' 
          : 'bg-emerald-50 border-emerald-300 text-emerald-600'
        }`}
    >
      {muted ? <VolumeX className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
      <span>{muted ? 'びぷ音：OFF' : 'おと：ON'}</span>
    </button>
  );
}
