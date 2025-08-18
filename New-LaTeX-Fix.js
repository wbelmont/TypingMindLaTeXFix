// inline-latex-renderer.js
(function() {
    console.log('[LaTeX Extension] Starting diagnostic version...');
    
    // First, let's see what's actually on the page
    setTimeout(function() {
        console.log('[LaTeX Extension] Page analysis:');
        
        // Check for math libraries
        console.log('- window.katex exists?', !!window.katex);
        console.log('- window.MathJax exists?', !!window.MathJax);
        console.log('- window.renderMathInElement exists?', !!window.renderMathInElement);
        
        // Find elements with dollar signs
        var allElements = document.querySelectorAll('p, li, span, div');
        var elementsWithDollars = [];
        
        for (var i = 0; i < allElements.length; i++) {
            if (allElements[i].textContent && allElements[i].textContent.indexOf('$') !== -1) {
                elementsWithDollars.push(allElements[i]);
            }
        }
        
        console.log('- Found ' + elementsWithDollars.length + ' elements with $ signs');
        
        if (elementsWithDollars.length > 0) {
            console.log('- First element with $:', elementsWithDollars[0]);
            console.log('- Its HTML:', elementsWithDollars[0].innerHTML);
            console.log('- Its text:', elementsWithDollars[0].textContent);
        }
        
        // Now let's try different rendering approaches
        if (elementsWithDollars.length > 0) {
            var testEl = elementsWithDollars[0];
            var text = testEl.textContent;
            
            // Extract first math expression
            var start = text.indexOf('$');
            var end = text.indexOf('$', start + 1);
            
            if (start !== -1 && end !== -1) {
                var mathContent = text.substring(start + 1, end);
                console.log('- Extracted math:', mathContent);
                
                // Try rendering with different methods
                if (window.katex) {
                    try {
                        var testDiv = document.createElement('div');
                        window.katex.render(mathContent, testDiv);
                        console.log('- KaTeX render successful!');
                        console.log('- Rendered HTML:', testDiv.innerHTML);
                    } catch (e) {
                        console.log('- KaTeX render failed:', e.message);
                    }
                }
                
                if (window.MathJax) {
                    console.log('- MathJax available, config:', window.MathJax.config);
                }
            }
        }
        
        // Check what TypingMind is doing
        console.log('- Checking for TypingMind rendering...');
        var renderedMath = document.querySelectorAll('.katex, .MathJax, mjx-container, .math');
        console.log('- Found ' + renderedMath.length + ' already-rendered math elements');
        if (renderedMath.length > 0) {
            console.log('- Example rendered element:', renderedMath[0]);
        }
        
    }, 2000); // Wait 2 seconds for page to fully load
    
    // Now the actual fix - try multiple approaches
    function tryFix() {
        console.log('[LaTeX Extension] Attempting fix...');
        
        // Approach 1: If MathJax exists, configure and use it
        if (window.MathJax && window.MathJax.startup) {
            console.log('[LaTeX Extension] Configuring MathJax for inline math...');
            
            window.MathJax.config.tex.inlineMath = [['$', '$']];
            window.MathJax.startup.document.clear();
            window.MathJax.startup.document.updateDocument();
            
            if (window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise().then(function() {
                    console.log('[LaTeX Extension] MathJax typeset complete');
                }).catch(function(e) {
                    console.log('[LaTeX Extension] MathJax error:', e);
                });
            }
        }
        
        // Approach 2: If KaTeX exists, manually render
        if (window.katex) {
            console.log('[LaTeX Extension] Using KaTeX...');
            
            var elements = document.querySelectorAll('p, li');
            var processed = 0;
            
            for (var i = 0; i < elements.length; i++) {
                var el = elements[i];
                if (el.getAttribute('data-latex-done')) continue;
                
                var text = el.textContent;
                if (!text || text.indexOf('$') === -1) continue;
                
                // Parse and render
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
                        processed++;
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
            
            console.log('[LaTeX Extension] Processed ' + processed + ' math expressions');
        }
        
        // Approach 3: Load our own KaTeX if needed
        if (!window.katex && !window.MathJax) {
            console.log('[LaTeX Extension] No math library found, loading KaTeX...');
            
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
            document.head.appendChild(link);
            
            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
            script.onload = function() {
                console.log('[LaTeX Extension] KaTeX loaded, retrying...');
                setTimeout(tryFix, 100);
            };
            document.head.appendChild(script);
        }
    }
    
    // Run fix after delay
    setTimeout(tryFix, 3000);
    
    // Also run on interval
    setInterval(tryFix, 5000);
    
})();
