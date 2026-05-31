import re

def process_file():
    with open('src/main.ts', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    out_lines = []
    in_render = False
    pos_id = 200
    
    # Let's map sections for RB1_COMPLETA_MAP code generation
    map_code = []

    # Regexes for the function calls
    # rNrForno(x, y, r, str, nx, ny) -> 6 args
    re_rNrForno = re.compile(r'(rNrForno\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,[^,\)]+)(\))')
    
    # dot(x, y, r) -> 3 args
    # Actually dot can be dot(x, y) or dot(x, y, r)
    re_dot = re.compile(r'(dot\([^,]+,[^,]+(?:,[^,\)]+)?)(\))')
    
    # rolerDecap(cx, cy, r, label, sub)
    # rolerDecap(cx, cy, r, label, '')
    re_rolerDecap = re.compile(r'(rolerDecap\([^,]+,[^,]+,[^,]+(?:,[^,]+){0,3})(\))')

    for line in lines:
        if 'function renderRb1Completa' in line:
            in_render = True
            
        if in_render:
            # We want to replace these calls and append posId
            # We only do this if it's not the Forno loop which already has `i` (wait, Forno loop is rNrForno(..., i))
            if 'rNrForno(' in line and ', i)' not in line:
                def repl_rNrForno(match):
                    nonlocal pos_id
                    res = f"{match.group(1)}, {pos_id}{match.group(2)}"
                    map_code.append(f"  {pos_id}: {{ posicao: {pos_id}, nome: 'Rolo {pos_id}', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' }},")
                    pos_id += 1
                    return res
                line = re_rNrForno.sub(repl_rNrForno, line)
                
            if 'dot(' in line:
                def repl_dot(match):
                    nonlocal pos_id
                    # If it's just dot(x,y), we need to add radius before posId?
                    # dot signature: dot(cx, cy, r = 4.5, posId?)
                    # If it's dot(x, y), match.group(1) is dot(x, y
                    # Let's check commas
                    args_count = match.group(1).count(',')
                    if args_count == 1:
                        # dot(x, y) -> add , 4.5, posId
                        res = f"{match.group(1)}, 4.5, {pos_id}{match.group(2)}"
                    else:
                        res = f"{match.group(1)}, {pos_id}{match.group(2)}"
                    map_code.append(f"  {pos_id}: {{ posicao: {pos_id}, nome: 'Rolo {pos_id}', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' }},")
                    pos_id += 1
                    return res
                line = re_dot.sub(repl_dot, line)
                
            if 'rolerDecap(' in line:
                def repl_rolerDecap(match):
                    nonlocal pos_id
                    # rolerDecap(cx, cy, r, label='', sub='', hasStand=true, posId?)
                    # Need to count args
                    args = match.group(1).split(',')
                    c = len(args)
                    res = match.group(1)
                    while c < 7: # ensure it has up to hasStand before adding posId
                        if c == 4: res += ", ''"
                        elif c == 5: res += ", ''"
                        elif c == 6: res += ", true"
                        c += 1
                    res += f", {pos_id})"
                    
                    map_code.append(f"  {pos_id}: {{ posicao: {pos_id}, nome: 'Bobina / Rolo Grande {pos_id}', perimetro: 0, diametroPadrao: 1000, tipo: 'Bobina', secao: 'Geral' }},")
                    pos_id += 1
                    return res
                line = re_rolerDecap.sub(repl_rolerDecap, line)
                
        out_lines.append(line)

    with open('src/main.ts', 'w', encoding='utf-8') as f:
        f.writelines(out_lines)
        
    with open('scratch/map_code.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(map_code))

process_file()
