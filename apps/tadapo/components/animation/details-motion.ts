import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Enhance native details; keyboard and no-JS disclosure behavior stay available. */
export function animateDetails(root: HTMLElement, safe: (callback: (event: MouseEvent) => void) => (event: MouseEvent) => void) {
  const cleanups: (() => void)[] = [];
  root.querySelectorAll<HTMLDetailsElement>(".faq-list details").forEach(details => {
    const summary = details.querySelector("summary");
    const content = details.querySelector("p");
    if (!summary || !content) return;
    let desired = details.open;
    const click = safe((event: MouseEvent) => {
      event.preventDefault(); desired = !desired;
      gsap.killTweensOf([details, content]);
      const height = details.getBoundingClientRect().height;
      details.open = true;
      details.style.height = "auto";
      const target = desired ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + 1;
      gsap.fromTo(details, { height, overflow: "hidden" }, { height: target, duration: .38, ease: "power2.inOut", onComplete: () => {
        details.open = desired;
        gsap.set(details, { clearProps: "height,overflow" });
        gsap.set(content, { clearProps: "opacity,transform" });
        ScrollTrigger.refresh();
      } });
      gsap.to(content, { opacity: desired ? 1 : 0, y: desired ? 0 : -5, duration: .25, overwrite: true });
    });
    summary.addEventListener("click", click);
    cleanups.push(() => { summary.removeEventListener("click", click); gsap.killTweensOf([details, content]); details.open = desired; details.style.removeProperty("height"); details.style.removeProperty("overflow"); });
  });
  return () => cleanups.forEach(cleanup => cleanup());
}
