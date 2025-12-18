// assets/js/utils/revealOnScroll.js
export function initScrollReveal() {
  const elements = document.querySelectorAll(".reveal-section");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-section--visible");
          observer.unobserve(entry.target); // anima só uma vez
        }
      });
    },
    { threshold: 0.15 }
  );

  elements.forEach(el => observer.observe(el));
}
