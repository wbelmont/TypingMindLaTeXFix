// inline-latex-renderer.js
(function() {
    // Check if we're actually in TypingMind
    if (typeof window === 'undefined' || !window.TypingMind) {
        console.warn('TypingMind not detected, extension may not work properly');
        return;
    }

    // Function to render LaTeX in text
    function renderLatex(text) {
        if (!text) return text;
        
        // First protect display math blocks from inline processing
        const displayBlocks = [];
        let protectedText = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
            const placeholder = `__DISPLAY_MATH_${displayBlocks.length}__`;
            displayBlocks.push(match);
            return placeholder;
        });
        
        // Process inline math - handle both $...$ patterns
        protectedText = protectedText.replace(/\$([^\$\n]+?)\$/g, (match, math) => {
            // Skip if it's escaped
            if (match.indexOf('\\$') === 0) return match;
            
            try {
                // Return KaTeX-compatible HTML that TypingMind can render
                return `<span class="katex-inline" data-latex="${math.replace(/"/g, '&quot;')}">\\(${math}\\)</span>`;
            } catch (e) {
                console.error('Failed to process inline math:', e);
                return match;
            }
        });
        
        // Restore display blocks
        displayBlocks.forEach((block, i) => {
            protectedText = protectedText.replace(`__DISPLAY_MATH_${i}__`, block);
        });
        
        return protectedText;
    }

    // Override message rendering
    const originalRender = window.TypingMind?.renderMessage || window.renderMessage;
    
    if (originalRender) {
        const newRender = function(message, ...args) {
            if (message && message.content) {
                message.content = renderLatex(message.content);
            }
            return originalRender.call(this, message, ...args);
        };
        
        if (window.TypingMind?.renderMessage) {
            window.TypingMind.renderMessage = newRender;
        }
        if (window.renderMessage) {
            window.renderMessage = newRender;
        }
    }

    // Mutation observer to catch dynamically added content
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.classList?.contains('message-content')) {
                    // Process any text nodes that might contain LaTeX
                    const walker = document.createTreeWalker(
                        node,
                        NodeFilter.SHOW_TEXT,
                        null,
                        false
                    );
                    
                    const textNodes = [];
                    while (walker.nextNode()) {
                        textNodes.push(walker.currentNode);
                    }
                    
                    textNodes.forEach(textNode => {
                        const text = textNode.textContent;
                        if (text && text.includes('$')) {
                            const span = document.createElement('span');
                            span.innerHTML = renderLatex(text);
                            textNode.parentNode.replaceChild(span, textNode);
                            
                            // Trigger KaTeX rendering if available
                            if (window.renderMathInElement || window.katex) {
                                const renderFunc = window.renderMathInElement || 
                                    ((el) => {
                                        el.querySelectorAll('.katex-inline').forEach(span => {
                                            const latex = span.dataset.latex;
                                            if (latex && window.katex) {
                                                katex.render(latex, span, { throwOnError: false });
                                            }
                                        });
                                    });
                                renderFunc(span);
                            }
                        }
                    });
                }
            });
        });
    });

    // Start observing when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    } else {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    console.log('Inline LaTeX renderer extension loaded');
})();
