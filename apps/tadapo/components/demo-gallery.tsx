"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "lucide-react";
import type { DemoPhoto } from "@tadapo/lib/demo-photos";

export type DemoGalleryItem = { photo: DemoPhoto; title: string; detail: string };

export function DemoGallery({ items, label }: { items: DemoGalleryItem[]; label: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [selected, setSelected] = useState(0);
  const item = items[selected];
  function move(delta: number) { setSelected(index => (index + delta + items.length) % items.length); }
  return <>
    <div className="d-gallery" aria-label={label}>{items.map((entry, index) => <button className="d-gallery-card" key={entry.title} aria-label={`Agrandir : ${entry.title}`} onClick={event => { trigger.current = event.currentTarget; setSelected(index); dialog.current?.showModal(); }}>
      <span className="d-gallery-photo"><Image src={entry.photo.src} alt={entry.photo.alt} fill sizes="(max-width: 699px) 100vw, (max-width: 1000px) 50vw, 33vw" /><span className="d-gallery-open"><ArrowUpRight size={21} /></span></span>
      <span className="d-gallery-caption"><span><strong>{entry.title}</strong><small>{entry.detail}</small></span><span aria-hidden="true">0{index + 1}</span></span>
    </button>)}</div>
    <dialog ref={dialog} className="d-lightbox" aria-label={label} onClose={() => trigger.current?.focus()} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); } }}>
      <div className="d-lightbox-top"><span>{selected + 1} / {items.length}</span><button aria-label="Fermer la galerie" onClick={() => dialog.current?.close()}><X size={23} /></button></div>
      <div className="d-lightbox-image"><Image src={item.photo.src} alt={item.photo.alt} fill sizes="(max-width: 900px) 90vw, 1000px" /></div>
      <div className="d-lightbox-bottom"><button aria-label="Image précédente" onClick={() => move(-1)}><ArrowLeft /></button><div aria-live="polite"><strong>{item.title}</strong><p>{item.detail} · Photographie d’illustration</p></div><button aria-label="Image suivante" onClick={() => move(1)}><ArrowRight /></button></div>
    </dialog>
  </>;
}
