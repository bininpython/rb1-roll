
import math

def get_tangent(c1, r1, c2, r2, internal=False):
    dx = c2[0] - c1[0]
    dy = c2[1] - c1[1]
    dist = math.hypot(dx, dy)
    if internal:
        dr = r1 + r2
    else:
        dr = r1 - r2
    angle = math.atan2(dy, dx)
    if dist < dr: return None
    theta = math.acos(dr / dist)
    
    # We return the two points
    a1 = angle + theta
    a2 = angle - theta
    if internal:
        return (
            (c1[0] + r1 * math.cos(a1), c1[1] + r1 * math.sin(a1)),
            (c2[0] - r2 * math.cos(a1), c2[1] - r2 * math.sin(a1))
        )
    else:
        return (
            (c1[0] + r1 * math.cos(a1), c1[1] + r1 * math.sin(a1)),
            (c2[0] + r2 * math.cos(a1), c2[1] + r2 * math.sin(a1))
        )

# YM = 450.
C3 = (5800, 485) # Corretor 3 center, r=35, top is 450
C1 = (5950, 550) # r=35
C2 = (6070, 500) # r=35

print(f'Corretor 3: {C3}')
print(f'C1: {C1}')
print(f'C2: {C2}')

# We want tangent from C3 to C1.
# Strip goes OVER C3, UNDER C1. So it leaves C3 at bottom-right, arrives C1 at bottom-left.
# This is an EXTERNAL tangent.
t1 = get_tangent(C3, 35, C1, 35, False)
print(f'Tangent C3 to C1: {t1}')

# We want tangent from C1 to C2.
# Strip goes UNDER C1, OVER C2. So it leaves C1 at top-right, arrives C2 at top-left.
# This is an INTERNAL tangent.
t2 = get_tangent(C1, 35, C2, 35, True)
print(f'Tangent C1 to C2: {t2}')

