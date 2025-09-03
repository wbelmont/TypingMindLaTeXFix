(function() {
    // Debounce utility bc we're not savages
    const debounce = (fn, ms) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), ms);
        };
    };
    
    // Cache for processed text -> rendered HTML
    const renderCache = new Map();
    const MAX_CACHE = 500; // LRU-ish behavior
    
    let katexLoaded = false;
    
    // Lazy load KaTeX
    if (!window.katex) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.head.appendChild(link);
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        script.onload = () => {
            katexLoaded = true;
            processVisible();
        };
        document.head.appendChild(script);
    } else {
        katexLoaded = true;
    }
    
    function processElement(el) {
        if (!katexLoaded || !el || el.dataset.latexDone) return;
        
        const text = el.textContent;
        if (!text?.includes('$')) return;
        
        // Check cache first
        if (renderCache.has(text)) {
            el.innerHTML = renderCache.get(text);
            el.dataset.latexDone = 'true';
            return;
        }
        
        // Use regex for SPEED - single pass instead of multiple indexOf
        const pattern = /\$([^$]+)\$/g;
        let match;
        let lastIndex = 0;
        let newHTML = '';
        let changed = false;
        
        while ((match = pattern.exec(text)) !== null) {
            changed = true;
            newHTML += text.substring(lastIndex, match.index);
            
            try {
                // Render inline to avoid DOM creation overhead
                newHTML += katex.renderToString(match[1], {
                    throwOnError: false,
                    displayMode: false
                });
            } catch (e) {
                newHTML += match[0]; // Keep original on error
            }
            
            lastIndex = pattern.lastIndex;
        }
        
        if (changed) {
            newHTML += text.substring(lastIndex);
            
            // Cache management - crude LRU
            if (renderCache.size > MAX_CACHE) {
                const firstKey = renderCache.keys().next().value;
                renderCache.delete(firstKey);
            }
            renderCache.set(text, newHTML);
            
            el.innerHTML = newHTML;
            el.dataset.latexDone = 'true';
        }
    }
    
    // Use IntersectionObserver for viewport-aware processing
    const intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                processElement(entry.target);
                intersectionObserver.unobserve(entry.target);
            }
        });
    }, { rootMargin: '100px' }); // Process slightly before visible
    
    const processVisible = debounce(() => {
        if (!katexLoaded) return;
        
        // Use more specific selector to reduce DOM traversal
        const selector = 'p:not([data-latex-done]), li:not([data-latex-done])';
        const elements = document.querySelectorAll(selector);
        
        // Only process elements in viewport first
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.bottom >= 0 && rect.top <= window.innerHeight + 100) {
                processElement(el);
            } else {
                // Observe off-screen elements
                intersectionObserver.observe(el);
            }
        });
    }, 50); // Debounced to prevent spam
    
    // Optimized mutation observer
    const mutationObserver = new MutationObserver(debounce((mutations) => {
        let needsProcessing = false;
        
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.textContent?.includes('$')) {
                        needsProcessing = true;
                        break;
                    }
                }
            }
            if (needsProcessing) break;
        }
        
        if (needsProcessing && katexLoaded) {
            processVisible();
        }
    }, 100));
    
    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Use requestIdleCallback for initial processing if available
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => processVisible());
    } else {
        setTimeout(processVisible, 100);
    }
})();
