import re

with open('src/main.ts', 'r', encoding='utf8') as f:
    code = f.read()

# 1. Replace the arrows definition (remove SMIL, add pure groups)
arrows_pattern = r'<g id="arrow1Group">.*?</g>\s*<g id="arrow2Group" opacity="0">.*?</g>'
new_arrows = """<g id="arrow1Group" style="display: none;">
      <use href="#redArrow" filter="url(#redGlow)" />
    </g>
    <g id="arrow2Group" style="display: none;">
      <use href="#redArrow" filter="url(#redGlow)" />
    </g>"""

code = re.sub(arrows_pattern, new_arrows, code, flags=re.DOTALL)

# 2. Replace the updateCamera logic
tracking_pattern = r'// Camera Tracking Loop.*?updateCamera\(\);'

new_tracking = """// Camera Tracking Loop
        const track1 = document.getElementById('trackPath1') as unknown as SVGPathElement;
        const track2 = document.getElementById('trackPath2') as unknown as SVGPathElement;
        const arrow1 = document.getElementById('arrow1Group');
        const arrow2 = document.getElementById('arrow2Group');
        const totalDuration = 40; // 40 seconds per path
        
        let animTime = 0;
        let lastTime = performance.now();

        function updateCamera(now: number) {
          if (!document.body.contains(svgEl)) return;
          
          let dt = (now - lastTime) / 1000;
          lastTime = now;
          
          if (!isPaused && rb1PanZoomInstance && track1 && track2 && arrow1 && arrow2) {
            animTime += dt;
            const time = animTime % (totalDuration * 2);
            let p, pNext, activeArrow, trackPath;
            
            if (time < totalDuration) {
              activeArrow = arrow1;
              arrow2.style.display = 'none';
              trackPath = track1;
            } else {
              activeArrow = arrow2;
              arrow1.style.display = 'none';
              trackPath = track2;
            }

            activeArrow.style.display = 'block';
            let progress = (time % totalDuration) / totalDuration;
            let len = trackPath.getTotalLength();
            let currentDist = progress * len;
            p = trackPath.getPointAtLength(currentDist);
            
            // Calculate angle
            let nextDist = Math.min(len, currentDist + 1);
            pNext = trackPath.getPointAtLength(nextDist);
            let angle = Math.atan2(pNext.y - p.y, pNext.x - p.x) * (180 / Math.PI);
            
            activeArrow.setAttribute('transform', `translate(${p.x}, ${p.y}) rotate(${angle})`);

            if (p && el) {
              const container = el.parentElement;
              if (container) {
                const cw = container.clientWidth;
                const ch = container.clientHeight;
                const zoom = rb1PanZoomInstance.getTransform().scale;
                
                const panX = (cw / 2) - p.x * zoom;
                const panY = (ch / 2) - p.y * zoom;
                
                rb1PanZoomInstance.moveTo(panX, panY);
              }
            }
          }
          requestAnimationFrame(updateCamera);
        }
        requestAnimationFrame(updateCamera);"""

code = re.sub(tracking_pattern, new_tracking, code, flags=re.DOTALL)

with open('src/main.ts', 'w', encoding='utf8') as f:
    f.write(code)

print("Applied JS animation and perfect pausing/looping!")
