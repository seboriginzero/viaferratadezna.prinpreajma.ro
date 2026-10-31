/**
 * PRIN PREAJMĂ — Interactivitate Editorială, Accesibilitate & Performanță
 * Destinații: Cetatea Deznei · Via Ferrata Dezna · Stațiunea Moneasa
 */
(function () {
  "use strict";

  document.documentElement.classList.add("js-enabled");

  /* --------------------------------------------------------------------------
   * 1. Măsurare Evenimente (Respectând Consimțământul — fără tracking invaziv)
   * -------------------------------------------------------------------------- */
  window.__ppEvents = window.__ppEvents || [];

  function trackAction(eventName, meta) {
    var payload = {
      event: eventName,
      page: document.body.getAttribute("data-page") || window.location.hostname,
      meta: meta || {},
      timestamp: new Date().toISOString()
    };
    window.__ppEvents.push(payload);
    if (typeof window.plausible === "function" && localStorage.getItem("pp_analytics_consent") === "granted") {
      window.plausible(eventName, { props: payload.meta });
    }
  }

  document.addEventListener("click", function (e) {
    var tracked = e.target.closest("[data-track]");
    if (tracked) {
      trackAction(tracked.getAttribute("data-track"), {
        label: tracked.getAttribute("data-track-label") || tracked.textContent.trim().slice(0, 60),
        href: tracked.getAttribute("href") || ""
      });
    }
  });

  /* --------------------------------------------------------------------------
   * 2. Adaptare Linkuri între Subdomenii pentru Previzualizare Locală & file://
   * -------------------------------------------------------------------------- */
  var isFileProtocol = window.location.protocol === "file:";
  var isLocal =
    isFileProtocol ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".localhost");

  if (isLocal && !window.location.hostname.endsWith(".localhost")) {
    var domainMap = isFileProtocol
      ? {
          "https://cetateadeznei.prinpreajma.ro": "../cetateadeznei/index.html",
          "https://viaferratadezna.prinpreajma.ro": "../viaferratadezna/index.html",
          "https://moneasa.prinpreajma.ro": "../moneasa/index.html"
        }
      : {
          "https://cetateadeznei.prinpreajma.ro": "/cetateadeznei",
          "https://viaferratadezna.prinpreajma.ro": "/viaferratadezna",
          "https://moneasa.prinpreajma.ro": "/moneasa"
        };
    document.querySelectorAll("a[href*='.prinpreajma.ro']").forEach(function (a) {
      var href = a.getAttribute("href");
      Object.keys(domainMap).forEach(function (prodOrigin) {
        if (href.indexOf(prodOrigin) === 0) {
          var rest = href.slice(prodOrigin.length) || "/";
          a.setAttribute("data-canonical-href", href);
          if (isFileProtocol) {
            var hashIdx = rest.indexOf("#");
            var hash = hashIdx !== -1 ? rest.slice(hashIdx) : "";
            a.setAttribute("href", domainMap[prodOrigin] + hash);
          } else {
            if (rest.charAt(0) !== "/" && rest.charAt(0) !== "#") {
              rest = "/" + rest;
            }
            a.setAttribute("href", domainMap[prodOrigin] + (rest === "/" ? "/" : rest));
          }
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
   * 3. Control Mișcare, prefers-reduced-motion & Save-Data
   * -------------------------------------------------------------------------- */
  var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = navigator.connection && navigator.connection.saveData === true;
  var motionToggleBtn = document.querySelector("[data-motion-toggle]");

  function setMotionPaused(paused) {
    document.body.classList.toggle("motion-paused", paused);
    if (motionToggleBtn) {
      motionToggleBtn.setAttribute("aria-pressed", paused ? "true" : "false");
      var labelSpan = motionToggleBtn.querySelector("[data-motion-label]");
      if (labelSpan) {
        labelSpan.textContent = paused ? "Pornește mișcarea ambientală" : "Oprește mișcarea ambientală";
      }
    }
    document.querySelectorAll("video[data-ambient-video]").forEach(function (vid) {
      if (paused) {
        vid.pause();
      } else {
        vid.play().catch(function () {});
      }
    });
  }

  if (prefersReduced || saveData || localStorage.getItem("pp_motion_paused") === "true") {
    setMotionPaused(true);
  }

  if (motionToggleBtn) {
    motionToggleBtn.addEventListener("click", function () {
      var nextState = !document.body.classList.contains("motion-paused");
      localStorage.setItem("pp_motion_paused", nextState ? "true" : "false");
      setMotionPaused(nextState);
    });
  }

  /* Oprire automată a clipurilor ambientale în afara ecranului */
  if ("IntersectionObserver" in window) {
    var ambientObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var vid = entry.target;
          if (!entry.isIntersecting) {
            vid.pause();
          } else if (!document.body.classList.contains("motion-paused") && !prefersReduced && !saveData) {
            vid.play().catch(function () {});
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll("video[data-ambient-video]").forEach(function (v) {
      ambientObserver.observe(v);
    });
  }

  /* --------------------------------------------------------------------------
   * 4. Bară Progres de Lectură & Apariții Discrete la Scroll (Reveal)
   * -------------------------------------------------------------------------- */
  var progressBar = document.querySelector(".reading-progress__bar");
  function updateProgress() {
    if (!progressBar) return;
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
    progressBar.style.width = pct.toFixed(1) + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  if ("IntersectionObserver" in window && !prefersReduced) {
    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* --------------------------------------------------------------------------
   * 5. Comutator Mod Poveste (Rezumat Rapid vs. Povestea Integrală)
   * -------------------------------------------------------------------------- */
  var storyTabs = document.querySelectorAll("[data-story-mode-btn]");
  var storyPanels = document.querySelectorAll("[data-story-mode-panel]");

  storyTabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var targetMode = btn.getAttribute("data-story-mode-btn");
      storyTabs.forEach(function (b) {
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      storyPanels.forEach(function (panel) {
        var match = panel.getAttribute("data-story-mode-panel") === targetMode;
        panel.hidden = !match;
      });
      trackAction("schimbare_mod_lectura", { mode: targetMode });
    });
  });

  /* --------------------------------------------------------------------------
   * 6. Galerie Foto Animată cu Filtre & Lightbox Accesibil (Secțiunea 16)
   * -------------------------------------------------------------------------- */
  document.querySelectorAll("[data-gallery-section]").forEach(function (section) {
    var filterBtns = section.querySelectorAll("[data-filter]");
    var items = Array.from(section.querySelectorAll(".gallery-item"));

    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-filter");
        filterBtns.forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        items.forEach(function (item) {
          var itemCat = item.getAttribute("data-category");
          item.hidden = !(cat === "all" || itemCat === cat);
        });
      });
    });
  });

  var lightbox = document.getElementById("editorial-lightbox");
  if (lightbox) {
    var lbImg = lightbox.querySelector("[data-lb-img]");
    var lbTitle = lightbox.querySelector("[data-lb-title]");
    var lbDesc = lightbox.querySelector("[data-lb-desc]");
    var lbCounter = lightbox.querySelector("[data-lb-counter]");
    var lbClose = lightbox.querySelector("[data-lb-close]");
    var lbPrev = lightbox.querySelector("[data-lb-prev]");
    var lbNext = lightbox.querySelector("[data-lb-next]");
    var lbZoom = lightbox.querySelector("[data-lb-zoom]");

    var activeTriggers = [];
    var currentIndex = 0;
    var lastTrigger = null;

    function renderLightboxSlide(index) {
      if (!activeTriggers.length) return;
      currentIndex = (index + activeTriggers.length) % activeTriggers.length;
      var trig = activeTriggers[currentIndex];
      var fullSrc = trig.getAttribute("data-full-src");
      var title = trig.getAttribute("data-title") || "";
      var desc = trig.getAttribute("data-desc") || "";
      var alt = trig.getAttribute("data-alt") || title;

      lbImg.classList.remove("is-zoomed");
      lbImg.src = fullSrc;
      lbImg.alt = alt;
      lbTitle.textContent = title;
      lbDesc.textContent = desc;
      lbCounter.textContent = (currentIndex + 1) + " / " + activeTriggers.length;
    }

    function openLightbox(triggerBtn) {
      var galleryContainer = triggerBtn.closest(".editorial-gallery") || document;
      activeTriggers = Array.from(
        galleryContainer.querySelectorAll(".gallery-item:not([hidden]) .gallery-item__trigger")
      );
      var idx = activeTriggers.indexOf(triggerBtn);
      if (idx === -1) {
        activeTriggers = [triggerBtn];
        idx = 0;
      }
      lastTrigger = triggerBtn;
      renderLightboxSlide(idx);
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (lbClose) lbClose.focus();
    }

    function closeLightbox() {
      lightbox.setAttribute("aria-hidden", "true");
      lbImg.classList.remove("is-zoomed");
      document.body.style.overflow = "";
      if (lastTrigger && typeof lastTrigger.focus === "function") {
        lastTrigger.focus();
      }
    }

    document.querySelectorAll(".gallery-item__trigger").forEach(function (trig) {
      trig.addEventListener("click", function () {
        openLightbox(trig);
      });
    });

    if (lbClose) lbClose.addEventListener("click", closeLightbox);
    if (lbPrev) lbPrev.addEventListener("click", function () { renderLightboxSlide(currentIndex - 1); });
    if (lbNext) lbNext.addEventListener("click", function () { renderLightboxSlide(currentIndex + 1); });
    if (lbZoom) {
      lbZoom.addEventListener("click", function () {
        lbImg.classList.toggle("is-zoomed");
      });
    }
    if (lbImg) {
      lbImg.addEventListener("click", function () {
        lbImg.classList.toggle("is-zoomed");
      });
    }

    /* Navigare cu tastatura în Lightbox */
    document.addEventListener("keydown", function (e) {
      if (lightbox.getAttribute("aria-hidden") !== "false") return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        renderLightboxSlide(currentIndex + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        renderLightboxSlide(currentIndex - 1);
      } else if (e.key === "z" || e.key === "Z" || e.key === "+") {
        e.preventDefault();
        lbImg.classList.toggle("is-zoomed");
      }
    });

    /* Suport gesturi tactile (swipe stânga/dreapta) */
    var touchStartX = 0;
    lightbox.addEventListener("touchstart", function (e) {
      if (e.changedTouches && e.changedTouches[0]) {
        touchStartX = e.changedTouches[0].screenX;
      }
    }, { passive: true });

    lightbox.addEventListener("touchend", function (e) {
      if (e.changedTouches && e.changedTouches[0]) {
        var dx = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(dx) > 45) {
          if (dx < 0) renderLightboxSlide(currentIndex + 1);
          else renderLightboxSlide(currentIndex - 1);
        }
      }
    }, { passive: true });
  }

  /* --------------------------------------------------------------------------
   * 7. Player Video Premium în Limba Română (Secțiunea 17)
   * -------------------------------------------------------------------------- */
  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return "00:00";
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
  }

  document.querySelectorAll("[data-rm-player]").forEach(function (playerEl) {
    var video = playerEl.querySelector("video");
    if (!video) return;

    var bigPlay = playerEl.querySelector("[data-vp-big-play]");
    var playBtn = playerEl.querySelector("[data-vp-play]");
    var muteBtn = playerEl.querySelector("[data-vp-mute]");
    var volSlider = playerEl.querySelector("[data-vp-volume]");
    var range = playerEl.querySelector("[data-vp-range]");
    var timeEl = playerEl.querySelector("[data-vp-time]");
    var qualitySelect = playerEl.querySelector("[data-vp-quality]");
    var ccBtn = playerEl.querySelector("[data-vp-cc]");
    var pipBtn = playerEl.querySelector("[data-vp-pip]");
    var fsBtn = playerEl.querySelector("[data-vp-fs]");
    var showcase = playerEl.closest(".video-showcase") || document;
    var chapterBtns = showcase.querySelectorAll("[data-chapter-time]");

    function ensureVideoLoaded() {
      if (!video.getAttribute("src")) {
        var defaultSrc = video.getAttribute("data-src-1080") || video.getAttribute("data-src-720");
        if (defaultSrc) {
          video.src = defaultSrc;
          video.load();
        }
      }
    }

    function togglePlay() {
      ensureVideoLoaded();
      if (video.paused || video.ended) {
        video.play().catch(function () {});
      } else {
        video.pause();
      }
    }

    if (bigPlay) bigPlay.addEventListener("click", togglePlay);
    if (playBtn) playBtn.addEventListener("click", togglePlay);
    video.addEventListener("click", togglePlay);

    video.addEventListener("play", function () {
      playerEl.classList.add("is-playing");
      if (playBtn) playBtn.textContent = "Pauză";
    });

    video.addEventListener("pause", function () {
      playerEl.classList.remove("is-playing");
      if (playBtn) playBtn.textContent = "Redă";
    });

    video.addEventListener("timeupdate", function () {
      var dur = video.duration || 12;
      var cur = video.currentTime || 0;
      if (range) range.value = ((cur / dur) * 100).toFixed(1);
      if (timeEl) timeEl.textContent = formatTime(cur) + " / " + formatTime(dur);

      chapterBtns.forEach(function (cBtn) {
        var start = parseFloat(cBtn.getAttribute("data-chapter-time") || "0");
        var end = parseFloat(cBtn.getAttribute("data-chapter-end") || "999");
        cBtn.classList.toggle("is-active", cur >= start && cur < end);
      });
    });

    if (range) {
      range.addEventListener("input", function () {
        ensureVideoLoaded();
        var dur = video.duration || 12;
        video.currentTime = (parseFloat(range.value) / 100) * dur;
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener("click", function () {
        video.muted = !video.muted;
        muteBtn.textContent = video.muted ? "Activare sunet" : "Fără sunet";
      });
    }

    if (volSlider) {
      volSlider.addEventListener("input", function () {
        video.volume = parseFloat(volSlider.value);
        video.muted = video.volume === 0;
        if (muteBtn) muteBtn.textContent = video.muted ? "Activare sunet" : "Fără sunet";
      });
    }

    if (qualitySelect) {
      qualitySelect.addEventListener("change", function () {
        var q = qualitySelect.value;
        var nextSrc = video.getAttribute("data-src-" + q);
        if (nextSrc) {
          var t = video.currentTime || 0;
          var wasPlaying = !video.paused;
          video.src = nextSrc;
          video.currentTime = t;
          if (wasPlaying) video.play().catch(function () {});
        }
      });
    }

    if (ccBtn) {
      ccBtn.addEventListener("click", function () {
        var tracks = video.textTracks;
        if (tracks && tracks.length > 0) {
          var showing = tracks[0].mode === "showing";
          tracks[0].mode = showing ? "hidden" : "showing";
          ccBtn.setAttribute("aria-pressed", showing ? "false" : "true");
          ccBtn.textContent = showing ? "Subtitrări RO: Oprite" : "Subtitrări RO: Active";
        }
      });
    }

    if (pipBtn) {
      if (!("pictureInPictureEnabled" in document)) {
        pipBtn.hidden = true;
      } else {
        pipBtn.addEventListener("click", function () {
          ensureVideoLoaded();
          if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(function () {});
          } else if (video.requestPictureInPicture) {
            video.requestPictureInPicture().catch(function () {});
          }
        });
      }
    }

    if (fsBtn) {
      fsBtn.addEventListener("click", function () {
        if (!document.fullscreenElement) {
          playerEl.requestFullscreen().catch(function () {});
        } else {
          document.exitFullscreen().catch(function () {});
        }
      });
    }

    chapterBtns.forEach(function (cBtn) {
      cBtn.addEventListener("click", function () {
        ensureVideoLoaded();
        var targetTime = parseFloat(cBtn.getAttribute("data-chapter-time") || "0");
        video.currentTime = targetTime;
        video.play().catch(function () {});
      });
    });

    /* Acces complet prin tastatură când playerul are focus */
    playerEl.addEventListener("keydown", function (e) {
      if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT") return;
      if (e.key === " " || e.key === "k" || e.key === "K") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        if (muteBtn) muteBtn.click();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (fsBtn) fsBtn.click();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        ensureVideoLoaded();
        video.currentTime = Math.min(video.duration || 12, (video.currentTime || 0) + 2);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        ensureVideoLoaded();
        video.currentTime = Math.max(0, (video.currentTime || 0) - 2);
      }
    });
  });

  /* --------------------------------------------------------------------------
   * 8. Hartă Încărcată la Cerere (Secțiunea 5 & 19)
   * -------------------------------------------------------------------------- */
  document.querySelectorAll("[data-load-map]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var container = btn.closest(".map-on-demand");
      if (!container) return;
      var src = btn.getAttribute("data-map-src");
      var title = btn.getAttribute("data-map-title") || "Hartă interactivă a zonei";
      var wrap = document.createElement("div");
      wrap.className = "map-on-demand__iframe-wrap";
      var iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.title = title;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      wrap.appendChild(iframe);
      container.innerHTML = "";
      container.appendChild(wrap);
      trackAction("incarcare_harta_la_cerere", { title: title });
    });
  });

  /* --------------------------------------------------------------------------
   * 9. Modul Distribuire pe Pagină (Web Share API + Copiere + Mesaje Editabile)
   * -------------------------------------------------------------------------- */
  document.querySelectorAll("[data-share-hub]").forEach(function (hub) {
    var textarea = hub.querySelector("[data-share-textarea]");
    var presetBtns = hub.querySelectorAll("[data-share-preset]");
    var targetSelect = hub.querySelector("[data-share-target]");
    var webShareBtn = hub.querySelector("[data-web-share-btn]");
    var copyBtn = hub.querySelector("[data-copy-share-btn]");
    var copyUrlOnlyBtn = hub.querySelector("[data-copy-url-btn]");
    var statusEl = hub.querySelector("[data-share-status]");

    function getTargetUrl() {
      if (targetSelect && targetSelect.value) {
        return targetSelect.value;
      }
      var canonical = document.querySelector("link[rel='canonical']");
      return canonical ? canonical.href : window.location.href;
    }

    presetBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        presetBtns.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        if (textarea) {
          textarea.value = btn.getAttribute("data-share-preset");
        }
      });
    });

    if (targetSelect && textarea) {
      targetSelect.addEventListener("change", function () {
        var newUrl = targetSelect.value;
        textarea.value = textarea.value.replace(/https:\/\/[^\s]+/g, newUrl);
      });
    }

    if (webShareBtn) {
      webShareBtn.addEventListener("click", function () {
        var text = textarea ? textarea.value.trim() : document.title;
        var url = getTargetUrl();
        if (navigator.share) {
          navigator
            .share({
              title: document.title,
              text: text,
              url: url
            })
            .then(function () {
              if (statusEl) statusEl.textContent = "Trimis cu succes!";
              trackAction("distribuire_link", { method: "web_share_api", url: url });
            })
            .catch(function () {});
        } else if (copyBtn) {
          copyBtn.click();
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var text = textarea ? textarea.value.trim() : getTargetUrl();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            if (statusEl) statusEl.textContent = "Mesajul și linkul au fost copiate în clipboard!";
            trackAction("distribuire_link", { method: "copy_message", url: getTargetUrl() });
          });
        }
      });
    }

    if (copyUrlOnlyBtn) {
      copyUrlOnlyBtn.addEventListener("click", function () {
        var url = getTargetUrl();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            if (statusEl) statusEl.textContent = "Linkul direct (" + url + ") a fost copiat!";
            trackAction("distribuire_link", { method: "copy_url_only", url: url });
          });
        }
      });
    }
  });
})();
