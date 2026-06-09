"""VDOT lookup tables and pace calculations based on Jack Daniels' Running Formula."""

from __future__ import annotations


# VDOT → race time in seconds (5K, 10K, Half Marathon, Marathon)
VDOT_RACE_TIMES: dict[int, tuple[int, int, int, int]] = {
    30: (30*60+40, 63*60+46, 140*60+33, 298*60+0),
    31: (29*60+51, 62*60+3, 136*60+50, 290*60+18),
    32: (29*60+5, 60*60+26, 133*60+18, 282*60+54),
    33: (28*60+21, 58*60+54, 129*60+56, 275*60+48),
    34: (27*60+39, 57*60+26, 126*60+44, 268*60+58),
    35: (27*60+0, 56*60+3, 123*60+41, 262*60+24),
    36: (26*60+22, 54*60+44, 120*60+46, 256*60+6),
    37: (25*60+46, 53*60+29, 117*60+58, 250*60+0),
    38: (25*60+12, 52*60+17, 115*60+18, 244*60+6),
    39: (24*60+39, 51*60+9, 112*60+43, 238*60+24),
    40: (24*60+8, 50*60+3, 110*60+14, 232*60+54),
    41: (23*60+38, 49*60+0, 107*60+51, 227*60+36),
    42: (23*60+10, 48*60+0, 105*60+33, 222*60+24),
    43: (22*60+43, 47*60+3, 103*60+20, 217*60+24),
    44: (22*60+17, 46*60+8, 101*60+12, 212*60+36),
    45: (21*60+52, 45*60+16, 99*60+8, 207*60+54),
    46: (21*60+28, 44*60+25, 97*60+8, 203*60+24),
    47: (21*60+5, 43*60+37, 95*60+12, 199*60+0),
    48: (20*60+44, 42*60+50, 93*60+20, 194*60+48),
    49: (20*60+23, 42*60+6, 91*60+32, 190*60+42),
    50: (20*60+3, 41*60+24, 89*60+47, 186*60+42),
    51: (19*60+43, 40*60+43, 88*60+6, 182*60+48),
    52: (19*60+25, 40*60+4, 86*60+27, 179*60+0),
    53: (19*60+7, 39*60+27, 84*60+53, 175*60+18),
    54: (18*60+50, 38*60+51, 83*60+21, 171*60+42),
    55: (18*60+33, 38*60+17, 81*60+52, 168*60+12),
    56: (18*60+17, 37*60+44, 80*60+26, 164*60+48),
    57: (18*60+2, 37*60+12, 79*60+2, 161*60+30),
    58: (17*60+47, 36*60+42, 77*60+41, 158*60+18),
    59: (17*60+33, 36*60+13, 76*60+23, 155*60+6),
    60: (17*60+19, 35*60+44, 75*60+6, 152*60+6),
    65: (16*60+9, 33*60+24, 69*60+52, 141*60+12),
    70: (15*60+7, 31*60+18, 65*60+14, 131*60+24),
    75: (14*60+12, 29*60+24, 61*60+6, 122*60+36),
    80: (13*60+24, 27*60+42, 57*60+22, 114*60+42),
    85: (12*60+40, 26*60+8, 53*60+56, 107*60+36),
}

# VDOT → training paces in sec/km: (Easy, Marathon, Threshold, Interval, Repetition)
VDOT_PACES: dict[int, tuple[int, int, int, int, int]] = {
    30: (447, 413, 387, 360, 336),
    32: (429, 396, 371, 345, 322),
    34: (412, 380, 356, 332, 309),
    36: (396, 366, 343, 319, 297),
    38: (381, 352, 330, 307, 286),
    40: (368, 339, 318, 296, 276),
    42: (355, 328, 307, 286, 267),
    44: (343, 316, 297, 277, 258),
    46: (332, 306, 287, 268, 250),
    48: (321, 296, 278, 259, 242),
    50: (311, 287, 269, 251, 235),
    52: (302, 278, 261, 244, 228),
    54: (293, 270, 254, 237, 221),
    56: (284, 263, 247, 230, 215),
    58: (276, 255, 240, 224, 209),
    60: (269, 248, 234, 218, 204),
    65: (252, 233, 219, 204, 191),
    70: (237, 219, 206, 192, 179),
    75: (224, 207, 194, 181, 169),
    80: (212, 196, 184, 171, 160),
    85: (201, 186, 175, 163, 152),
}


def time_str_to_seconds(time_str: str) -> int:
    parts = time_str.strip().split(":")
    if len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    if len(parts) == 2:
        return int(parts[0]) * 60 + int(parts[1])
    return int(parts[0])


def seconds_to_time_str(secs: int) -> str:
    h = secs // 3600
    m = (secs % 3600) // 60
    s = secs % 60
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def seconds_to_pace_str(sec_per_km: float) -> str:
    m = int(sec_per_km // 60)
    s = int(sec_per_km % 60)
    return f"{m}'{s:02d}\"/km"


def estimate_vdot_from_race(distance_km: float, time_seconds: int) -> float:
    col_map = {5: 0, 10: 1, 21.1: 2, 42.2: 3}
    col = None
    for d, c in col_map.items():
        if abs(distance_km - d) / d < 0.1:
            col = c
            break
    if col is None:
        col = 3 if distance_km > 30 else (2 if distance_km > 15 else (1 if distance_km > 7 else 0))

    vdots = sorted(VDOT_RACE_TIMES.keys())
    for i in range(len(vdots) - 1):
        t_low = VDOT_RACE_TIMES[vdots[i]][col]
        t_high = VDOT_RACE_TIMES[vdots[i + 1]][col]
        if t_high <= time_seconds <= t_low:
            ratio = (t_low - time_seconds) / (t_low - t_high)
            return vdots[i] + ratio * (vdots[i + 1] - vdots[i])
    if time_seconds >= VDOT_RACE_TIMES[vdots[0]][col]:
        return float(vdots[0])
    return float(vdots[-1])


def get_training_paces(vdot: float) -> dict[str, str]:
    vdots = sorted(VDOT_PACES.keys())
    v = int(round(vdot))
    if v in VDOT_PACES:
        paces = VDOT_PACES[v]
    else:
        lower = max(k for k in vdots if k <= v)
        upper = min(k for k in vdots if k >= v)
        if lower == upper:
            paces = VDOT_PACES[lower]
        else:
            ratio = (v - lower) / (upper - lower)
            p_low = VDOT_PACES[lower]
            p_high = VDOT_PACES[upper]
            paces = tuple(int(p_low[i] + (p_high[i] - p_low[i]) * ratio) for i in range(5))

    labels = ["easy", "marathon", "threshold", "interval", "repetition"]
    return {label: seconds_to_pace_str(p) for label, p in zip(labels, paces)}


def get_target_vdot(target_time: str, distance_km: float) -> float:
    secs = time_str_to_seconds(target_time)
    return estimate_vdot_from_race(distance_km, secs)
