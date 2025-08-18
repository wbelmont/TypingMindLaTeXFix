// inline-latex-renderer.js
(function() {
    // Load KaTeX if needed
    function ensureKaTeX(callback) {
        if (window.katex) {
            callback();
            return;
        }
        
        // Load KaTeX CSS
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.head.appendChild(link);
        
        // Load KaTeX JS
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        script.onload = function() {
            callback();
        };
        document.head.appendChild(script);
    }
    
    // Process LaTeX in page
    function processLaTeX() {
        if (!window.katex) return;
        
        var elements = document.querySelectorAll('p, li, span, div');
        var processed = 0;
        
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            
            // Skip if already processed
            if (el.getAttribute('data-latex-processed')) continue;
            
            var text = el.textContent;
            if (!text || text.indexOf('$') === -1) continue;
            
            // Only process if element contains just text
            if (el.childNodes.length !== 1 || el.childNodes[0].nodeType !== 3) continue;
            
            var html = '';
            var lastEnd = 0;
            var foundMath = false;
            
            while (true) {
                var start = text.indexOf('$', lastEnd);
                if (start === -1) break;
                
                var end = text.indexOf('$', start + 1);
                if (end === -1) break;
                
                foundMath = true;
                
                // Add text before math
                if (start > lastEnd) {
                    var beforeText = text.substring(lastEnd, start);
                    html += beforeText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                }
                
                // Extract and render math
                var math = text.substring(start + 1, end);
                var span = document.createElement('span');
                
                try {
                    katex.render(math, span, {
                        throwOnError: false,
                        displayMode: false
                    });
                    html += span.innerHTML;
                    processed++;
                } catch (e) {
                    // Fallback to original text if render fails
                    html += '$' + math + '$';
                }
                
                lastEnd = end + 1;
            }
            
            // Add remaining text
            if (lastEnd < text.length) {
                var remainingText = text.substring(lastEnd);
                html += remainingText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
            
            // Update element if we found math
            if (foundMath) {
                el.innerHTML = html;
                el.setAttribute('data-latex-processed', 'true');
            }
        }
        
        return processed;
    }
    
    // Initialize and run
    ensureKaTeX(function() {
        // Process immediately
        processLaTeX();
        
        // Run periodically to catch new content
        setInterval(function() {
            processLaTeX();
        }, 2000);
    });
})();
