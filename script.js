
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
     ALINHAMENTO DA ANIMAÇÃO DOS SERVIÇOS
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

  function alignServicesAnimation() {

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

    alignServicesAnimation();

    window.addEventListener(
      "resize",
      alignServicesAnimation
    );

    if (
      "ResizeObserver" in window &&
      servicesLeft
    ) {

      const servicesResizeObserver =
        new ResizeObserver(() => {
          alignServicesAnimation();
        });

      servicesResizeObserver.observe(
        servicesLeft
      );

    }

  }

  /* ========================================
     ANIMAÇÃO DOS SERVIÇOS — REFERÊNCIA: animacao-servico.webm
  ======================================== */

  const servicesAnimation = document.querySelector(".services__animation");

  if (servicesAnimation) {
    const front = servicesAnimation.querySelector(".services__star-front");
    const echo = servicesAnimation.querySelector(".services__star-echo");
    const stars = servicesAnimation.querySelectorAll(".services__stars > use");
    const heads = servicesAnimation.querySelectorAll(".services__head");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sourceFPS = 30000 / 1001;
    const headSizes = [254.8, 262, 230, 219.4];

    // Posições e escalas medidas nos fotogramas 25–175 (um ciclo completo).
    // Cada linha: x/y de Bento, Bruxinha, Iuri e Gatos; escala; rotação.
    // As amostras mantêm também os encolhimentos e as voltas rápidas do vídeo.
    const headSamples = [
      [207.07,211.18,574.58,489.51,214.51,784.61,575.67,955.43,1.0,0],
      [207.07,211.19,574.62,489.44,214.47,784.62,575.61,955.45,1.0,0],
      [207.09,211.1,574.57,489.47,214.5,784.62,575.6,955.46,1.0,0],
      [207.05,211.2,574.53,489.43,214.48,784.59,575.61,955.4,1.0,0],
      [207.09,211.21,574.54,489.4,214.48,784.62,575.53,955.4,1.0,0],
      [207.13,211.21,574.38,489.49,214.45,784.59,575.57,955.42,1.0,0],
      [207.09,211.2,574.4,489.46,214.46,784.59,575.58,955.41,1.0,0],
      [207.08,211.22,574.38,489.49,214.49,784.61,575.57,955.42,1.0,0],
      [207.1,211.21,574.39,489.47,214.49,784.61,575.59,955.41,1.0,0],
      [207.08,211.21,574.39,489.46,214.51,784.62,575.61,955.4,1.0,0],
      [207.09,211.21,574.39,489.46,214.49,784.6,575.61,955.41,1.0,0],
      [207.09,211.21,574.44,489.49,214.49,784.62,575.59,955.41,1.0,0],
      [207.1,211.2,574.4,489.43,214.46,784.62,575.59,955.42,1.0,0],
      [207.12,211.17,574.4,489.46,214.48,784.61,575.59,955.42,1.0,0],
      [207.13,211.17,574.41,489.47,214.49,784.6,575.6,955.42,1.0,0],
      [207.1,211.19,574.4,489.48,214.48,784.62,575.57,955.41,1.0,0],
      [207.1,211.18,574.41,489.46,214.48,784.61,575.59,955.41,1.0,0],
      [207.1,211.18,574.42,489.47,214.48,784.61,575.58,955.41,1.0,0],
      [207.09,211.19,574.39,489.5,214.47,784.63,575.56,955.44,0.9973,0],
      [207.09,211.16,574.45,489.48,214.48,784.58,575.54,955.39,0.9894,-4.86],
      [207.13,211.1,574.44,489.42,214.46,784.54,575.52,955.33,0.9767,-19.03],
      [207.14,211.05,574.54,489.31,214.44,784.48,575.65,955.34,0.9595,-41.92],
      [207.16,210.94,574.51,489.3,214.37,784.53,575.59,955.28,0.9381,-72.93],
      [207.01,210.89,574.41,489.2,214.4,784.38,575.58,955.17,0.9128,-111.45],
      [206.94,210.88,574.36,489.29,214.26,784.43,575.47,955.15,0.8841,-156.87],
      [206.79,210.96,574.21,489.33,214.26,784.49,575.46,955.26,0.8522,-208.62],
      [206.74,211.12,574.2,489.36,214.32,784.61,575.41,955.32,0.8174,-266.07],
      [206.93,211.17,574.39,489.46,214.33,784.64,575.52,955.42,0.7802,-328.63],
      [207.12,211.09,574.46,489.46,214.54,784.57,575.6,955.38,0.7407,-395.69],
      [207.13,210.98,574.44,489.27,214.32,784.45,575.59,955.33,0.6995,-466.67],
      [206.94,210.78,574.14,489.14,214.28,784.43,575.5,955.19,0.6567,-540.95],
      [206.81,211.03,574.24,489.24,214.33,784.6,575.43,955.3,0.6128,-617.93],
      [208.99,215.36,572.26,491.22,216.47,783.05,573.64,951.38,0.568,-697.02],
      [215.16,227.6,566.47,495.67,222.26,778.43,567.88,939.76,0.5227,-777.61],
      [224.62,246.97,556.98,502.32,231.58,771.31,558.41,921.35,0.4773,-859.1],
      [237.15,273.04,544.29,513.71,244.07,761.99,546.01,897.0,0.432,-940.9],
      [252.59,304.96,529.06,526.21,259.29,750.48,530.97,867.2,0.3872,-1022.39],
      [270.53,341.74,509.28,542.34,276.8,737.09,513.71,832.7,0.3433,-1102.98],
      [292.65,387.11,485.33,561.79,296.34,722.28,492.33,790.15,0.3005,-1182.07],
      [318.81,440.8,458.1,583.85,319.61,704.64,466.99,739.79,0.2593,-1259.05],
      [348.01,500.75,428.5,607.78,346.8,684.02,438.66,683.58,0.2198,-1333.33],
      [379.23,564.85,397.44,632.86,376.75,661.3,408.33,623.46,0.1826,-1404.31],
      [411.46,631.05,365.81,658.38,408.35,637.33,377.0,561.38,0.1478,-1471.37],
      [443.7,697.25,334.52,683.6,440.47,612.96,345.65,499.3,0.1159,-1533.93],
      [474.92,761.37,304.48,707.81,471.97,589.06,315.27,439.17,0.0872,-1591.38],
      [504.11,821.33,276.58,730.28,501.72,566.48,286.85,382.94,0.0619,-1643.13],
      [530.27,875.06,251.73,750.29,528.6,546.08,261.39,332.55,0.0405,-1688.55],
      [552.38,920.47,230.82,767.11,551.47,528.72,239.86,289.97,0.0233,-1727.07],
      [569.42,955.49,214.78,780.02,569.21,515.26,223.25,257.13,0.0106,-1758.08],
      [580.39,978.02,204.49,788.29,580.68,506.56,212.57,236.0,0.0027,-1780.97],
      [584.27,985.99,200.86,791.21,584.76,503.46,208.79,228.53,0.0,-1795.14],
      [584.27,985.99,200.86,791.21,584.76,503.46,208.79,228.53,0.0073,-1800.0],
      [584.26,985.97,200.87,791.21,584.74,503.45,208.77,228.53,0.028,-1791.59],
      [584.22,985.93,200.89,791.22,584.69,503.42,208.75,228.53,0.0607,-1767.28],
      [584.17,985.88,200.92,791.23,584.64,503.38,208.71,228.53,0.104,-1728.46],
      [584.13,985.83,200.96,791.24,584.59,503.34,208.67,228.53,0.1562,-1676.51],
      [584.11,985.82,201.0,791.25,584.58,503.33,208.63,228.53,0.216,-1612.8],
      [584.26,985.9,201.04,791.26,584.67,503.37,208.6,228.31,0.2817,-1538.73],
      [584.16,985.96,201.06,791.26,584.64,503.32,208.75,228.5,0.352,-1455.67],
      [584.11,986.05,201.07,791.27,584.63,503.33,208.66,228.57,0.4253,-1365.0],
      [584.17,985.76,200.74,790.88,584.64,503.45,208.61,228.34,0.5,-1268.12],
      [584.26,985.85,200.69,791.09,584.7,503.31,208.65,228.42,0.5748,-1166.4],
      [584.0,986.05,200.55,791.09,584.69,503.52,208.62,228.44,0.648,-1061.22],
      [583.95,985.91,200.58,790.94,584.57,503.4,208.54,228.47,0.7183,-953.97],
      [584.1,985.73,200.7,790.99,584.66,503.3,208.65,228.39,0.784,-846.03],
      [584.29,986.0,200.9,791.26,584.73,503.43,208.75,228.45,0.8438,-738.78],
      [583.98,985.87,200.3,791.11,584.58,503.51,208.51,228.54,0.896,-633.6],
      [584.07,985.74,200.53,790.9,584.54,503.24,208.57,228.38,0.9392,-531.88],
      [584.34,985.8,200.9,790.89,584.87,503.28,208.82,228.4,0.972,-435.0],
      [584.22,986.05,200.91,791.18,584.67,503.49,208.69,228.63,0.9928,-344.33],
      [583.95,985.88,200.56,791.14,584.58,503.46,208.53,228.65,1.0,-261.27],
      [583.99,985.77,200.57,790.89,584.57,503.32,208.59,228.34,1.0,-187.2],
      [584.23,985.66,200.63,790.98,584.7,503.22,208.7,228.38,1.0,-123.49],
      [584.3,985.82,200.8,790.87,584.77,503.24,208.74,228.42,1.0,-71.54],
      [584.26,985.95,200.79,791.09,584.82,503.43,208.68,228.49,1.0,-32.72],
      [584.27,985.99,200.86,791.21,584.76,503.46,208.79,228.53,1.0,-8.41],
      [584.2,985.96,200.93,791.23,584.78,503.4,208.76,228.53,1.0,0.0],
      [584.22,986.04,200.84,791.22,584.77,503.43,208.75,228.53,1.0,0],
      [584.22,986.04,200.87,791.19,584.78,503.42,208.75,228.54,1.0,0],
      [584.22,986.03,200.88,791.21,584.77,503.42,208.75,228.55,1.0,0],
      [584.22,986.03,200.87,791.18,584.76,503.41,208.74,228.56,1.0,0],
      [584.22,986.03,200.87,791.19,584.78,503.45,208.75,228.54,1.0,0],
      [584.21,986.02,200.89,791.2,584.77,503.42,208.74,228.53,1.0,0],
      [584.21,986.03,200.86,791.2,584.77,503.42,208.75,228.54,1.0,0],
      [584.2,986.03,200.88,791.2,584.76,503.43,208.75,228.54,1.0,0],
      [584.2,986.03,200.89,791.2,584.76,503.42,208.75,228.53,1.0,0],
      [584.15,985.83,200.68,790.91,584.73,503.17,208.7,228.28,0.972,-116.97],
      [584.14,986.12,200.72,791.2,584.71,503.47,208.7,228.58,0.896,-327.26],
      [584.05,985.77,200.59,790.95,584.62,503.36,208.61,228.43,0.784,-565.26],
      [584.19,985.78,200.78,790.88,584.72,503.33,208.75,228.37,0.648,-809.39],
      [583.98,986.01,200.74,791.15,584.61,503.42,208.69,228.62,0.5,-1047.72],
      [584.19,985.73,200.74,791.17,584.56,503.32,208.44,228.33,0.352,-1271.07],
      [584.22,985.87,200.76,791.18,584.6,503.43,208.79,228.37,0.216,-1470.87],
      [584.24,985.93,200.78,791.19,584.66,503.45,208.79,228.41,0.104,-1612.99],
      [584.26,985.98,200.81,791.2,584.73,503.46,208.79,228.46,0.028,-1729.02],
      [584.27,985.99,200.86,791.21,584.76,503.46,208.79,228.53,0.0,-1800.0],
      [584.13,975.63,207.35,794.66,576.97,497.7,208.93,237.4,0.0396,-1774.29],
      [583.77,949.75,224.62,803.82,557.49,483.27,209.33,261.32,0.0894,-1729.04],
      [583.28,916.17,249.44,816.95,532.14,464.47,209.93,296.5,0.1467,-1670.15],
      [582.78,882.7,278.62,832.32,506.74,445.6,210.66,339.17,0.2092,-1603.52],
      [582.14,847.79,308.96,848.19,479.54,425.32,211.47,385.53,0.2846,-1510.47],
      [581.54,809.89,337.24,862.85,451.59,404.83,212.3,431.81,0.3584,-1407.36],
      [581.22,772.85,366.12,877.48,423.54,384.19,213.09,474.23,0.4359,-1294.64],
      [580.76,736.15,394.34,892.25,396.09,363.7,213.97,516.43,0.5087,-1174.39],
      [580.13,700.63,421.74,906.99,369.16,343.78,214.65,557.79,0.5831,-1047.87],
      [579.58,666.05,449.01,920.83,342.93,324.43,215.33,597.44,0.6537,-916.6],
      [579.38,633.27,474.37,934.09,318.36,306.04,216.16,635.52,0.7194,-782.4],
      [578.67,602.51,498.24,946.74,295.06,288.96,216.57,670.91,0.7819,-646.65],
      [578.36,574.22,520.05,957.94,273.81,273.08,217.31,703.32,0.8399,-511.27],
      [578.15,549.26,539.95,968.28,254.96,259.09,217.83,732.42,0.8904,-378.69],
      [577.59,527.88,556.14,976.94,238.56,247.2,218.26,757.03,0.9353,-252.5],
      [577.46,510.76,569.23,983.53,225.98,237.61,218.61,776.25,0.968,-137.74],
      [577.48,499.73,578.04,988.24,217.65,231.39,218.99,789.38,0.991,-44.92],
      [577.38,495.74,581.36,990.0,214.44,229.2,219.08,794.26,1.0,-0.0],
      [574.72,493.49,581.33,986.34,214.5,232.94,221.59,795.27,0.9505,-87.56],
      [568.25,488.82,580.87,978.12,214.19,242.41,227.42,798.07,0.8593,-252.43],
      [560.2,482.26,581.05,966.68,214.49,254.87,235.54,801.61,0.7527,-444.53],
      [549.99,474.87,580.73,953.25,214.32,269.87,245.04,806.08,0.6399,-646.63],
      [539.14,466.26,580.42,938.19,214.43,286.3,255.69,810.7,0.5282,-849.72],
      [527.3,457.35,580.26,922.4,214.38,303.98,267.05,816.02,0.4177,-1047.81],
      [515.02,447.63,580.07,905.78,214.44,322.43,278.6,821.09,0.3112,-1235.06],
      [502.1,437.84,579.85,888.75,214.38,341.65,291.22,826.9,0.2181,-1407.19],
      [489.03,427.86,579.62,871.38,214.36,361.23,303.98,832.71,0.1476,-1535.66],
      [475.83,417.75,579.37,853.71,214.34,381.05,316.87,838.55,0.0846,-1650.21],
      [462.53,407.53,579.12,835.82,214.33,401.07,329.84,844.41,0.0338,-1741.46],
      [449.16,397.23,578.85,817.75,214.32,421.21,342.87,850.28,0.0,-1800.0],
      [435.75,386.89,578.58,799.55,214.31,441.44,355.91,856.14,0.0051,-1791.59],
      [422.33,376.53,578.31,781.29,214.3,461.69,368.95,862.0,0.0197,-1767.28],
      [408.93,366.17,578.04,763.03,214.29,481.92,381.93,867.84,0.043,-1728.46],
      [395.58,355.86,577.77,744.81,214.29,502.06,394.84,873.64,0.0741,-1676.51],
      [382.31,345.61,577.51,726.69,214.28,522.07,407.63,879.42,0.1121,-1612.8],
      [369.15,335.46,577.25,708.74,214.28,541.89,420.27,885.14,0.1562,-1538.73],
      [356.13,325.44,577.02,691.0,214.27,561.46,432.72,890.81,0.2056,-1455.67],
      [343.29,315.57,576.79,673.53,214.27,580.74,444.96,896.41,0.2593,-1365.0],
      [330.64,305.89,576.59,656.4,214.27,599.66,456.72,901.86,0.3164,-1268.12],
      [318.22,296.42,576.4,639.64,214.4,617.82,468.51,906.87,0.3762,-1166.4],
      [306.36,287.43,576.26,623.66,214.44,635.46,479.75,912.08,0.4376,-1061.22],
      [294.89,278.7,576.06,608.43,214.33,652.42,490.67,916.99,0.5,-953.97],
      [284.15,270.24,576.06,593.61,214.5,668.71,501.24,921.74,0.5624,-846.03],
      [273.76,262.35,575.55,579.6,214.41,684.51,511.27,926.35,0.6238,-738.78],
      [263.54,254.65,574.9,566.31,214.33,699.49,520.78,930.68,0.6836,-633.6],
      [254.31,247.25,575.21,553.33,214.28,713.49,529.86,934.68,0.7407,-531.88],
      [245.71,240.66,575.25,541.64,214.52,726.52,538.41,938.49,0.7944,-435.0],
      [237.51,234.6,574.97,530.65,214.44,738.89,546.18,942.15,0.8438,-344.33],
      [229.96,228.91,574.77,520.65,214.25,749.82,553.14,945.22,0.8879,-261.27],
      [223.54,223.69,574.47,511.72,214.27,759.46,559.43,947.99,0.9259,-187.2],
      [218.17,219.35,574.7,504.04,214.39,767.83,564.85,950.48,0.957,-123.49],
      [213.58,215.89,574.6,497.95,214.48,774.79,569.43,952.49,0.9803,-71.54],
      [210.1,213.37,574.57,493.32,214.47,780.11,572.78,954.07,0.9949,-32.72],
      [207.89,211.69,574.52,490.55,214.48,783.43,574.87,955.07,1.0,-8.41],
      [207.07,211.18,574.58,489.51,214.51,784.61,575.67,955.43,1.0,0]
    ];

    let elapsed = 0;
    let previousTime = null;
    let frameId = null;
    let visible = false;

    function smoothStep(value) {
      const t = Math.max(0, Math.min(1, value));
      return t * t * (3 - 2 * t);
    }

    function placeStar(element, sourceFrame, phase, speed, center) {
      const angle = phase + speed * sourceFrame;
      const radians = angle * Math.PI / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      const x = center[0] + center[2] * cos + center[4] * sin;
      const y = center[1] + center[3] * cos + center[5] * sin;
      element.setAttribute("transform", `translate(${x} ${y}) rotate(${angle})`);
    }

    function drawServicesFrame() {
      const sourceFrame = reducedMotion.matches ? 25 : elapsed * sourceFPS / 1000;
      const entering = sourceFrame < 25;
      const cycleFrame = entering ? 0 : (sourceFrame - 25) % 150;
      const index = Math.floor(cycleFrame);
      const fraction = cycleFrame - index;
      const a = headSamples[index];
      const b = headSamples[index + 1];
      const sample = (column) => a[column] + (b[column] - a[column]) * fraction;
      const scale = entering ? smoothStep(sourceFrame / 24) : sample(8);
      const angle = entering ? 1800 * smoothStep(sourceFrame / 25) : sample(9);

      // As duas camadas giram continuamente, sem reiniciar na troca das cabeças.
      // Velocidades e deslocamento do eixo medidos na referência a 29,97 fps.
      placeStar(front, sourceFrame, 27.054194, 4.855,
        [209.769397, 232.142337, -3.007818, 9.472170, -9.524699, -3.057833]);
      placeStar(echo, sourceFrame, 26.896787, 6.057,
        [209.895089, 230.244350, -3.298046, 9.129980, -10.084817, -3.921201]);

      const starScale = entering ? smoothStep(sourceFrame / 24) : 1;
      const starOrigins = [[0, 0], [366.841, 270.974], [6.874, 562.114], [363.435, 754.077]];
      stars.forEach((star, i) => {
        const [x, y] = starOrigins[i];
        star.setAttribute("transform",
          `translate(${x + 209.8} ${y + 232.1}) scale(${starScale}) translate(-209.8 -232.1)`);
      });

      heads.forEach((head, i) => {
        const x = entering ? headSamples[0][i * 2] : sample(i * 2);
        const y = entering ? headSamples[0][i * 2 + 1] : sample(i * 2 + 1);
        head.setAttribute("transform",
          `translate(${x} ${y}) rotate(${angle}) scale(${headSizes[i] * scale / 1000})`);
      });
    }

    function animateServices(time) {
      if (previousTime !== null) {
        elapsed += time - previousTime;
      }
      previousTime = time;
      drawServicesFrame();
      frameId = window.requestAnimationFrame(animateServices);
    }

    function updateServicesAnimation() {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
      previousTime = null;
      if (reducedMotion.matches) {
        drawServicesFrame();
      } else if (!document.hidden && visible) {
        frameId = window.requestAnimationFrame(animateServices);
      }
    }

    drawServicesFrame();
    document.addEventListener("visibilitychange", updateServicesAnimation);
    reducedMotion.addEventListener("change", updateServicesAnimation);

    if ("IntersectionObserver" in window) {
      const servicesObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        updateServicesAnimation();
      });
      servicesObserver.observe(servicesAnimation);
    } else {
      visible = true;
      updateServicesAnimation();
    }
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
