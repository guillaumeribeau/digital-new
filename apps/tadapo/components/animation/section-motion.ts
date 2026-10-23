import gsap from "gsap";

export function sectionEntrances(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".project-landmarks,.approach-table,.faq-list").forEach(group => {
    gsap.from(group.children, { y: 45, opacity: 0, stagger: .14, duration: .9, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: group, start: "top 85%", once: true } });
  });
  const cover = root.querySelector<HTMLElement>(".guided-cover");
  if (cover) {
    gsap.from(cover, { y: 65, rotation: 5, scale: .9, opacity: 0, duration: 1.2, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: cover, start: "top 88%", once: true } });
    gsap.fromTo(cover.querySelector(".guided-cover-screen"), { y: 20, rotation: -3 }, { y: -20, rotation: 2, ease: "none", scrollTrigger: { trigger: cover, start: "top bottom", end: "bottom top", scrub: .8 } });
  }
  root.querySelectorAll<HTMLElement>(".section-heading,.guided-layout>.reveal,.faq-layout>.reveal").forEach(heading => {
    gsap.from(heading.children, { y: 27, opacity: 0, stagger: .09, duration: .8, ease: "power3.out", scrollTrigger: { trigger: heading, start: "top 94%", once: true } });
  });
  root.querySelectorAll<HTMLElement>(".benefits-grid,.pricing-grid,.closing-grid,.domain-hosting-grid").forEach(grid => {
    gsap.from(grid.children, { y: 60, rotation: index => index % 2 ? 3 : -3, scale: .93, opacity: 0, stagger: .16, duration: 1, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: grid, start: "top 88%", once: true } });
  });
  root.querySelectorAll<HTMLElement>(".process-card").forEach(card => {
    gsap.from(card, { y: 32, opacity: 0, duration: .75, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: card, start: "top 94%", once: true } });
  });
  root.querySelectorAll<HTMLElement>(".existing-site-banner,.delivery-reassurance,.contact-layout").forEach(element => {
    gsap.from(element, { y: 25, opacity: 0, duration: .75, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 94%", once: true } });
  });
}
export function processNarrative(root: HTMLElement) {
  const grid = root.querySelector<HTMLElement>(".process-grid");
  if (!grid) return;
  const timeline = gsap.timeline({ scrollTrigger: { id: "tadapo-process", trigger: grid, start: "top 78%", end: "bottom 50%", scrub: .5 } });
  timeline.fromTo(".process-track>i", { scaleX: 0 }, { scaleX: 1, duration: 4, ease: "none" }, 0);
  root.querySelectorAll<HTMLElement>(".process-card").forEach((card, i) => {
    timeline.fromTo(card.querySelector(".process-card-top>span:first-child"), { scale: 1 }, { scale: 1.16, duration: .3, repeat: 1, yoyo: true }, i + .1);
    timeline.fromTo(card.querySelectorAll(".process-float"), { x: -7 }, { x: 7, rotation: 0, duration: .85, ease: "power2.out" }, i);
    timeline.fromTo(`.process-track>span:nth-of-type(${i + 1})`, { scale: .8 }, { scale: 1.2, duration: .5, ease: "back.out(2)" }, i);
  });
}
export function closingReveal(root: HTMLElement) {
  const section = root.querySelector<HTMLElement>(".final-cta");
  if (!section) return;
  const timeline = gsap.timeline({ scrollTrigger: { trigger: section, start: "top 88%", once: true }, defaults: { ease: "power3.out" } });
  timeline.from(".final-cta .final-line", { yPercent: 70, rotation: -4, opacity: 0, duration: .85 })
    .from(".final-cta h2>span:last-child", { y: 55, scale: .8, rotation: 4, opacity: 0, duration: 1, ease: "back.out(1.7)" }, .12)
    .from(".final-cta h2 .t-spark", { rotation: -140, scale: .3, duration: 1.2, ease: "back.out(1.7)" }, .2)
    .from(".final-cta>div>p:not(.t-eyebrow),.final-cta .t-button,.final-footnote", { y: 20, opacity: 0, stagger: .09, duration: .65 }, .4);
}
