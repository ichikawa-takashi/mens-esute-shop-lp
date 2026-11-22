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
  const setMenu = open => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('[data-menu-close]').forEach(el => el.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

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
