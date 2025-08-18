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
                acceptNode: (node) => {
                    // Skip if already processed
                    if (node.parentElement?.classList?.contains('katex')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Only accept if contains dollar signs
                    return node.textContent?.includes('$') ? 
                        NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            }
        );
        
        const textNodes = [];
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }
        
        textNodes.forEach(node => {
            const text = node.textContent;
            if (!text || !text.includes('$')) return;
            
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
            if (!parts.some(p => p.type === 'math')) return;
            
            console.log('[LaTeX Extension] Processing node with parts:', parts);
            
            // Create replacement span
            const span = document.createElement('span');
            span.className = 'latex-processed';
            
            parts.forEach(part => {
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
                        mathSpan.textContent = `$${part.content}$`;
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
        const messages = document.querySelectorAll('p, li, div[class*="message"], div[class*="content"]');
        console.log(`[LaTeX Extension] Processing ${messages.length} potential message elements`);
        
        messages.forEach(msg => {
            if (!msg.classList.contains('latex-processed') && msg.textContent?.includes('$')) {
                renderLatexInElement(msg);
                msg.classList.add('latex-checked');
            }
        });
    }
    
    // Watch for new content
    const observer = new MutationObserver((mutations) => {
        let shouldProcess = false;
        
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const text = node.textContent || '';
                    if (text.includes('$') || node.tagName === 'P' || node.tagName === 'LI') {
                        shouldProcess = true;
                    }
                }
            });
        });
        
        if (shouldProcess) {
            // Debounce processing
            clearTimeout(window.latexProcessTimeout);
            window.latexProcessTimeout = setTimeout(() => {
                ensureKaTeX(() => processAllMessages());
            }, 200);
        }
    });
    
    // Initialize
    ensureKaTeX(() => {
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
    window.addEventListener('load', () => {
        setTimeout(() => {
            ensureKaTeX(() => processAllMessages());
        }, 1000);
    });
})();
