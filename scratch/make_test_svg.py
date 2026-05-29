import os

html_content = '''<html><body><svg width="800" height="800" viewBox="2600 200 400 400" style="background: #111">
    <!-- Corretor 1 -->
    <circle cx="2746" cy="425" r="25" fill="#052e16" stroke="#22c55e" stroke-width="2"/>
    <circle cx="2746" cy="425" r="2" fill="#fff"/>
    
    <!-- BS1 176 -->
    <circle cx="2770" cy="250" r="30" fill="#052e16" stroke="#22c55e" stroke-width="2"/>
    
    <!-- BS1 173 -->
    <circle cx="2860" cy="350" r="30" fill="#052e16" stroke="#22c55e" stroke-width="2"/>
    
    <!-- BS1 174 (pinch) -->
    <circle cx="2888" cy="378" r="10" fill="#052e16" stroke="#22c55e" stroke-width="2"/>
    
    <!-- PATH -->
    <path d="M 2600 450 L 2746 450 A 25 25 0 0 0 2759 446.4 L 2875.6 375.6 A 30 30 0 1 0 2832.1 339.0" fill="none" stroke="#fff" stroke-width="3"/>
    
    <!-- OLD PATH in RED -->
    <path d="M 2600 450 L 2746 450 Q 2786 450 2866.6 379.2" fill="none" stroke="#f00" stroke-width="1" opacity="0.5"/>
</svg></body></html>'''

with open(r"c:\Users\Usuario\Desktop\forno\test_svg.html", "w") as f:
    f.write(html_content)
