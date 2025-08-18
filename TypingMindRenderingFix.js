(() => {
  if (window.__tm_katex_done) return;
  window.__tm_katex_done = true;

  // Utility functions for injecting CSS and JS
  function injectCSS(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function injectJS(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = callback;
    document.head.appendChild(script);
  }

  // Sanitize text nodes to prepare for rendering
  function sanitizeTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        const parent = node.parentNode;
        if (!parent) return NodeFilter.FILTER_REJECT;

        // Skip tags that should not be processed
        const skipTags = /^(SCRIPT|STYLE|TEXTAREA|CODE|PRE|IFRAME)$/i;
        if (skipTags.test(parent.tagName)) return NodeFilter.FILTER_REJECT;

        // Skip empty or whitespace-only nodes
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let node;
    while ((node = walker.nextNode())) {
      let originalValue = node.nodeValue;

      // Sanitize the text for math rendering
      const sanitizedValue = originalValue
        .replace(/(?<!\\)\$/g, '\\$') // Escape $ that are not already escaped
        .replace(/\\\$/g, '$'); // Unescape already escaped $ for KaTeX rendering

      if (sanitizedValue !== originalValue) node.nodeValue = sanitizedValue;
    }
  }

  // Main rendering function
  function doRender() {
    sanitizeTextNodes(document.body);

    const DELIMITERS = [
      { left: "\\[", right: "\\]", display: true },
      { left: "$$", right: "$$", display: true },
      { left: "\\(", right: "\\)", display: false },
      { left: "$", right: "$", display: false }
    ];
    const IGNORED_TAGS = ['script', 'noscript', 'style', 'textarea', 'pre', 'code'];

    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(document.body, {
          delimiters: DELIMITERS,
          ignoredTags: IGNORED_TAGS
        });
      } catch (e) {
        console.warn('Math rendering failed:', e);
      }
      return;
    }

    // Injecting KaTeX styles and scripts for rendering
    injectCSS('https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css');
    injectJS('https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js', () => {
      injectJS('https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js', () => {
        try {
          window.renderMathInElement(document.body, {
            delimiters: DELIMITERS,
            ignoredTags: IGNORED_TAGS
          });
        } catch (e) {
          console.warn('KaTeX rendering failed:', e);
        }
      });
    });
  }

  // Initial render
  doRender();

  // Observe DOM mutations for dynamic content
  let timer = null;
  const observer = new MutationObserver((mutations) => {
    let addedContent = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes && mutation.addedNodes.length) {
        addedContent = true;
        break;
      }
      if (mutation.type === 'characterData') {
        addedContent = true;
        break;
      }
    }
    if (!addedContent) return;

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      doRender();
      timer = null;
    }, 160);
  });

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
