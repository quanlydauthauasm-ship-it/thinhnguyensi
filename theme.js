/* Thịnh Nguyễn SI — giao diện dùng chung cho toàn bộ website.
   - Mặc định nền sáng; nút chuyển sáng/tối lưu lựa chọn trong trình duyệt.
   - Nạp trong <head> (sau script Tailwind nếu trang có dùng) để không bị nháy màu. */
(function () {
  var KEY = 'tn-theme';
  var root = document.documentElement;

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function apply(theme) {
    root.setAttribute('data-theme', theme);
    root.classList.toggle('dark', theme === 'dark');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0f1d' : '#ffffff');
  }

  var theme = saved() === 'dark' ? 'dark' : 'light';
  apply(theme);

  /* Tailwind (bản CDN): cho bảng màu đọc từ biến CSS để đổi theo giao diện sáng/tối */
  if (window.tailwind) {
    var families = ['slate', 'gray', 'red', 'orange', 'amber', 'yellow', 'green', 'emerald', 'teal',
      'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'pink', 'rose'];
    var shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    var neutral = { slate: 1, gray: 1 };
    var v = function (name) { return 'rgb(var(--' + name + ') / <alpha-value>)'; };
    var colors = { white: v('white'), page: v('base') };
    var textColor = {};
    families.forEach(function (f) {
      colors[f] = {};
      shades.forEach(function (s) { colors[f][s] = v(f + '-' + s); });
      if (!neutral[f]) textColor[f] = { 500: v(f + '-500-text') };
    });
    colors.brand = {
      cyan: v('cyan-500'), blue: v('blue-500'), dark: v('gray-950'),
      card: v('slate-900'), border: v('slate-800')
    };
    window.tailwind.config = {
      darkMode: 'class',
      theme: { extend: { colors: colors, textColor: textColor } }
    };
  }

  function setTheme(next) {
    theme = next;
    apply(theme);
    try { localStorage.setItem(KEY, theme); } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    var header = document.querySelector('.tn-header');
    if (!header) return;

    /* Nút chuyển sáng/tối */
    document.querySelectorAll('[data-tn-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () { setTheme(theme === 'dark' ? 'light' : 'dark'); });
    });

    /* Menu trên điện thoại */
    var burger = header.querySelector('.tn-burger');
    var nav = header.querySelector('.tn-nav');
    if (burger && nav) {
      burger.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    /* Menu thả "Công cụ AI" */
    var dd = header.querySelector('.tn-dd');
    var ddBtn = dd && dd.querySelector('.tn-dd-btn');
    function closeDd() {
      if (!dd) return;
      dd.classList.remove('is-open');
      ddBtn.setAttribute('aria-expanded', 'false');
    }
    if (ddBtn) {
      ddBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = dd.classList.toggle('is-open');
        ddBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.addEventListener('click', function (e) { if (!dd.contains(e.target)) closeDd(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDd(); });
    }

    /* Đánh dấu trang hiện tại */
    var here = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.tn-nav a[href], .tn-footer a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || /^(https?:|tel:|mailto:|#)/.test(href)) return;
      var file = href === '/' ? 'index.html' : href.split('/').pop();
      if (file === here) {
        a.setAttribute('aria-current', 'page');
        if (a.closest('.tn-dd-menu') && ddBtn) ddBtn.classList.add('is-current');
      }
    });

    /* Đổ bóng đầu trang khi cuộn */
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 10); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  });
})();
