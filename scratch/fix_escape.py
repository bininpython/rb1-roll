import os
fpath = r"c:\Users\Usuario\Desktop\forno\scratch\rb1_completa.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("\\`", "`").replace("\\$", "$")

with open(fpath, "w", encoding="utf-8") as f:
    f.write(text)
print("Escapes fixed")
