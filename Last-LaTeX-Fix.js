// inline-latex-renderer.js
(function() {
    // Don't block extension loading
    setTimeout(function() {
        // Check/load KaTeX
        if (!window.katex) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
            document.head.appendChild(link);
            
            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
            script.onload = startProcessing;
            document.head.appendChild(script);
        } else {
            startProcessing();
        }
    }, 100);
    
    function startProcessing() {
        // Process function
        function processLaTeX() {
            if (!window.katex) return;
            
            var elements = document.querySelectorAll('p, li, span, div');
            
            for (var i = 0; i < elements.length; i++) {
                var el = elements[i];
                
                if (el.getAttribute('data-latex-processed')) continue;
                
                var text = el.textContent;
                if (!text || text.indexOf('$') === -1) continue;
                
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
                    
                    if (start > lastEnd) {
                        var beforeText = text.substring(lastEnd, start);
                        html += beforeText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    }
                    
                    var math = text.substring(start + 1, end);
                    var span = document.createElement('span');
                    
                    try {
                        katex.render(math, span, {
                            throwOnError: false,
                            displayMode: false
                        });
                        html += span.innerHTML;
                    } catch (e) {
                        html += '$' + math + '$';
                    }
                    
                    lastEnd = end + 1;
                }
                
                if (lastEnd < text.length) {
                    var remainingText = text.substring(lastEnd);
                    html += remainingText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                }
                
                if (foundMath) {
                    el.innerHTML = html;
                    el.setAttribute('data-latex-processed', 'true');
                }
            }
        }
        
        // Run immediately then periodically
        processLaTeX();
        setInterval(processLaTeX, 2000);
    }
    
    // Signal that extension loaded successfully
    return true;
})();
