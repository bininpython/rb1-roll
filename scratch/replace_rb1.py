import os

MAIN_FILE = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
SCRATCH_FILE = r"c:\Users\Usuario\Desktop\forno\scratch\rb1_completa.ts"

with open(MAIN_FILE, 'r', encoding='utf-8') as f:
    main_content = f.read()

with open(SCRATCH_FILE, 'r', encoding='utf-8') as f:
    new_func = f.read()

start_idx = main_content.find("// ===== RB1 COMPLETA — Technical Industrial Diagram =====")
end_idx = main_content.find("function renderAll(){")

if start_idx == -1 or end_idx == -1:
    print(f"Could not find markers in main.ts. Start: {start_idx}, End: {end_idx}")
else:
    # Replace
    new_main = main_content[:start_idx] + new_func + "\n" + main_content[end_idx:]
    
    with open(MAIN_FILE, 'w', encoding='utf-8') as f:
        f.write(new_main)
    print("Replaced renderRb1Completa successfully.")
