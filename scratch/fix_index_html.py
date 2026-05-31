with open(r"c:\Users\Usuario\Desktop\forno\index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

# delete lines 514 to 708 (inclusive)
del lines[513:708]

with open(r"c:\Users\Usuario\Desktop\forno\index.html", "w", encoding="utf-8") as f:
    f.writelines(lines)
