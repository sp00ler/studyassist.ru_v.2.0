'use client'

interface RetroGateProps {
  onEnter: () => void
}

export function RetroGate({ onEnter }: RetroGateProps) {
  return (
    <div className="w-full h-full bg-[#0d0906] flex items-center justify-center overflow-hidden select-none">
      {/* Locked to the illustration's own 1088:608 ratio so every %-positioned
          overlay below lines up with it at any viewport size — object-fit:cover
          on an arbitrary box would crop the sides and throw the hotspot off. */}
      <div className="relative w-full max-h-full" style={{ aspectRatio: '1088 / 608' }}>
        <img
          src="/images/retro-pc/room-scene.png"
          alt="Комната с ретро-компьютером StudyAssist"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
          fetchPriority="high"
        />

        {/* Tower LEDs — real blinking state, aligned to the illustration */}
        <span
          className="absolute rounded-full led-power"
          style={{ left: '40.2%', top: '67.4%', width: '0.55%', aspectRatio: '1' }}
          aria-hidden
        />
        <span
          className="absolute rounded-full led-cd"
          style={{ left: '42.6%', top: '67.4%', width: '0.55%', aspectRatio: '1' }}
          aria-hidden
        />

        {/* Ambient room caption */}
        <div className="absolute left-[3%] bottom-[4%] max-w-[46%] sm:max-w-xs pointer-events-none">
          <p className="font-pixel text-[7px] sm:text-[10px] text-[#F5F0E3] leading-[1.9] [text-shadow:0_2px_0_rgba(0,0,0,.9)]">
            STUDYASSIST.EXE
            <br />
            курсовые · дипломы · рефераты
            <br />
            с гарантией
          </p>
        </div>

        {/* Click hotspot over the monitor screen */}
        <button
          type="button"
          onClick={onEnter}
          aria-label="Открыть сайт StudyAssist"
          className="group absolute outline-none"
          style={{ left: '20.6%', top: '21.5%', width: '21.5%', height: '27%' }}
        >
          <span className="absolute inset-0 rounded-[1px] ring-0 group-hover:ring-4 ring-[#2FAE5B]/60 group-focus-visible:ring-4 transition-all duration-150" />
          <span className="absolute bottom-[10%] left-1/2 -translate-x-1/2 whitespace-nowrap font-pixel text-[6px] sm:text-[9px] text-[#e9f7ee] bg-[#0d0906]/80 border border-[#2FAE5B]/70 px-1.5 py-1 rounded-[1px] opacity-90 group-hover:opacity-100 group-hover:bg-[#2FAE5B] group-hover:text-[#0d0906] transition-colors animate-pulse group-hover:animate-none">
            нажми, чтобы войти ▸
          </span>
        </button>
      </div>
    </div>
  )
}
