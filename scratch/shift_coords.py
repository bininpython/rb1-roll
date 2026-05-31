import re

file_path = r"c:\Users\Usuario\Desktop\forno\src\main.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We only want to replace numbers >= 8750 that appear after the ENXAGUADOR section.
# Let's find the index of "// Corretor 4"
idx = content.find("lineTo(8750, YM); // Segue direto até o Corretor 4")
if idx == -1:
    print("Could not find the starting point!")
    exit(1)

before = content[:idx]
after = content[idx:]

# Function to add 200 to any number >= 8750
def add_200(match):
    val = int(match.group(0))
    if val >= 8750:
        return str(val + 200)
    return match.group(0)

new_after = re.sub(r'\b\d{4,5}\b', add_200, after)

new_content = before + new_after

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Successfully shifted coordinates by 200 pixels.")
