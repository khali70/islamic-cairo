// Cairo Walks: GSAP 3.15 + ScrollTrigger + SplitText, Lenis 1.3.
// Recipe numbers follow khalifa-design references/patterns.md.

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const mm = gsap.matchMedia();

// One ScrollTrigger.refresh for any burst of layout changes (fonts, late scene setup)
let refreshTimer;
const queueRefresh = () => {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
};

// Hero video over its own first frame (recipe 11). The still <img> is the LCP element and the whole
// hero on slow links. The video gets a src only after the page has loaded, only on tablets and desktops
// with motion allowed, and only on a connection that can carry it; it fades in once it plays.
const video = document.querySelector('.hero__video');
const toggle = document.querySelector('.hero__toggle');
const videoQuery = matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)');
const STALL_MS = 6000; // not enough data by then: drop the video, keep the still
const MIN_KBPS = 1000;
let started = false;
let gaveUp = false;
let userPaused = false;
let heroVisible = true;
let stall;

// Best real throughput among this page's own downloads (the still, fonts, scripts). Cached files
// have no transfer and tiny ones measure overhead, so both are skipped.
function measuredKbps() {
  let best = 0;
  for (const e of performance.getEntriesByType('resource')) {
    const ms = e.responseEnd - e.responseStart;
    if (e.transferSize > 8000 && ms > 0) best = Math.max(best, (e.transferSize * 8) / ms);
  }
  return best;
}

function connectionIsSlow() {
  const c = navigator.connection;
  if (c?.saveData) return true;
  // A real measurement beats NetInfo: Chromium reports placeholders (3g, rtt 300, 1.3 Mbps) until it
  // has samples, and never samples localhost, so NetInfo alone would block the video on fast links.
  const kbps = measuredKbps();
  if (kbps) return kbps < MIN_KBPS;
  // Everything came from cache: only NetInfo's strong signal counts; the stall timer covers the rest
  return /(^|-)2g$/.test(c?.effectiveType ?? '');
}

function syncVideo() {
  if (!started) return;
  if (videoQuery.matches && heroVisible && !document.hidden && !userPaused) video.play().catch(() => {});
  else video.pause();
  toggle.hidden = !videoQuery.matches || !video.classList.contains('is-playing');
}

function giveUp() {
  clearTimeout(stall);
  gaveUp = true;
  started = false;
  video.pause();
  video.removeAttribute('src');
  video.load();
  video.classList.remove('is-playing');
  toggle.hidden = true;
}

function startVideo() {
  if (started || gaveUp || !videoQuery.matches || connectionIsSlow()) return;
  started = true;
  video.src = innerWidth >= 1280 ? video.dataset.srcLg : video.dataset.srcMd;
  stall = setTimeout(giveUp, STALL_MS);
  video.addEventListener('canplaythrough', () => { clearTimeout(stall); syncVideo(); }, { once: true });
  video.addEventListener('error', giveUp, { once: true });
  video.load();
}

if (video) {
  video.addEventListener('playing', () => {
    clearTimeout(stall);
    video.classList.add('is-playing');
    syncVideo();
  });
  toggle.addEventListener('click', () => {
    userPaused = !userPaused;
    toggle.classList.toggle('is-paused', userPaused);
    toggle.setAttribute('aria-label', userPaused ? 'Play background video' : 'Pause background video');
    syncVideo();
  });
  // Stop decoding while the hero is off screen or the tab is hidden
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    syncVideo();
  }).observe(document.querySelector('.hero'));
  document.addEventListener('visibilitychange', syncVideo);
  videoQuery.addEventListener('change', () => (started ? syncVideo() : document.readyState === 'complete' && startVideo()));
  // Wait for the still, fonts and first-screen images, then an idle moment
  const later = () => (window.requestIdleCallback ? requestIdleCallback(startVideo, { timeout: 2000 }) : setTimeout(startVideo, 300));
  if (document.readyState === 'complete') later();
  else addEventListener('load', later, { once: true });
}

// 5. Expanding cards: one card stays open for touch and keyboard (works with or without motion)
document.querySelectorAll('.cards').forEach((list) => {
  const cards = list.querySelectorAll('.card');
  const activate = (card) => cards.forEach((c) => c.classList.toggle('is-active', c === card));
  cards.forEach((card) => {
    card.addEventListener('pointerenter', () => activate(card));
    card.addEventListener('focus', () => activate(card));
    card.addEventListener('click', () => activate(card));
  });
});

// Request form: no backend yet, so confirm locally and say so
const form = document.querySelector('.join__form');
if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const name = form.elements.namedItem('name').value.trim();
    form.querySelector('.form-status').textContent =
      `Thanks${name ? ', ' + name : ''}. This demo does not send requests yet.`;
    form.reset();
  });
}

mm.add(
  {
    motion: '(prefers-reduced-motion: no-preference)',
    desktop: '(min-width: 768px)',
  },
  (ctx) => {
    const { motion, desktop } = ctx.conditions;
    if (!motion) {
      root.classList.remove('js');
      return;
    }
    root.classList.add('js');

    // 0. Lenis driven by GSAP's ticker so ScrollTrigger and smooth scroll share one loop
    const lenis = new Lenis({ lerp: 0.1, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Hero intro: the giant word rises letter by letter (Latin only). Headline and cards rise in CSS
    // from the first paint (style.css), so they never wait for these libraries on a slow link.
    const word = SplitText.create('.hero__word', { type: 'chars', mask: 'chars' });
    gsap.set('.hero__word', { opacity: 1 });
    gsap.from(word.chars, { yPercent: 105, duration: 1.6, ease: 'expo.out', stagger: 0.07 });

    // The giant word only reads over the first clip's dark sky: it leaves (letters rise out of their
    // masks and fade) as the video's first crossfade starts at 3.5s. No video, no exit: the still keeps it.
    const FIRST_CUT = 3.3;
    const wordOut = () => {
      if (video.currentTime < FIRST_CUT) return;
      video.removeEventListener('timeupdate', wordOut);
      gsap.to(word.chars, { yPercent: -105, opacity: 0, duration: 1.1, ease: 'power2.in', stagger: 0.06, overwrite: 'auto' });
    };
    video?.addEventListener('timeupdate', wordOut);

    // 3. Scale-out hero (signature): the video frame settles into an inset card while the word drifts up
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } })
      .fromTo('.hero__media', { clipPath: 'inset(0% 0% 0% 0% round 0px)' },
        { clipPath: 'inset(9% 5% 15% 5% round 36px)', ease: 'none' }, 0)
      .fromTo('.hero__poster, .hero__video', { scale: 1 }, { scale: 1.12, ease: 'none' }, 0)
      .to('.hero__word', { yPercent: -70, opacity: 0.4, ease: 'none' }, 0)
      .to('.hero__content', { yPercent: 25, opacity: 0, ease: 'none' }, 0);

    // Everything below the hero is built after load, one scene per idle slot, so no setup task blocks
    // the first seconds (Lighthouse TBT). One refresh at the end puts every trigger below the pin.
    const scenes = [];
    const scene = (fn) => scenes.push(fn);
    let idle;
    const whenIdle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1000 }) : setTimeout(fn, 60));
    const nextScene = () => {
      ctx.add(scenes.shift());
      if (scenes.length) idle = whenIdle(nextScene);
      else queueRefresh();
    };
    const startScenes = () => { idle = whenIdle(nextScene); };

    // Walk: the route line draws with the scroll, each star lights as its stop reaches the line tip
    scene(() => gsap.fromTo('.walk__line span', { scaleY: 0 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: '.walk__line', start: 'top 55%', end: 'bottom 55%', scrub: 0.8 },
    }));
    gsap.utils.toArray('.stop').forEach((stop) => scene(() => {
      const dot = stop.querySelector('.stop__dot');
      ScrollTrigger.create({
        trigger: dot, start: 'center 55%',
        onEnter: () => dot.classList.add('is-lit'),
        onLeaveBack: () => dot.classList.remove('is-lit'),
      });
      gsap.from(stop.querySelectorAll('.stop__text > *'), {
        y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: stop, start: 'top 75%', once: true },
      });
      const inset = stop.querySelector('[data-parallax]');
      if (inset) {
        gsap.fromTo(inset, { yPercent: 35 }, {
          yPercent: -25, ease: 'none',
          scrollTrigger: { trigger: stop, start: 'top bottom', end: 'bottom top', scrub: 1 },
        });
      }
    }));

    // 4. Arch reveal: each arch opens upward like a door, the photo settles inside it
    scene(() => gsap.utils.toArray('[data-reveal="rise"]').forEach((el) => {
      const st = { trigger: el, start: 'top 82%', once: true };
      gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out', scrollTrigger: st });
      const img = el.querySelector('img');
      if (img) gsap.from(img, { scale: 1.25, duration: 1.8, ease: 'expo.out', scrollTrigger: { ...st } });
    }));

    // 7. Scene change: the next scene's roofline of Mamluk crenellations rises from the centre out
    scene(() => gsap.utils.toArray('.roofline').forEach((band) => {
      gsap.from(band.querySelectorAll('.merlon'), {
        scaleY: 0, transformOrigin: '50% 100%', ease: 'none',
        stagger: { each: 0.03, from: 'center' },
        scrollTrigger: { trigger: band, start: 'top bottom', end: 'top 50%', scrub: 0.8 },
      });
    }));

    // 6. Al-Muizz gallery: pinned horizontal walk north (desktop only; phones swipe natively)
    if (desktop) scene(() => {
      const section = document.querySelector('[data-scene="hgallery"]');
      const track = section.querySelector('.track');
      const distance = () => Math.max(0, track.scrollWidth - innerWidth);
      const slide = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top top', end: () => '+=' + distance(),
          pin: true, scrub: 1, invalidateOnRefresh: true,
        },
      });
      // Each photo pans inside its arch as the row slides past
      section.querySelectorAll('.tile__img img').forEach((img) => {
        gsap.fromTo(img, { xPercent: -6 }, {
          xPercent: 6, ease: 'none',
          scrollTrigger: { trigger: img.closest('.tile'), containerAnimation: slide, start: 'left right', end: 'right left', scrub: true },
        });
      });
      gsap.fromTo('.muizz__progress span', { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: () => '+=' + distance(), scrub: true, invalidateOnRefresh: true },
      });
    });

    // Good to know: cards rise in sequence
    scene(() => gsap.from('.card', {
      y: 80, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: '.cards', start: 'top 80%', once: true },
    }));

    // Closing doorway: an arch-shaped opening grows until the night photo fills the screen
    scene(() => {
      const door = document.querySelector('[data-scene="door"]');
      const doorST = { trigger: '.join', start: 'top bottom', end: 'top top', scrub: 0.8 };
      gsap.timeline({ scrollTrigger: doorST })
        .fromTo(door, { maskSize: '22% 58%' }, { maskSize: '50% 94%', ease: 'none', duration: 0.65 })
        .to(door, { maskSize: '110% 185%', ease: 'power2.in', duration: 0.35 });
      gsap.fromTo(door.querySelector('img'), { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { ...doorST } });
      gsap.from('.join__form', {
        y: 60, opacity: 0, duration: 1.1, ease: 'expo.out',
        scrollTrigger: { trigger: '.join', start: 'top 30%', once: true },
      });
    });

    // 8. Word reveal on headings (words only, never chars, so Arabic letters stay joined)
    document.querySelectorAll('[data-split]').forEach((el) => scene(() => {
      SplitText.create(el, {
        type: 'words',
        mask: 'words',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.words, {
            yPercent: 110, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06,
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          }),
      });
    }));

    if (document.readyState === 'complete') startScenes();
    else addEventListener('load', startScenes, { once: true });

    return () => {
      removeEventListener('load', startScenes);
      if (window.cancelIdleCallback) cancelIdleCallback(idle); else clearTimeout(idle);
      video?.removeEventListener('timeupdate', wordOut);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }
);

// Recalculate trigger positions once the web fonts have their final size (every image has width and
// height, so late images do not move anything).
document.fonts.ready.then(queueRefresh);
