
document.addEventListener("DOMContentLoaded", () => {

  /* ========================================
     ABOUT — TÍTULO NUMA LINHA À LARGURA DA COMPOSIÇÃO
  ======================================== */

  const aboutTitle = document.querySelector(".about__title");
  const aboutWord = aboutTitle?.querySelector(".about__title-word");

  if (aboutTitle && aboutWord) {
    const aboutMeasure = document.createElement("canvas").getContext("2d");

    function fitAboutTitle() {
      const availableWidth = aboutTitle.getBoundingClientRect().width;
      const styles = window.getComputedStyle(aboutTitle);
      const fontSize = parseFloat(styles.fontSize);

      if (!aboutMeasure || availableWidth <= 0) {
        return;
      }

      // Ajustar o título completo sem o deixar ultrapassar a composição.
      // A escala de 1000 px reduz os arredondamentos da medição tipográfica.
      const letterSpacingRatio = parseFloat(styles.letterSpacing) / fontSize;
      const wordSpacingRatio = parseFloat(styles.wordSpacing) / fontSize;
      aboutMeasure.font = `${styles.fontWeight} 1000px ${styles.fontFamily}`;
      aboutMeasure.letterSpacing = `${letterSpacingRatio * 1000}px`;
      aboutMeasure.wordSpacing = `${wordSpacingRatio * 1000}px`;
      const metrics = aboutMeasure.measureText(aboutWord.textContent.trim());
      const inkWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;

      if (inkWidth <= 0) {
        return;
      }

      const scale = availableWidth / inkWidth;
      const fittedSize = 1000 * scale;

      if (Math.abs(fittedSize - fontSize) > 0.01) {
        aboutTitle.style.setProperty("--about-title-size", `${fittedSize}px`);
      }

      // Compensar também o arredondamento dos glifos à dimensão final.
      aboutMeasure.font = `${styles.fontWeight} ${fittedSize}px ${styles.fontFamily}`;
      aboutMeasure.letterSpacing = `${letterSpacingRatio * fittedSize}px`;
      aboutMeasure.wordSpacing = `${wordSpacingRatio * fittedSize}px`;
      const fittedMetrics = aboutMeasure.measureText(aboutWord.textContent.trim());
      const inkScale = availableWidth / (fittedMetrics.actualBoundingBoxLeft + fittedMetrics.actualBoundingBoxRight);
      aboutTitle.style.setProperty("--about-title-scale", inkScale);

      aboutTitle.querySelectorAll("span").forEach((word) => {
        const wordMetrics = aboutMeasure.measureText(word.textContent.trim());
        word.style.setProperty("--about-word-offset", `${wordMetrics.actualBoundingBoxLeft * inkScale}px`);
      });
    }

    fitAboutTitle();
    document.fonts.ready.then(fitAboutTitle);

    if ("ResizeObserver" in window) {
      const aboutTitleObserver = new ResizeObserver(fitAboutTitle);
      aboutTitleObserver.observe(aboutTitle);
    } else {
      window.addEventListener("resize", fitAboutTitle);
    }
  }

  /* ========================================
     ANIMAÇÃO DO HERO — MOVIMENTOS DO GIF
  ======================================== */

  const heroArt = document.querySelector(".hero-art");

  if (heroArt) {
    const star = heroArt.querySelector(".hero-art__star--front");
    const bento = heroArt.querySelector(".hero-art__photo--bento");
    const bruxinha = heroArt.querySelector(".hero-art__photo--bruxinha");
    const gatos = heroArt.querySelector(".hero-art__photo--gatos");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let heroVisible = true;
    let elapsed = 0;
    let previousTime = null;
    let frameId = null;

    // O GIF tem 180 quadros de 30 ms: seis ciclos de 900 ms.
    // As amplitudes abaixo foram medidas nos PNGs em movimento no GIF.
    const catCycle = 900;
    const referenceDuration = 5400;

    function easeInOut(value) {
      return value * value * (3 - 2 * value);
    }

    function drawHeroFrame() {
      const referenceTime = elapsed % referenceDuration;
      const catPhase = (referenceTime % catCycle) / catCycle;
      const nod = easeInOut(1 - Math.abs(2 * catPhase - 1));
      const accent = Math.floor(referenceTime / catCycle) === 3 ? nod : 0;
      const offsetX = 34 * accent;
      const offsetY = -7 * accent;

      function placeCat(element, x, y) {
        element.setAttribute(
          "transform",
          `translate(${x.toFixed(3)} ${y.toFixed(3)})`
        );
      }

      placeCat(bento, 4 - 52 * nod + offsetX, -4 - 60 * nod + offsetY);
      placeCat(bruxinha, offsetX, -4 + 86 * nod + offsetY);
      placeCat(gatos, -26 + 66 * nod + offsetX, -24 + 68 * nod + offsetY);

      // Mantém o arco de 200° do GIF e regressa pelo mesmo percurso.
      // O pivô em coordenadas SVG evita uma órbita em torno da página.
      const starPhase = (elapsed % (referenceDuration * 2)) / referenceDuration;
      const starProgress = starPhase <= 1 ? starPhase : 2 - starPhase;
      const angle = 200 * easeInOut(starProgress);

      star.setAttribute("transform", `rotate(${angle.toFixed(3)} 445 470)`);
    }

    function animateHero(time) {
      if (previousTime !== null) {
        elapsed += time - previousTime;
      }

      previousTime = time;
      drawHeroFrame();
      frameId = window.requestAnimationFrame(animateHero);
    }

    function updateHeroAnimation() {
      const paused = document.hidden || reducedMotion.matches || !heroVisible;
      heroArt.dataset.paused = String(paused);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }

      previousTime = null;

      if (reducedMotion.matches) {
        elapsed = 0;
        drawHeroFrame();
      }

      if (!paused) {
        frameId = window.requestAnimationFrame(animateHero);
      }
    }

    if (star && bento && bruxinha && gatos) {
      drawHeroFrame();
      document.addEventListener("visibilitychange", updateHeroAnimation);
      reducedMotion.addEventListener("change", updateHeroAnimation);

      if ("IntersectionObserver" in window) {
        const heroObserver = new IntersectionObserver(([entry]) => {
          heroVisible = entry.isIntersecting;
          updateHeroAnimation();
        });

        heroObserver.observe(heroArt);
      }

      updateHeroAnimation();
    }
  }

  /* ========================================
     CARROSSEL DO PORTFÓLIO
  ======================================== */

  const track = document.querySelector(".portfolio__track");
  const viewport = document.querySelector(".portfolio__viewport");
  const prevButton = document.querySelector(".portfolio__arrow--prev");
  const nextButton = document.querySelector(".portfolio__arrow--next");
  const currentDisplay = document.querySelector(".portfolio__current");
  const totalDisplay = document.querySelector(".portfolio__total");

  if (
    track &&
    viewport &&
    prevButton &&
    nextButton &&
    currentDisplay &&
    totalDisplay
  ) {

    const cards = Array.from(
      track.querySelectorAll(".project-card")
    );

    let currentIndex = 0;

    /* NÚMERO DE CARTÕES VISÍVEIS */

    function getVisibleCards() {

      const styles = window.getComputedStyle(track);

      const visible = parseInt(
        styles.getPropertyValue("--visible-cards").trim(),
        10
      );

      return Number.isFinite(visible) && visible > 0
        ? visible
        : 3;

    }

    /* DISTÂNCIA ENTRE OS CARTÕES */

    function getStep() {

      if (cards.length < 2) {
        return cards[0]?.getBoundingClientRect().width || 0;
      }

      return cards[1].offsetLeft - cards[0].offsetLeft;

    }

    /* ÚLTIMA POSIÇÃO POSSÍVEL */

    function getMaxIndex() {

      return Math.max(
        0,
        cards.length - getVisibleCards()
      );

    }

    /* TOTAL DE PÁGINAS */

    function getTotalPages() {

      return Math.max(
        1,
        Math.ceil(cards.length / getVisibleCards())
      );

    }

    /* FORMATAÇÃO DOS NÚMEROS */

    function formatPage(number) {

      return String(number).padStart(2, "0");

    }

    /* ATUALIZAÇÃO DO CARROSSEL */

    function render() {

      const visibleCards = getVisibleCards();
      const maxIndex = getMaxIndex();

      currentIndex = Math.max(
        0,
        Math.min(currentIndex, maxIndex)
      );

      const step = getStep();
      const translate = currentIndex * step;

      track.style.transform =
        `translate3d(-${translate}px, 0, 0)`;

      const currentPage =
        Math.floor(currentIndex / visibleCards) + 1;

      currentDisplay.textContent = formatPage(currentPage);
      totalDisplay.textContent = formatPage(getTotalPages());

    }

    /* AVANÇAR OU RECUAR */

    function move(direction) {

      const visibleCards = getVisibleCards();
      const maxIndex = getMaxIndex();

      if (direction > 0) {

        currentIndex =
          currentIndex >= maxIndex
            ? 0
            : Math.min(
                currentIndex + visibleCards,
                maxIndex
              );

      } else {

        currentIndex =
          currentIndex <= 0
            ? maxIndex
            : Math.max(
                currentIndex - visibleCards,
                0
              );

      }

      render();

    }

    /* BOTÕES */

    prevButton.addEventListener("click", () => {
      move(-1);
    });

    nextButton.addEventListener("click", () => {
      move(1);
    });

    /* GESTOS NO MOBILE — MANTÉM A ROLAGEM VERTICAL E OS TOQUES NOS LINKS */

    const mobileCarousel = window.matchMedia("(max-width: 640px)");
    let gesture = null;
    let suppressClickUntil = 0;

    viewport.addEventListener("pointerdown", (event) => {
      if (
        !mobileCarousel.matches ||
        event.pointerType === "mouse" ||
        !event.isPrimary
      ) {
        gesture = null;
        return;
      }

      suppressClickUntil = 0;
      gesture = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        horizontal: false
      };
    });

    viewport.addEventListener("pointermove", (event) => {
      if (!gesture || gesture.id !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - gesture.x;
      const deltaY = event.clientY - gesture.y;

      if (!gesture.horizontal) {
        if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 12) {
          return;
        }

        if (Math.abs(deltaX) <= Math.abs(deltaY) * 1.25) {
          gesture = null;
          return;
        }

        gesture.horizontal = true;
        viewport.setPointerCapture(event.pointerId);
      }

      if (event.cancelable) {
        event.preventDefault();
      }
    });

    viewport.addEventListener("pointerup", (event) => {
      if (!gesture || gesture.id !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - gesture.x;
      const deltaY = event.clientY - gesture.y;
      const horizontal = gesture.horizontal;
      gesture = null;

      if (horizontal) {
        suppressClickUntil = Date.now() + 400;

        const threshold = Math.max(36, viewport.clientWidth * 0.12);

        if (
          mobileCarousel.matches &&
          Math.abs(deltaX) >= threshold &&
          Math.abs(deltaX) > Math.abs(deltaY) * 1.25
        ) {
          move(deltaX < 0 ? 1 : -1);
        }
      }

      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
    });

    viewport.addEventListener("pointercancel", () => {
      gesture = null;
    });

    viewport.addEventListener("lostpointercapture", (event) => {
      if (event.target === viewport && gesture?.id === event.pointerId) {
        gesture = null;
      }
    });

    viewport.addEventListener("click", (event) => {
      if (event.detail !== 0 && Date.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);

    viewport.addEventListener("keydown", (event) => {
      if (event.target !== viewport) {
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        move(event.key === "ArrowRight" ? 1 : -1);
      }
    });

    /* REDIMENSIONAMENTO */

    window.addEventListener("resize", render);

    /* INICIALIZAÇÃO */

    render();

  }

  /* ========================================
     ALINHAMENTO DO VÍDEO DOS SERVIÇOS
  ======================================== */

  const servicesHeading = document.querySelector(
    ".services__heading"
  );

  const servicesLeft = document.querySelector(
    ".services__left"
  );

  const servicesRight = document.querySelector(
    ".services__right"
  );

  const servicesVideo = document.querySelector(
    ".services__video"
  );

  function alignServicesVideo() {

    if (!servicesLeft || !servicesRight) {
      return;
    }

    const servicesList = servicesLeft.querySelector(
      ".services__list"
    );

    if (!servicesList) {
      return;
    }

    const leftTop =
      servicesLeft.getBoundingClientRect().top;

    const listTop =
      servicesList.getBoundingClientRect().top;

    const offset = Math.max(
      0,
      listTop - leftTop
    );

    servicesRight.style.setProperty(
      "--services-heading-offset",
      `${offset}px`
    );

  }

  if (servicesHeading && servicesRight) {

    alignServicesVideo();

    window.addEventListener(
      "resize",
      alignServicesVideo
    );

    if (
      "ResizeObserver" in window &&
      servicesLeft
    ) {

      const servicesResizeObserver =
        new ResizeObserver(() => {
          alignServicesVideo();
        });

      servicesResizeObserver.observe(
        servicesLeft
      );

    }

  }

  /* ========================================
     REPRODUÇÃO AUTOMÁTICA DO VÍDEO
  ======================================== */

  if (servicesVideo) {

    servicesVideo.muted = true;
    servicesVideo.defaultMuted = true;
    servicesVideo.loop = true;
    servicesVideo.autoplay = true;
    servicesVideo.playsInline = true;
    servicesVideo.controls = false;

    function startServicesVideo() {

      const playPromise = servicesVideo.play();

      if (
        playPromise &&
        typeof playPromise.catch === "function"
      ) {

        playPromise.catch(() => {
          // O navegador poderá bloquear o autoplay.
        });

      }

    }

    if (servicesVideo.readyState >= 2) {

      startServicesVideo();

    } else {

      servicesVideo.addEventListener(
        "loadeddata",
        startServicesVideo,
        { once: true }
      );

    }

    document.addEventListener(
      "visibilitychange",
      () => {

        if (
          !document.hidden &&
          servicesVideo.paused
        ) {
          startServicesVideo();
        }

      }
    );

  }

  /* ========================================
     WHATSAPP
  ======================================== */

  const whatsappLinks = document.querySelectorAll(
    'a[href*="wa.me/351936995533"]'
  );

  const whatsappMessage =
    "Olá! Vi o teu portfólio e gostaria de falar sobre um projeto.";

  whatsappLinks.forEach((link) => {

    link.href =
      "https://wa.me/351936995533?text=" +
      encodeURIComponent(whatsappMessage);

  });

  /* ========================================
     CONFIRMAÇÃO DO FORMULÁRIO
  ======================================== */

  const params = new URLSearchParams(
    window.location.search
  );

  const feedback = document.querySelector(
    ".contact__feedback"
  );

  if (
    params.get("contacto") === "enviado" &&
    feedback
  ) {

    feedback.hidden = false;

  }

});
