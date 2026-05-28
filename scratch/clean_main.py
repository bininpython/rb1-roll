with open(r'c:\Users\Usuario\Desktop\forno\src\main.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = lines[:1408] + lines[2064:]

with open(r'c:\Users\Usuario\Desktop\forno\src\main.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print("main.ts fixed!")
