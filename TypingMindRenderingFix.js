// inline-latex-renderer.js
(function() {
    console.log('[LaTeX Extension] Starting...');
    
    // Load KaTeX
    if (!window.katex) {
        var css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.head.appendChild(css);
        
        var js = document.createElement('script');
        js.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        js.onload = init;
        document.head.appendChild(js);
    } else {
        init();
    }
    
    function init() {
        console.log('[LaTeX Extension] KaTeX ready');
        
        // Process function
        function processPage() {
            var elements = document.querySelectorAll('p, li, span, div');
            
            for (var i = 0; i < elements.length; i++) {
                var el = elements[i];
                
                // Skip if already processed
                if (el.getAttribute('data-latex-processed')) continue;
                
                // Check for dollar signs in text
                if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                    var text = el.childNodes[0].nodeValue;
                    if (text && text.indexOf('$') !== -1) {
                        processText(el, text);
                    }
                }
            }
        }
        
        function processText(element, text) {
            console.log('[LaTeX Extension] Processing:', text.substring(0, 50));
            
            var html = '';
            var pos = 0;
            var start = text.indexOf('$', pos);
            
            while (start !== -1) {
                // Add text before $
                if (start > pos) {
                    html += escapeHtml(text.substring(pos, start));
                }
                
                // Find closing $
                var end = text.indexOf('$', start + 1);
                if (end === -1) break;
                
                // Extract math
                var math = text.substring(start + 1, end);
                console.log('[LaTeX Extension] Rendering math:', math);
                
                // Render with KaTeX
                try {
                    var span = document.createElement('span');
                    katex.render(math, span, {
                        throwOnError: false,
                        displayMode: false
                    });
                    html += span.innerHTML;
                } catch (e) {
                    console.error('[LaTeX Extension] KaTeX error:', e);
                    html += '$' + escapeHtml(math) + '$';
                }
                
                pos = end + 1;
                start = text.indexOf('$', pos);
            }
            
            // Add remaining text
            if (pos < text.length) {
                html += escapeHtml(text.substring(pos));
            }
            
            // Update element
            element.innerHTML = html;
            element.setAttribute('data-latex-processed', 'true');
        }
        
        function escapeHtml(text) {
            var div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Run immediately
        processPage();
        
        // Run periodically
        setInterval(processPage, 1000);
        
        console.log('[LaTeX Extension] Running');
    }
})();
