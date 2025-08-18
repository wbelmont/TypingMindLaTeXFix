// inline-latex-renderer.js
setTimeout(function() {
    if (!window.katex) {
        var s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        s.onload = init;
        document.head.appendChild(s);
        
        var c = document.createElement('link');
        c.rel = 'stylesheet';
        c.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.head.appendChild(c);
    } else {
        init();
    }
    
    function init() {
        setInterval(function() {
            if (!window.katex) return;
            
            document.querySelectorAll('p, li').forEach(function(el) {
                if (el.dataset.latexDone) return;
                var t = el.textContent;
                if (!t || !t.includes('$')) return;
                
                var h = t.replace(/\$([^$]+)\$/g, function(m, math) {
                    var s = document.createElement('span');
                    try {
                        katex.render(math, s, {throwOnError: false});
                        return s.innerHTML;
                    } catch(e) {
                        return m;
                    }
                });
                
                if (h !== t) {
                    el.innerHTML = h;
                    el.dataset.latexDone = '1';
                }
            });
        }, 1500);
    }
}, 10);
