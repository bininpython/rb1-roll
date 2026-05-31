import re

def main():
    with open('src/main.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # Enrolador 1
    content = content.replace(
        '<text x="${enrX+8}" y="${Y1-35}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">ENROLADOR DE TIRAS</text>',
        '<text x="${enrX+8}" y="${Y1-35}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle" style="pointer-events:none;">ENROLADOR DE TIRAS</text>'
    )
    content = content.replace(
        '<path d="M ${enrX-10} ${Y1-12} L ${enrX} ${Y1-6} L ${enrX+16} ${Y1-6} L ${enrX+26} ${Y1-12}" fill="none" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>',
        '<path d="M ${enrX-10} ${Y1-12} L ${enrX} ${Y1-6} L ${enrX+16} ${Y1-6} L ${enrX+26} ${Y1-12}" fill="none" stroke="#64748b" stroke-width="3" stroke-linecap="round" style="pointer-events:none;"/>'
    )

    # Enrolador 2
    content = content.replace(
        '<text x="${enrE2X+37}" y="${Y2-45}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">ENROLADOR DE TIRAS</text>',
        '<text x="${enrE2X+37}" y="${Y2-45}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle" style="pointer-events:none;">ENROLADOR DE TIRAS</text>'
    )
    content = content.replace(
        '<path d="M ${enrE2X+15} ${Y2-25} Q ${enrE2X+37} ${Y2-5} ${enrE2X+60} ${Y2-25} Q ${enrE2X+37} ${Y2-15} ${enrE2X+15} ${Y2-25}" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>',
        '<path d="M ${enrE2X+15} ${Y2-25} Q ${enrE2X+37} ${Y2-5} ${enrE2X+60} ${Y2-25} Q ${enrE2X+37} ${Y2-15} ${enrE2X+15} ${Y2-25}" fill="#1e293b" stroke="#94a3b8" stroke-width="2" style="pointer-events:none;"/>'
    )

    with open('src/main.ts', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
