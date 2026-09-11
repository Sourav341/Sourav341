from pathlib import Path
from html import escape

BASE = Path(__file__).resolve().parent
INPUT = BASE / "portrait.txt"
OUTPUT = BASE / "portrait_tspan.txt"

START_X = 32
START_Y = 86
LINE_HEIGHT = 11.6
TRIM_LEFT = 0
TRIM_RIGHT = 0
REMOVE_EMPTY = False

lines = INPUT.read_text(encoding="utf-8", errors="ignore").splitlines()
lines = [line.rstrip() for line in lines]

if REMOVE_EMPTY:
    lines = [line for line in lines if line.strip()]

processed = []
for line in lines:
    if TRIM_RIGHT > 0:
        line = line[:-TRIM_RIGHT]
    if TRIM_LEFT > 0:
        line = line[TRIM_LEFT:]
    processed.append(line)

svg = []
y = START_Y
for line in processed:
    svg.append(
        f'<tspan x="{START_X}" y="{y:.2f}" xml:space="preserve">{escape(line)}</tspan>'
    )
    y += LINE_HEIGHT

OUTPUT.write_text("\n".join(svg) + "\n", encoding="utf-8")
print(f"Generated {len(svg)} tspans.")
