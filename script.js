
document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".portfolio__track");
  const viewport = document.querySelector(".portfolio__viewport");
  const previous = document.querySelector(".portfolio__arrow--prev");
  const next = document.querySelector(".portfolio__arrow--next");
  const current = document.querySelector(".portfolio__current");
  const total = document.querySelector(".portfolio__total");

  if (!track || !viewport || !previous || !next) {
    console.error("Carrossel: elementos não encontrados.");
    return;
  }

  const cards = Array.from(track.querySelectorAll(".project-card"));

  if (!cards.length) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let currentIndex = 0;
  let animating = false;
  let animationTimeout;

  function getVisibleCards() {
    const value = getComputedStyle(track)
      .getPropertyValue("--visible-cards");

    return Math.max(1, Number.parseInt(value, 10) || 3);
  }

  function getStep() {
    if (cards.length < 2) {
      return cards[0].getBoundingClientRect().width;
    }

    return cards[1].offsetLeft - cards[0].offsetLeft;
  }

  function getMaxIndex() {
    return Math.max(0, cards.length - getVisibleCards());
  }

  function getTotalPages() {
    return Math.ceil(cards.length / getVisibleCards());
  }

  function updatePagination() {
    const visible = getVisibleCards();
    const page = Math.floor(currentIndex / visible) + 1;

    if (current) {
      current.textContent = String(page).padStart(2, "0");
    }

    if (total) {
      total.textContent = String(getTotalPages()).padStart(2, "0");
    }
  }

  function render(animate = true) {
    track.style.transition = animate && !reducedMotion.matches
      ? "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)"
      : "none";

    const distance = currentIndex * getStep();

    track.style.transform = `translate3d(${-distance}px, 0, 0)`;

    updatePagination();
  }

  function move(direction) {
    if (animating) return;

    const visible = getVisibleCards();
    const maxIndex = getMaxIndex();

    let target = currentIndex + direction * visible;

    // Regressa ao início ou ao fim quando necessário.
    if (target > maxIndex) {
      target = 0;
    } else if (target < 0) {
      target = maxIndex;
    }

    if (target === currentIndex) return;

    currentIndex = target;

    if (!reducedMotion.matches) {
      animating = true;

      clearTimeout(animationTimeout);

      animationTimeout = setTimeout(() => {
        animating = false;
      }, 750);
    }

    render(true);
  }

  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));

  // Liberta a navegação ao terminar a animação.
  track.addEventListener("transitionend", (event) => {
    if (event.propertyName === "transform") {
      animating = false;
      clearTimeout(animationTimeout);
    }
  });

  // Ajusta o posicionamento ao mudar o tamanho do ecrã.
  let previousVisible = getVisibleCards();

  window.addEventListener("resize", () => {
    const visible = getVisibleCards();

    if (visible !== previousVisible) {
      currentIndex = 0;
      previousVisible = visible;
    }

    currentIndex = Math.min(currentIndex, getMaxIndex());
    animating = false;
    clearTimeout(animationTimeout);

    render(false);
  });

  render(false);

  console.log(
    "Carrossel horizontal carregado:",
    cards.length,
    "projetos."
  );
});
