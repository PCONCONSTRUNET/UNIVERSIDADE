import { SUBJECT_COLORS } from '@/types/uniflow';

interface SubjectColorPaletteProps {
  value: string;
  onChange: (color: string) => void;
}

const SubjectColorPalette = ({ value, onChange }: SubjectColorPaletteProps) => {
  return (
    <div className="flex justify-center">
      <div
        className="rounded-lg border-[3px] border-foreground/80 p-3 shadow-[3px_3px_0px_rgba(0,0,0,0.8)]"
        style={{ background: 'hsl(var(--card))' }}
      >
        <div className="flex" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
          {SUBJECT_COLORS.map((c, i) => {
            const isSelected = value === c;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onChange(c)}
                className="subject-palette-item"
                style={{ ['--color' as string]: c }}
                aria-label={c}
                data-selected={isSelected || undefined}
              >
                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none" style={{ width: 34, height: 34, top: 3, left: 3 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <style>{`
          .subject-palette-item {
            position: relative;
            flex-shrink: 0;
            width: 36px;
            height: 42px;
            border: none;
            outline: none;
            margin: 0 -3px;
            background-color: transparent;
            transition: 300ms ease-out;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
          }
          .subject-palette-item::after {
            position: absolute;
            content: "";
            inset: 0;
            width: 34px;
            height: 34px;
            top: 4px;
            left: 1px;
            background-color: var(--color);
            border-radius: 6px;
            border: 2.5px solid rgba(0,0,0,0.7);
            box-shadow: 3px 3px 0 0 rgba(0,0,0,0.7);
            pointer-events: none;
            transition: 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .subject-palette-item[data-selected]::after {
            box-shadow: 2px 2px 0 0 rgba(0,0,0,0.7);
            transform: translate(1px, 1px);
          }
          .subject-palette-item:hover {
            transform: scale(1.5) translateY(-5px);
            z-index: 99999;
          }
          .subject-palette-item:active::after {
            transform: translate(2px, 2px);
            box-shadow: 1px 1px 0 0 rgba(0,0,0,0.7);
          }
          .subject-palette-item:hover + .subject-palette-item {
            transform: scale(1.3) translateY(-3px);
            z-index: 9999;
          }
          .subject-palette-item:hover + .subject-palette-item + .subject-palette-item {
            transform: scale(1.15);
            z-index: 999;
          }
          .subject-palette-item:has(+ .subject-palette-item:hover) {
            transform: scale(1.3) translateY(-3px);
            z-index: 9999;
          }
          .subject-palette-item:has(+ .subject-palette-item + .subject-palette-item:hover) {
            transform: scale(1.15);
            z-index: 999;
          }
        `}</style>
      </div>
    </div>
  );
};

export default SubjectColorPalette;
