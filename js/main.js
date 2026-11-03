/**
 * JAVI BEMZ | PORTAFOLIO DE AUTOR
 * "Siempre seremos eternos aprendices."
 * 
 * Controlador de:
 * 1. Pasillo Infinito con Loop Bidireccional Continuo
 * 2. Centrado Exacto de la Imagen Activa (Luz Central)
 * 3. Halo del cursor (Solo Desktop)
 * 4. Filtrado y Navegación Dinámica
 * 5. Modal / Lightbox con WhatsApp Directo (+573208201829)
 */

document.addEventListener("DOMContentLoaded", () => {
  // ========================================================================
  // 1. ESTADO GLOBAL & SELECTORES
  // ========================================================================
  let currentFilter = "all";
  let activeArtworks = [...GALLERY_DATA];
  let activeModalIndex = -1;

  // Pasillo y Controles
  const hallwayViewport = document.getElementById("hallwayViewport");
  const hallwayTrack = document.getElementById("hallwayTrack");
  const currentRoomLabel = document.getElementById("currentRoomLabel");
  const btnScrollLeft = document.getElementById("btnScrollLeft");
  const btnScrollRight = document.getElementById("btnScrollRight");
  const filterTabs = document.querySelectorAll(".filter-tab");
  const cursorHalo = document.getElementById("cursorHalo");

  // Modal
  const artworkModal = document.getElementById("artworkModal");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const btnModalPrev = document.getElementById("btnModalPrev");
  const btnModalNext = document.getElementById("btnModalNext");
  const modalImage = document.getElementById("modalImage");
  const modalRoomTag = document.getElementById("modalRoomTag");
  const modalTitle = document.getElementById("modalTitle");
  const modalSubtitle = document.getElementById("modalSubtitle");
  const modalSpecGrid = document.getElementById("modalSpecGrid");
  const modalDescription = document.getElementById("modalDescription");
  const modalCuratorialNote = document.getElementById("modalCuratorialNote");
  const modalWhatsAppBtn = document.getElementById("modalWhatsAppBtn");

  // Navegación
  const mobileNavToggle = document.getElementById("mobileNavToggle");
  const navMenu = document.getElementById("navMenu");
  const navbar = document.getElementById("navbar");

  // ========================================================================
  // 2. HALO DE LUZ DEL CURSOR (SOLO DESKTOP CON PUNTERO FINO)
  // ========================================================================
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let haloX = mouseX;
  let haloY = mouseY;

  const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (cursorHalo && isFinePointer) {
    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function renderHalo() {
      haloX += (mouseX - haloX) * 0.15;
      haloY += (mouseY - haloY) * 0.15;
      cursorHalo.style.transform = `translate3d(${haloX}px, ${haloY}px, 0)`;
      requestAnimationFrame(renderHalo);
    }
    renderHalo();
  }

  // ========================================================================
  // 3. RENDERIZADO DEL PASILLO CON LOOP BIDIRECCIONAL
  // ========================================================================
  const REPEAT_SETS = 3; // Copias para el loop infinito [Set A, Set B (centro), Set C]
  let singleSetWidth = 0;

  function renderHallway() {
    hallwayTrack.innerHTML = "";

    // Filtrar obras según categoría
    if (currentFilter === "all") {
      activeArtworks = [...GALLERY_DATA];
    } else {
      activeArtworks = GALLERY_DATA.filter(item => item.category === currentFilter);
    }

    if (activeArtworks.length === 0) {
      hallwayTrack.innerHTML = `
        <div style="padding: 4rem; color: var(--text-muted); font-size: 1rem;">
          No hay piezas disponibles en esta sección actualmente.
        </div>`;
      return;
    }

    // Renderizar conjuntos repetidos para el loop infinito
    for (let setIndex = 0; setIndex < REPEAT_SETS; setIndex++) {
      activeArtworks.forEach((artwork, artIndex) => {
        const frame = document.createElement("article");
        frame.className = "museum-frame";
        frame.setAttribute("data-aspect", artwork.aspectRatio || "portrait");
        frame.setAttribute("data-category", artwork.category);
        frame.setAttribute("data-artwork-id", artwork.id);
        frame.setAttribute("data-real-index", artIndex);
        frame.setAttribute("data-set", setIndex);

        let tagsHtml = "";
        if (artwork.category === "tattoo") {
          tagsHtml = `
            <span class="placard-badge badge-gold">${artwork.style}</span>
            <span class="placard-badge">${artwork.status}</span>
          `;
        } else if (artwork.category === "mural") {
          tagsHtml = `
            <span class="placard-badge badge-gold">${artwork.dimensions}</span>
            <span class="placard-badge">${artwork.location.split("•")[0].trim()}</span>
          `;
        } else if (artwork.category === "fine-art") {
          tagsHtml = `
            <span class="placard-badge badge-gold">${artwork.dimensions}</span>
            <span class="placard-badge">${artwork.technique.split("sobre")[0].trim()}</span>
          `;
        }

        const formattedNum = String(artIndex + 1).padStart(2, "0");

        frame.innerHTML = `
          <div class="museum-canvas-wrap" role="button" tabindex="0" aria-label="Ver obra ${artwork.title}">
            <img src="${artwork.image}" alt="${artwork.title}" class="museum-canvas-img" loading="lazy">
            <div class="museum-inspect-overlay">
              <span class="inspect-pill">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                Ver Obra
              </span>
            </div>
          </div>

          <div class="museum-placard">
            <div class="placard-header">
              <span class="placard-code">${artwork.roomCode} #${formattedNum}</span>
              <span>${artwork.year}</span>
            </div>
            <h3 class="placard-title" title="${artwork.title}">${artwork.title}</h3>
            <div class="placard-tags">
              ${tagsHtml}
            </div>
          </div>
        `;

        // Click en la obra abre el Modal
        frame.querySelector(".museum-canvas-wrap").addEventListener("click", () => {
          openArtworkModal(artIndex);
        });

        hallwayTrack.appendChild(frame);
      });
    }

    requestAnimationFrame(() => {
      calculateLoopMetrics();
      centerOnMiddleSet();
      updateSpotlight(true); // Fuerza centrado exacto inicial
    });
  }

  function calculateLoopMetrics() {
    const totalFrames = hallwayTrack.children.length;
    if (totalFrames === 0) return;
    const framesPerSet = activeArtworks.length;
    if (framesPerSet === 0) return;

    const firstInSetB = hallwayTrack.children[framesPerSet];
    const firstInSetA = hallwayTrack.children[0];
    if (firstInSetB && firstInSetA) {
      singleSetWidth = firstInSetB.offsetLeft - firstInSetA.offsetLeft;
    }
  }

  function centerOnMiddleSet() {
    if (singleSetWidth > 0) {
      // Posiciona en el inicio de Set B
      hallwayViewport.scrollLeft = singleSetWidth;
    }
  }

  // ========================================================================
  // 4. CENTRADO EXACTO & SPOTLIGHT ULTRA-PRECISO
  // ========================================================================
  let isTicking = false;
  let currentSpotlightFrame = null;
  let snapTimeout = null;

  function onScrollOrDrag() {
    if (!isTicking) {
      requestAnimationFrame(() => {
        checkInfiniteLoopBoundary();
        updateSpotlight(false);
        isTicking = false;
      });
      isTicking = true;
    }

    // Auto-snap suave al centro exacto cuando el usuario deja de scrollear
    clearTimeout(snapTimeout);
    snapTimeout = setTimeout(() => {
      snapToExactCenter();
    }, 180);
  }

  function checkInfiniteLoopBoundary() {
    if (singleSetWidth <= 0) return;

    const currentScroll = hallwayViewport.scrollLeft;
    // Si nos desplazamos demasiado a la izquierda, saltamos hacia adelante
    if (currentScroll < singleSetWidth * 0.25) {
      hallwayViewport.scrollLeft += singleSetWidth;
    }
    // Si nos desplazamos demasiado a la derecha, saltamos hacia atrás
    else if (currentScroll > singleSetWidth * 1.75) {
      hallwayViewport.scrollLeft -= singleSetWidth;
    }
  }

  // Calcula qué cuadro está en el centro geométrico de la pantalla
  function getClosestCenterFrame() {
    const frames = hallwayTrack.querySelectorAll(".museum-frame");
    if (!frames.length) return null;

    const viewportCenter = hallwayViewport.scrollLeft + (hallwayViewport.clientWidth / 2);
    let closestFrame = null;
    let minDistance = Infinity;

    frames.forEach((frame) => {
      const frameCenter = frame.offsetLeft + (frame.offsetWidth / 2);
      const distance = Math.abs(viewportCenter - frameCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestFrame = frame;
      }
    });

    return closestFrame;
  }

  function updateSpotlight(forceCenter = false) {
    const closestFrame = getClosestCenterFrame();
    if (!closestFrame) return;

    if (closestFrame !== currentSpotlightFrame) {
      if (currentSpotlightFrame) {
        currentSpotlightFrame.classList.remove("spotlight-center");
      }
      closestFrame.classList.add("spotlight-center");
      currentSpotlightFrame = closestFrame;

      const realIndex = parseInt(closestFrame.getAttribute("data-real-index"), 10);
      if (!isNaN(realIndex) && activeArtworks[realIndex]) {
        const item = activeArtworks[realIndex];
        currentRoomLabel.textContent = `CENTRO: ${item.title.toUpperCase()} • ${item.room.toUpperCase()}`;
      }
    }

    if (forceCenter) {
      scrollFrameToExactCenter(closestFrame, false);
    }
  }

  // Desplaza un elemento al centro matemático de la ventana
  function scrollFrameToExactCenter(frame, smooth = true) {
    if (!frame) return;
    const targetLeft = frame.offsetLeft - (hallwayViewport.clientWidth - frame.offsetWidth) / 2;
    hallwayViewport.scrollTo({
      left: targetLeft,
      behavior: smooth ? "smooth" : "auto"
    });
  }

  function snapToExactCenter() {
    if (isDragging) return;
    const closest = getClosestCenterFrame();
    if (closest) {
      scrollFrameToExactCenter(closest, true);
    }
  }

  hallwayViewport.addEventListener("scroll", onScrollOrDrag, { passive: true });

  // ========================================================================
  // 5. NAVEGACIÓN MANUAL (FLECHAS EXACTAS)
  // ========================================================================
  btnScrollLeft.addEventListener("click", () => {
    const current = getClosestCenterFrame();
    if (current && current.previousElementSibling) {
      scrollFrameToExactCenter(current.previousElementSibling, true);
    } else {
      hallwayViewport.scrollBy({ left: -400, behavior: "smooth" });
    }
  });

  btnScrollRight.addEventListener("click", () => {
    const current = getClosestCenterFrame();
    if (current && current.nextElementSibling) {
      scrollFrameToExactCenter(current.nextElementSibling, true);
    } else {
      hallwayViewport.scrollBy({ left: 400, behavior: "smooth" });
    }
  });

  // Arrastre con Mouse
  let isDragging = false;
  let startX = 0;
  let startScrollLeft = 0;
  let hasMoved = false;

  hallwayViewport.addEventListener("mousedown", (e) => {
    isDragging = true;
    hasMoved = false;
    startX = e.pageX - hallwayViewport.offsetLeft;
    startScrollLeft = hallwayViewport.scrollLeft;
    hallwayViewport.style.cursor = "grabbing";
    hallwayViewport.style.scrollSnapType = "none"; // Desactivar snap durante arrastre libre
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const x = e.pageX - hallwayViewport.offsetLeft;
    const walk = (x - startX) * 1.35;
    if (Math.abs(walk) > 5) {
      hasMoved = true;
    }
    hallwayViewport.scrollLeft = startScrollLeft - walk;
    onScrollOrDrag();
  });

  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      hallwayViewport.style.cursor = "grab";
      hallwayViewport.style.scrollSnapType = "x mandatory";
      snapToExactCenter();
    }
  });

  // Mapeo de Scroll Vertical a Horizontal
  hallwayViewport.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      hallwayViewport.scrollLeft += e.deltaY * 1.1;
      onScrollOrDrag();
    }
  }, { passive: false });

  // Soporte Táctil
  let touchStartX = 0;
  let touchStartScroll = 0;

  hallwayViewport.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].pageX;
      touchStartScroll = hallwayViewport.scrollLeft;
    }
  }, { passive: true });

  hallwayViewport.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1) {
      const touchX = e.touches[0].pageX;
      const walk = (touchX - touchStartX) * 1.3;
      hallwayViewport.scrollLeft = touchStartScroll - walk;
      onScrollOrDrag();
    }
  }, { passive: true });

  hallwayViewport.addEventListener("touchend", () => {
    setTimeout(snapToExactCenter, 150);
  }, { passive: true });

  // ========================================================================
  // 6. FILTROS & NAVEGACIÓN
  // ========================================================================
  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const category = tab.getAttribute("data-category");
      setHallwayFilter(category);
    });
  });

  function setHallwayFilter(category) {
    currentFilter = category;

    filterTabs.forEach((t) => {
      const match = t.getAttribute("data-category") === category;
      t.classList.toggle("active", match);
      t.setAttribute("aria-selected", match ? "true" : "false");
    });

    renderHallway();
  }

  // Enlaces del Header
  const navFilterLinks = document.querySelectorAll('.nav-link[data-filter]');
  navFilterLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const filter = link.getAttribute("data-filter");
      if (filter) {
        setHallwayFilter(filter);
      }
      if (navMenu.classList.contains("active")) {
        navMenu.classList.remove("active");
        mobileNavToggle.classList.remove("active");
      }
    });
  });

  // Enlaces de Festivales y Murales Específicos (Atacarte, Chinácota, etc.)
  const festivalButtons = document.querySelectorAll(".festival-pill[data-artwork-id]");
  festivalButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const artworkId = btn.getAttribute("data-artwork-id");
      jumpToSpecificArtwork(artworkId);
    });
  });

  function jumpToSpecificArtwork(artworkId) {
    const targetItem = GALLERY_DATA.find(item => item.id === artworkId);
    if (!targetItem) return;

    // Si el filtro actual no contiene esta obra, cambiamos al filtro correspondiente
    if (currentFilter !== targetItem.category && currentFilter !== "all") {
      setHallwayFilter(targetItem.category);
    }

    // Scroll vertical suave hacia la galería
    const gallerySection = document.getElementById("mi-trabajo");
    if (gallerySection) {
      gallerySection.scrollIntoView({ behavior: "smooth" });
    }

    // Centramos con precisión milimétrica la obra en el pasillo
    setTimeout(() => {
      const targetFrame = hallwayTrack.querySelector(`.museum-frame[data-set="1"][data-artwork-id="${artworkId}"]`)
                       || hallwayTrack.querySelector(`.museum-frame[data-artwork-id="${artworkId}"]`);

      if (targetFrame) {
        scrollFrameToExactCenter(targetFrame, true);

        if (currentSpotlightFrame) {
          currentSpotlightFrame.classList.remove("spotlight-center");
        }
        targetFrame.classList.add("spotlight-center");
        currentSpotlightFrame = targetFrame;
        currentRoomLabel.textContent = `CENTRO: ${targetItem.title.toUpperCase()} • ${targetItem.room.toUpperCase()}`;
      }
    }, 380);
  }

  // ========================================================================
  // 7. MODAL / LIGHTBOX DE OBRA
  // ========================================================================
  function openArtworkModal(realIndex) {
    if (hasMoved) return;
    if (realIndex < 0 || realIndex >= activeArtworks.length) return;

    activeModalIndex = realIndex;
    const item = activeArtworks[realIndex];

    modalImage.src = item.image;
    modalImage.alt = item.title;
    modalRoomTag.textContent = `${item.room.toUpperCase()} • PIEZA #${String(realIndex + 1).padStart(2, "0")}`;
    modalTitle.textContent = item.title;
    modalSubtitle.textContent = item.subtitle || "";

    let specHtml = "";
    if (item.category === "tattoo") {
      specHtml = `
        <div class="modal-spec-item">
          <span class="modal-spec-label">Categoría</span>
          <span class="modal-spec-value">Tatuaje de Autor</span>
        </div>
        <div class="modal-spec-item">
          <span class="modal-spec-label">Estilo</span>
          <span class="modal-spec-value">${item.style}</span>
        </div>
        <div class="modal-spec-item">
          <span class="modal-spec-label">Estado</span>
          <span class="modal-spec-value">${item.status}</span>
        </div>
        <div class="modal-spec-item">
          <span class="modal-spec-label">Zona del Cuerpo</span>
          <span class="modal-spec-value">${item.placement || "Personalizado"}</span>
        </div>
        <div class="modal-spec-item">
          <span class="modal-spec-label">Dimensiones</span>
          <span class="modal-spec-value">${item.dimensions || "Adaptado a anatomía"}</span>
        </div>
        <div class="modal-spec-item">
          <span class="modal-spec-label">Duración</span>
          <span class="modal-spec-value">${item.sessionTime || "1 sesión"}</span>
        </div>
      `;
    } else if (item.category === "mural") {
      specHtml = `
        <div class="modal-spec-item">
          <span class="modal-spec-label">Categoría</span>
          <span class="modal-spec-value">Muralismo Urbano</span>
        </div>
        <div class="modal-spec-item">
          <span class="modal-spec-label">Ubicación</span>
          <span class="modal-spec-value">${item.location}</span>
        </div>
        <div class="modal-spec-item">
          <span class="modal-spec-label">Dimensiones</span>
          <span class="modal-spec-value">${item.dimensions}</span>
        </div>
        <div class="modal-spec-item">
          <span class="modal-spec-label">Técnica</span>
          <span class="modal-spec-value">${item.medium || "Aerosol y pintura mixta"}</span>
        </div>
      `;
    } else if (item.category === "fine-art") {
      specHtml = `
        <div class="modal-spec-item">
          <span class="modal-spec-label">Categoría</span>
          <span class="modal-spec-value">Lienzo / Cuadro (Artes Plásticas UNAL)</span>
        </div>
        <div class="modal-spec-item">
          <span class="modal-spec-label">Técnica</span>
          <span class="modal-spec-value">${item.technique}</span>
        </div>
        <div class="modal-spec-item">
          <span class="modal-spec-label">Soporte y Medidas</span>
          <span class="modal-spec-value">${item.dimensions}</span>
        </div>
        <div class="modal-spec-item">
          <span class="modal-spec-label">Año</span>
          <span class="modal-spec-value">${item.year}</span>
        </div>
      `;
    }

    modalSpecGrid.innerHTML = specHtml;
    modalDescription.textContent = item.description;
    modalCuratorialNote.textContent = `"${item.curatorialNote}"`;

    const message = `Hola Javi Bemz, estuve viendo tu galería y me interesa consultar por la pieza "${item.title}" (${item.categoryLabel} - ${item.dimensions || item.style}) para tatuar algo similar o cotizar un proyecto.`;
    modalWhatsAppBtn.href = `https://wa.me/573208201829?text=${encodeURIComponent(message)}`;

    artworkModal.classList.add("active");
    artworkModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeArtworkModal() {
    artworkModal.classList.remove("active");
    artworkModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    activeModalIndex = -1;
  }

  btnCloseModal.addEventListener("click", closeArtworkModal);

  artworkModal.addEventListener("click", (e) => {
    if (e.target === artworkModal) {
      closeArtworkModal();
    }
  });

  btnModalPrev.addEventListener("click", () => {
    if (activeArtworks.length === 0) return;
    const newIdx = (activeModalIndex - 1 + activeArtworks.length) % activeArtworks.length;
    openArtworkModal(newIdx);
  });

  btnModalNext.addEventListener("click", () => {
    if (activeArtworks.length === 0) return;
    const newIdx = (activeModalIndex + 1) % activeArtworks.length;
    openArtworkModal(newIdx);
  });

  window.addEventListener("keydown", (e) => {
    if (artworkModal.classList.contains("active")) {
      if (e.key === "Escape") closeArtworkModal();
      if (e.key === "ArrowLeft") btnModalPrev.click();
      if (e.key === "ArrowRight") btnModalNext.click();
    }
  });

  // ========================================================================
  // 8. MENÚ MÓVIL Y NAVBAR STICKY
  // ========================================================================
  mobileNavToggle.addEventListener("click", () => {
    mobileNavToggle.classList.toggle("active");
    navMenu.classList.toggle("active");
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNavToggle.classList.remove("active");
      navMenu.classList.remove("active");
    });
  });

  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      navbar.style.background = "rgba(10, 10, 12, 0.98)";
      navbar.style.borderBottomColor = "rgba(244, 244, 246, 0.15)";
    } else {
      navbar.style.background = "var(--bg-glass)";
      navbar.style.borderBottomColor = "var(--border-subtle)";
    }
  });

  // ========================================================================
  // 9. ILUMINACIÓN VERTICAL AL HACER SCROLL (SECCIONES QUE ENTRAN/SALEN)
  // ========================================================================
  const scrollSpotlightItems = document.querySelectorAll(".scroll-spotlight-item");
  if ("IntersectionObserver" in window) {
    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-spotlight");
        } else {
          entry.target.classList.remove("in-spotlight");
        }
      });
    }, {
      root: null,
      rootMargin: "-8% 0px -8% 0px",
      threshold: 0.12
    });

    scrollSpotlightItems.forEach((el) => scrollObserver.observe(el));
  } else {
    scrollSpotlightItems.forEach((el) => el.classList.add("in-spotlight"));
  }

  // ========================================================================
  // 10. INICIALIZACIÓN
  // ========================================================================
  renderHallway();

  const setSafeText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setSafeText("countAll", CURATORIAL_INFO.totalSlots);
  setSafeText("countTattoo", CURATORIAL_INFO.tattooCount);
  setSafeText("countMural", CURATORIAL_INFO.muralCount);
  setSafeText("countArt", CURATORIAL_INFO.fineArtCount);
});
