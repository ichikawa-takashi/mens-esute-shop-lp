(() => {
  'use strict';
  const root = document.documentElement;

  /* ---------- 読み込み中の解除（フォント待ち、最大3秒） ---------- */
  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    requestAnimationFrame(() => {
      root.classList.remove('is-loading');
      startFade();
    });
  };
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const kvImg = document.querySelector('.kv__img');
  const kvReady = kvImg && kvImg.decode ? kvImg.decode().catch(() => {}) : Promise.resolve();
  Promise.race([Promise.all([fontsReady, kvReady]), new Promise(r => setTimeout(r, 3000))]).then(() => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', reveal, { once: true });
    } else {
      reveal();
    }
  });
  setTimeout(reveal, 4000); // 念のための強制解除

  // 戻るボタン（bfcache）で途中の状態が出ないように
  window.addEventListener('pageshow', e => {
    if (e.persisted) {
      root.classList.remove('is-loading');
      document.querySelectorAll('[data-fade]').forEach(el => el.classList.add('is-in'));
    }
  });

  /* ---------- フェードアップ（AOS fade-up / once 相当） ---------- */
  function startFade() {
    const items = document.querySelectorAll('[data-fade]');
    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -100px 0px' });
    items.forEach(el => io.observe(el));
  }

  /* ---------- ヘッダー・SP固定CTA ---------- */
  const header = document.querySelector('.site-header');
  const spCta = document.querySelector('.sp-cta');
  const contact = document.getElementById('contact');
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 220);
    if (spCta) {
      const contactTop = contact ? contact.getBoundingClientRect().top : Infinity;
      spCta.classList.toggle('is-show', y > 480 && contactTop > window.innerHeight * 0.6);
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- SPメニュー ---------- */
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('sp-menu');
  const closeBtn = menu.querySelector('.sp-menu__close');
  const setMenu = open => {
    const wasOpen = menu.classList.contains('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) closeBtn.focus({ preventScroll: true });
    else if (wasOpen) toggle.focus({ preventScroll: true });
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('[data-menu-close]').forEach(el => el.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false); });

  /* ---------- FAQ のアコーディオン（高さをゆっくり変えて開閉） ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('details.qa').forEach(d => {
    const summary = d.querySelector('summary');
    const body = d.querySelector('.qa__a');
    let anim = null;
    summary.addEventListener('click', e => {
      if (reduceMotion || !body.animate) return; // 動きを減らす設定では標準の開閉
      e.preventDefault();
      // 閉じているときは 0 から。開閉の途中で押されたときは今の高さから
      const from = d.open ? body.getBoundingClientRect().height : 0;
      if (anim) anim.cancel();
      const opening = !d.open || d.classList.contains('is-closing');
      if (opening) {
        d.classList.remove('is-closing');
        d.open = true;
        const to = body.scrollHeight;
        anim = body.animate({ height: [`${from}px`, `${to}px`], opacity: [from ? 1 : 0, 1] }, { duration: 400, easing: 'ease' });
        anim.onfinish = () => { anim = null; };
      } else {
        d.classList.add('is-closing');
        anim = body.animate({ height: [`${from}px`, '0px'], opacity: [1, 0] }, { duration: 400, easing: 'ease' });
        anim.onfinish = () => { d.open = false; d.classList.remove('is-closing'); anim = null; };
      }
    });
  });

  /* ---------- URL コピー ---------- */
  document.querySelectorAll('[data-copy]').forEach(btn => {
    const label = btn.textContent;
    btn.addEventListener('click', async () => {
      const text = document.querySelector(btn.dataset.copy).textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch {}
        ta.remove();
      }
      btn.textContent = 'コピーしました';
      setTimeout(() => { btn.textContent = label; }, 2000);
    });
  });
})();
