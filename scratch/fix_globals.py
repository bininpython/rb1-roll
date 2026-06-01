import re

with open('src/main.ts', 'r', encoding='utf8') as f:
    code = f.read()

# 1. Add global variables at the top
global_vars = """let rb1PanZoomInstance: any = null;
let globalAnimTime = 0;
let globalAnimLastTime = performance.now();
let globalIsPaused = false;"""

code = code.replace("let rb1PanZoomInstance: any = null;", global_vars)

# 2. Update the pause logic to use globalIsPaused
pause_logic_pattern = r"""let isPaused = false;
        if \(btnPause && iconPause\) \{
          btnPause.onclick = \(\) => \{
            isPaused = !isPaused;
            if \(isPaused\) \{"""

new_pause_logic = """if (btnPause && iconPause) {
          if (globalIsPaused) {
             iconPause.textContent = 'play_arrow';
             btnPause.classList.add('bg-primary/50');
          }
          btnPause.onclick = () => {
            globalIsPaused = !globalIsPaused;
            if (globalIsPaused) {"""

code = re.sub(pause_logic_pattern, new_pause_logic, code)

pause_logic_pattern_2 = r"""isPaused = !isPaused;
            if \(isPaused\) \{
              \(svgEl as SVGSVGElement\)\.pauseAnimations\(\);"""

new_pause_logic_2 = """globalIsPaused = !globalIsPaused;
            if (globalIsPaused) {
              (svgEl as SVGSVGElement).pauseAnimations();"""

# Ensure we catch the isPaused uses
code = code.replace("let isPaused = false;", "")
code = code.replace("isPaused = !isPaused;", "globalIsPaused = !globalIsPaused;")
code = code.replace("if (isPaused) {", "if (globalIsPaused) {")
code = code.replace("if (!isPaused", "if (!globalIsPaused")

# 3. Update updateCamera to use globalAnimTime
camera_logic_pattern = r"""let animTime = 0;
        let lastTime = performance\.now\(\);

        function updateCamera\(now: number\) \{
          if \(!document\.body\.contains\(svgEl\)\) return;
          
          let dt = \(now - lastTime\) / 1000;
          lastTime = now;
          
          if \(!globalIsPaused && rb1PanZoomInstance && track1 && track2 && arrow1 && arrow2\) \{
            animTime \+= dt;
            const time = animTime % \(totalDuration \* 2\);"""

new_camera_logic = """function updateCamera(now: number) {
          if (!document.body.contains(svgEl)) return;
          
          let dt = (now - globalAnimLastTime) / 1000;
          globalAnimLastTime = now;
          
          if (!globalIsPaused && rb1PanZoomInstance && track1 && track2 && arrow1 && arrow2) {
            globalAnimTime += dt;
            const time = globalAnimTime % (totalDuration * 2);"""

code = re.sub(camera_logic_pattern, new_camera_logic, code)

with open('src/main.ts', 'w', encoding='utf8') as f:
    f.write(code)

print("Globals applied!")
