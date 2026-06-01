const fs = require('fs');
let code = fs.readFileSync('src/main.ts', 'utf8');

// 1. Change initialZoom from 0.15 to 0.8
code = code.replace(/initialZoom:\s*0\.15,/, 'initialZoom: 0.8,');

// 2. Add trackPath to defs
code = code.replace(
  `<path id="redArrow" d="M -20 -15 L 20 0 L -20 15 Z" fill="#ef4444" stroke="#ffffff" stroke-width="2" />`,
  `<path id="redArrow" d="M -20 -15 L 20 0 L -20 15 Z" fill="#ef4444" stroke="#ffffff" stroke-width="2" />\n      <path id="trackPath1" d="\${stripPath}" />\n      <path id="trackPath2" d="\${pathArrow2}" />`
);

// 3. Add tracking logic right after rb1PanZoomInstance is initialized
const trackingLogic = `
        // Controls
        const btnIn = document.getElementById('btnZoomInCompleta');
        const btnOut = document.getElementById('btnZoomOutCompleta');
        const btnReset = document.getElementById('btnZoomResetCompleta');
        const btnPause = document.getElementById('btnPauseAnimation');
        const iconPause = document.getElementById('iconPauseAnimation');

        let isPaused = false;
        if (btnPause && iconPause) {
          btnPause.onclick = () => {
            isPaused = !isPaused;
            if (isPaused) {
              (svgEl as SVGSVGElement).pauseAnimations();
              iconPause.textContent = 'play_arrow';
              btnPause.classList.add('bg-primary/50');
            } else {
              (svgEl as SVGSVGElement).unpauseAnimations();
              iconPause.textContent = 'pause';
              btnPause.classList.remove('bg-primary/50');
            }
          };
        }

        // Camera Tracking Loop
        const track1 = document.getElementById('trackPath1') as SVGPathElement;
        const track2 = document.getElementById('trackPath2') as SVGPathElement;
        const totalDuration = 40; // matches dur="40s"

        function updateCamera() {
          if (!document.body.contains(svgEl)) return;
          if (!isPaused && rb1PanZoomInstance && track1 && track2) {
            const time = (svgEl as SVGSVGElement).getCurrentTime() % (totalDuration * 2);
            let p;
            if (time < totalDuration) {
              const progress = time / totalDuration;
              p = track1.getPointAtLength(progress * track1.getTotalLength());
            } else {
              const progress = (time - totalDuration) / totalDuration;
              p = track2.getPointAtLength(progress * track2.getTotalLength());
            }

            if (p && el) {
              const container = el.parentElement;
              if (container) {
                const cw = container.clientWidth;
                const ch = container.clientHeight;
                const zoom = rb1PanZoomInstance.getTransform().scale;
                
                // Keep the Y slightly lower so the arrow is in upper-mid screen
                const panX = (cw / 2) - p.x * zoom;
                const panY = (ch / 2) - p.y * zoom;
                
                // Smooth move
                rb1PanZoomInstance.moveTo(panX, panY);
              }
            }
          }
          requestAnimationFrame(updateCamera);
        }
        updateCamera();
`;

code = code.replace(
  /\/\/ Controls\s+const btnIn = document.getElementById\('btnZoomInCompleta'\);\s+const btnOut = document.getElementById\('btnZoomOutCompleta'\);\s+const btnReset = document.getElementById\('btnZoomResetCompleta'\);\s+const btnPause = document.getElementById\('btnPauseAnimation'\);\s+const iconPause = document.getElementById\('iconPauseAnimation'\);\s+if \(btnPause && iconPause\) \{[\s\S]*?\s+if \(btnIn\)/,
  trackingLogic + '\n\n        if (btnIn)'
);

fs.writeFileSync('src/main.ts', code);
console.log('Tracking logic added.');
