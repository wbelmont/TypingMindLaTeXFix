// inline-latex-renderer.js
(function() {
    // Wait a bit then start
    setTimeout(function() {
        tryFix();
        setInterval(tryFix, 5000);
    }, 3000);
    
    function tryFix() {
        // Load KaTeX if needed
        if (!window.katex) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
            document.head.appendChild(link);
            
            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
            script.onload = function() {
                setTimeout(tryFix, 100);
            };
            document.head.appendChild(script);
            return;
        }
        
        // Process with KaTeX
        var elements = document.querySelectorAll('p, li');
        
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            if (el.getAttribute('data-latex-done')) continue;
            
            var text = el.textContent;
            if (!text || text.indexOf('$') === -1) continue;
            
            var newHTML = '';
            var lastEnd = 0;
            
            while (true) {
                var start = text.indexOf('$', lastEnd);
                if (start === -1) break;
                
                var end = text.indexOf('$', start + 1);
                if (end === -1) break;
                
                // Add text before math
                newHTML += text.substring(lastEnd, start);
                
                // Render math
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
            
            // Add remaining text
            newHTML += text.substring(lastEnd);
            
            if (lastEnd > 0) {
                el.innerHTML = newHTML;
                el.setAttribute('data-latex-done', 'true');
            }
        }
    }
})();
