import re

def main():
    with open('src/main.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix in populateEstoqueSelect
    content = content.replace(
        'const isDecapagem = !isNaN(posVal) && posVal >= 100;',
        'const isDecapagem = !isNaN(posVal) && posVal >= 100 && posVal < 200;'
    )

    # Fix in updateSubModalFields
    update_old = """function updateSubModalFields() {
    const posVal = parseInt(($('inPos') as HTMLSelectElement).value);
    const isDecapagem = !isNaN(posVal) && posVal >= 100 && posVal < 200;"""
    # Note: wait, it might still be posVal >= 100 in the file.
    
    # Let's just use regex or generic replace.
    # Because I might have already replaced it in the first pass!
    # Ah, I replaced ALL occurrences of that string!
    # Let's do it safely.
    
    with open('src/main.ts', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        if 'const isDecapagem = !isNaN(posVal) && posVal >= 100;' in line:
            lines[i] = line.replace('posVal >= 100;', 'posVal >= 100 && posVal < 200;')
        if 'const isDecapagem = pos >= 100;' in line:
            lines[i] = line.replace('pos >= 100;', 'pos >= 100 && pos < 200;')
            
        # Add populateEstoqueSelect to updateSubModalFields
        if 'function updateSubModalFields() {' in line:
            lines[i] = 'function updateSubModalFields() {\n    populateEstoqueSelect();\n'

    # also inside openSubModal(), we might have duplicate populateEstoqueSelect, it's fine.
    
    with open('src/main.ts', 'w', encoding='utf-8') as f:
        f.writelines(lines)

if __name__ == '__main__':
    main()
