"use client";

import { useLang } from "@/hooks/useLang";

const NOTE_COLORS = ["var(--amber)", "var(--iris)", "var(--verde)"];

export function Truth() {
  const { t } = useLang();
  return (
    <section id="truth" className="fv-section">
      <div className="fv-inner fv-truth">
        <div>
          <h2 className="fv-h2 mb-[30px]">{t.truth.h2}</h2>
          <p className="mb-[22px] max-w-[60ch] font-[family-name:var(--serif)] text-[19px] leading-[1.62] text-[color:var(--ink-2)]">
            {t.truth.p1}
          </p>
          <p className="mb-[22px] font-[family-name:var(--sans)] text-sm leading-[1.8] text-[color:var(--ink-2)]">
            {t.truth.p2}
          </p>
          <div className="border-t border-[color:var(--line)] pt-[22px] font-[family-name:var(--mono)] text-[10.5px] leading-[2] tracking-[0.06em] text-[color:var(--ink-3)]">
            REFERENCE
            <br />
            <span className="text-[color:var(--ink-2)]">
              MaleCNS connectome, HHMI Janelia FlyEM & Google Research, CC-BY
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-px self-start border border-[color:var(--line)] bg-[color:var(--line)]">
          {t.truth.notes.map((note, i) => (
            <div key={i} className="bg-[color:var(--bg-2)] px-7 py-[26px]">
              <div
                className="mb-3 font-[family-name:var(--mono)] text-[10px] tracking-[0.2em]"
                style={{ color: NOTE_COLORS[i] }}
              >
                {note.k}
              </div>
              <div className="font-[family-name:var(--sans)] text-sm leading-[1.8] text-[color:var(--ink-2)]">
                {note.v}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
