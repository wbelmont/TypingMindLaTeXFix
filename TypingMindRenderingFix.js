// inline-latex-renderer.js
(function() {
    console.log('[LaTeX Extension] Loading...');
    
    // More aggressive approach - directly modify DOM after it changes
    function processLatexInElement(element) {
        if (!element) return;
        
        // Find all text nodes
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip if already processed or in a script/style tag
                    if (node.parentElement?.classList?.contains('katex') ||
                        node.parentElement?.tagName === 'SCRIPT' ||
                        node.parentElement?.tagName === 'STYLE') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return node.textContent.includes('$') ? 
                        NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            }
        );
        
        const nodesToProcess = [];
        while (walker.nextNode()) {
            nodesToProcess.push(walker.currentNode);
        }
        
        nodesToProcess.forEach(node => {
            const text = node.textContent;
            
            // Check if this actually has LaTeX
            if (!text.match(/\$[^$]+\$/)) return;
            
            // Create a container for the processed content
            const container = document.createElement('span');
            let processedHtml = text;
            
            // Replace inline math $...$ with KaTeX rendered version
            processedHtml = processedHtml.replace(/\$([^$]+)\$/g, (match, latex) => {
                console.log('[LaTeX Extension] Found inline math:', latex);
                
                // Try multiple approaches
                if (window.katex) {
                    try {
                        return window.katex.renderToString(latex, {
                            throwOnError: false,
                            displayMode: false
                        });
                    } catch(e) {
                        console.error('[LaTeX Extension] KaTeX error:', e);
                    }
                }
                
                // Fallback to MathJax-style delimiters
                return `\\(${latex}\\)`;
            });
            
            container.innerHTML = processedHtml;
            node.parentNode.replaceChild(container, node);
            
            // Try to trigger re-rendering
            if (window.MathJax?.typesetPromise) {
                window.MathJax.typesetPromise([container]).catch(console.error);
            } else if (window.renderMathInElement) {
                window.renderMathInElement(container, {
                    delimiters: [
                        {left: '\\(', right: '\\)', display: false},
                        {left: '$', right: '$', display: false}
                    ]
                });
            }
        });
    }
    
    // Watch for ANY changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check if this is a message or contains messages
                    if (node.classList?.contains('message') || 
                        node.querySelector?.('.message') ||
                        node.textContent?.includes('$')) {
                        
                        setTimeout(() => {
                            processLatexInElement(node);
                        }, 100); // Small delay to let TypingMind finish its processing
                    }
                }
            });
        });
    });
    
    // Start observing immediately
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
    
    // Also process existing content
    setTimeout(() => {
        document.querySelectorAll('.message, [class*="message"], [class*="content"]').forEach(el => {
            processLatexInElement(el);
        });
    }, 1000);
    
    // Log what math libraries are available
    console.log('[LaTeX Extension] Available libraries:', {
        katex: typeof window.katex !== 'undefined',
        MathJax: typeof window.MathJax !== 'undefined',
        renderMathInElement: typeof window.renderMathInElement !== 'undefined'
    });
    
    console.log('[LaTeX Extension] Loaded successfully');
})();
