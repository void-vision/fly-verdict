"use client";

import { useLang } from "@/hooks/useLang";

export function SiteFooter() {
  const { t } = useLang();
  return (
    <footer className="fv-footer">
      <div className="fv-inner flex flex-wrap justify-between gap-6 font-[family-name:var(--mono)] text-[10.5px] leading-[1.9] tracking-[0.1em] text-[color:var(--ink-3)]">
        <div className="flex items-baseline gap-3">
          <span className="font-[family-name:var(--serif)] text-[15px] text-[color:var(--ink)]">蝇审</span>
          <span>FLY VERDICT · 2026</span>
        </div>
        <div className="flex flex-wrap gap-[26px]">
          <a href="https://github.com" className="border-none text-[color:var(--ink-3)] hover:text-[color:var(--ink)]">
            {t.footer.source}
          </a>
          <a href="#truth" className="border-none text-[color:var(--ink-3)] hover:text-[color:var(--ink)]">
            {t.footer.privacy}
          </a>
          <a href="#truth" className="border-none text-[color:var(--ink-3)] hover:text-[color:var(--ink)]">
            {t.footer.attribution}
          </a>
        </div>
        <div className="max-w-[42ch] text-right">
          MaleCNS connectome, HHMI Janelia FlyEM & Google Research, CC-BY
        </div>
      </div>
    </footer>
  );
}
