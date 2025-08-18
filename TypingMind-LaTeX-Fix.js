// inline-latex-renderer.js
(function() {
    var katexLoaded = false;
    
    // Load KaTeX once
    if (!window.katex) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.head.appendChild(link);
        
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        script.onload = function() {
            katexLoaded = true;
            processVisible();
        };
        document.head.appendChild(script);
    } else {
        katexLoaded = true;
    }
    
    function processElement(el) {
        if (!katexLoaded || !el || el.getAttribute('data-latex-done')) return;
        
        var text = el.textContent;
        if (!text || text.indexOf('$') === -1) return;
        
        var newHTML = '';
        var lastEnd = 0;
        var changed = false;
        
        while (true) {
            var start = text.indexOf('$', lastEnd);
            if (start === -1) break;
            
            var end = text.indexOf('$', start + 1);
            if (end === -1) break;
            
            changed = true;
            newHTML += text.substring(lastEnd, start);
            
            var math = text.substring(start + 1, end);
            var span = document.createElement('span');
            
            try {
                katex.render(math, span, {throwOnError: false});
                newHTML += span.innerHTML;
            } catch (e) {
                newHTML += '$' + math + '$';
            }
            
            lastEnd = end + 1;
        }
        
        if (changed) {
            newHTML += text.substring(lastEnd);
            el.innerHTML = newHTML;
            el.setAttribute('data-latex-done', 'true');
        }
    }
    
    function processVisible() {
        if (!katexLoaded) return;
        document.querySelectorAll('p:not([data-latex-done]), li:not([data-latex-done])').forEach(processElement);
    }
    
    // Watch for new content with MutationObserver
    var observer = new MutationObserver(function(mutations) {
        var shouldProcess = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        var text = node.textContent || '';
                        if (text.includes('$') || node.tagName === 'P' || node.tagName === 'LI') {
                            shouldProcess = true;
                        }
                    }
                });
            }
        });
        
        if (shouldProcess && katexLoaded) {
            setTimeout(processVisible, 100); // Small delay to let DOM settle
        }
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Initial process after a short delay
    setTimeout(processVisible, 1000);
    
    return;
})();
