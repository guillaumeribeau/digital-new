"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, X } from "lucide-react";
import Link from "next/link";
import { ProcessIllustration, processSteps } from "./process-section";
import { SitePreview } from "./site-preview";
import { demos } from "@tadapo/lib/demos";
export function GuidedTour() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  useEffect(() => {
    if (!open || !playing) return;
    const timer = setInterval(() => setScene(previous => previous === 3 ? 0 : previous + 1), 6500);
    return () => clearInterval(timer);
  }, [open, playing]);
  function close() { dialog.current?.close(); setOpen(false); trigger.current?.focus(); }
  return <section className="guided-section t-section" id="decouvrir"><div className="t-container guided-layout"><div className="reveal"><p className="t-eyebrow">REGARDEZ COMMENT ÇA SE PASSE</p><h2>Votre site.<br /><span>Du premier clic<br />au grand départ.</span></h2><p>Un questionnaire, une formule, une création à découvrir.<br />Prenez un instant pour voir le parcours.</p><button className="t-button" ref={trigger} onClick={() => { setScene(0); setPlaying(!window.matchMedia("(prefers-reduced-motion: reduce)").matches); dialog.current?.showModal(); setOpen(true); }}><Play size={16} fill="currentColor" /> Voir la démo guidée</button><span className="guided-note">4 étapes illustrées · à regarder à votre rythme</span></div><div className="guided-cover"><div className="guided-cover-screen"><SitePreview demo={demos[2]} /></div><div className="guided-cover-caption"><span>De l’idée au site</span><strong>Et… tadapo !</strong><ArrowUpRight size={35} /></div></div></div>
    <dialog ref={dialog} className="tour-dialog" aria-labelledby="tour-title" onCancel={() => { setOpen(false); trigger.current?.focus(); }} onClose={() => setOpen(false)} onClick={event => { if (event.target === dialog.current) close(); }}><div className="tour-dialog-inner"><div className="tour-top"><span>DÉMO GUIDÉE · 0{scene + 1} / 04</span><button aria-label="Fermer la démo" onClick={close}><X /></button></div>{open && <div className="tour-scene" key={scene}><ProcessIllustration scene={scene} /><p className="t-eyebrow">{processSteps[scene].label}</p><h2 id="tour-title">{processSteps[scene].title}</h2><p>{processSteps[scene].description}</p></div>}<div className="tour-controls"><button aria-label="Étape précédente" disabled={scene === 0} onClick={() => { setPlaying(false); setScene(scene - 1); }}><ArrowLeft size={18} /></button><div className="tour-dots" role="group" aria-label="Choisir une étape">{processSteps.map((step, index) => <button key={step.label} aria-label={`Étape ${index + 1} : ${step.label}`} aria-pressed={scene === index} onClick={() => { setPlaying(false); setScene(index); }} />)}</div><button aria-label={playing ? "Mettre en pause" : "Lancer la lecture"} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={16} /> : <Play size={16} />}</button><button aria-label="Étape suivante" disabled={scene === 3} onClick={() => { setPlaying(false); setScene(scene + 1); }}><ArrowRight size={18} /></button></div><Link href="/commande" className="t-text-link" onClick={close}>À mon tour de préparer mon site <ArrowUpRight size={16} /></Link></div></dialog>
  </section>;
}
