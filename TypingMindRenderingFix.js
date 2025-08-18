// inline-latex-renderer.js
(function() {
    console.log('[LaTeX Extension] Initializing...');
    
    // Function to load KaTeX if not already present
    function ensureKaTeX(callback) {
        if (window.katex) {
            callback();
            return;
        }
        
        console.log('[LaTeX Extension] KaTeX not found, loading...');
        
        // Load KaTeX CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.head.appendChild(link);
        
        // Load KaTeX JS
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        script.onload = () => {
            console.log('[LaTeX Extension] KaTeX loaded');
            callback();
        };
        document.head.appendChild(script);
    }
    
    // Function to render LaTeX in an element
    function renderLatexInElement(element) {
        if (!element || !window.katex) return;
        
        // Get all text nodes
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip if already processed
                    if (node.parentElement && node.parentElement.classList && 
                        node.parentElement.classList.contains('katex')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Only accept if contains dollar signs
                    if (node.textContent && node.textContent.indexOf('$') !== -1) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_REJECT;
                }
            }
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        textNodes.forEach(function(node) {
            const text = node.textContent;
            if (!text || text.indexOf('$') === -1) return;
            
            // Split text by $ delimiters and process
            const parts = [];
            let currentPos = 0;
            let inMath = false;
            
            for (let i = 0; i < text.length; i++) {
                if (text[i] === '$') {
                    // Check if it's escaped
                    if (i > 0 && text[i-1] === '\\') continue;
                    
                    // Check for display math $$
                    if (i + 1 < text.length && text[i+1] === '$') {
                        // Skip display math
                        continue;
                    }
                    
                    if (!inMath) {
                        // Starting math mode
                        if (i > currentPos) {
                            parts.push({type: 'text', content: text.slice(currentPos, i)});
                        }
                        currentPos = i + 1;
                        inMath = true;
                    } else {
                        // Ending math mode
                        const mathContent = text.slice(currentPos, i);
                        parts.push({type: 'math', content: mathContent});
                        currentPos = i + 1;
                        inMath = false;
                    }
                }
            }
            
            // Add remaining text
            if (currentPos < text.length) {
                parts.push({type: 'text', content: text.slice(currentPos)});
            }
            
            // Only process if we found math
            const hasMath = parts.some(function(p) { return p.type === 'math'; });
            if (!hasMath) return;
            
            console.log('[LaTeX Extension] Processing node with parts:', parts);
            
            // Create replacement span
            const span = document.createElement('span');
            span.className = 'latex-processed';
            
            parts.forEach(function(part) {
                if (part.type === 'text') {
                    span.appendChild(document.createTextNode(part.content));
                } else if (part.type === 'math') {
                    const mathSpan = document.createElement('span');
                    try {
                        katex.render(part.content, mathSpan, {
                            throwOnError: false,
                            displayMode: false
                        });
                        console.log('[LaTeX Extension] Rendered:', part.content);
                    } catch (e) {
                        console.error('[LaTeX Extension] KaTeX error:', e);
                        mathSpan.textContent = '$' + part.content + '$';
                    }
                    span.appendChild(mathSpan);
                }
            });
            
            // Replace the text node
            node.parentNode.replaceChild(span, node);
        });
    }
    
    // Process all messages
    function processAllMessages() {
        const selectors = 'p, li, div[class*="message"], div[class*="content"]';
        const messages = document.querySelectorAll(selectors);
        console.log('[LaTeX Extension] Processing ' + messages.length + ' potential message elements');
        
        messages.forEach(function(msg) {
            const hasLatex = msg.textContent && msg.textContent.indexOf('$') !== -1;
            const notProcessed = !msg.classList.contains('latex-checked');
            
            if (notProcessed && hasLatex) {
                renderLatexInElement(msg);
                msg.classList.add('latex-checked');
            }
        });
    }
    
    // Watch for new content
    const observer = new MutationObserver(function(mutations) {
        let shouldProcess = false;
        
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const text = node.textContent || '';
                    if (text.indexOf('$') !== -1 || node.tagName === 'P' || node.tagName === 'LI') {
                        shouldProcess = true;
                    }
                }
            });
        });
        
        if (shouldProcess) {
            // Debounce processing
            clearTimeout(window.latexProcessTimeout);
            window.latexProcessTimeout = setTimeout(function() {
                ensureKaTeX(function() { processAllMessages(); });
            }, 200);
        }
    });
    
    // Initialize
    ensureKaTeX(function() {
        // Process existing content
        processAllMessages();
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('[LaTeX Extension] Ready and watching for changes');
    });
    
    // Also process on window load just in case
    window.addEventListener('load', function() {
        setTimeout(function() {
            ensureKaTeX(function() { processAllMessages(); });
        }, 1000);
    });
})();
