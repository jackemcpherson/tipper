import json
from collections import defaultdict

NAME = {'GWS Giants': 'Greater Western Sydney'}
v3all = json.load(open('/Users/jackmcpherson/Projects/tipper/configs/predha-080/results-2026-06-12-2641f46f.json'))['matches']
v4all = json.load(open('/Users/jackmcpherson/Projects/tipper/configs/v4-shotoff/results-2026-06-12-7af312c5.json'))['matches']

def score_ours(preds, year, gkey):
    n = tips = 0; mae = 0.0; unmatched = 0
    for m in preds:
        if m['date'][:4] != str(year):
            continue
        g = gkey.get((m['date'], NAME.get(m['home'], m['home'])))
        if g is None:
            unmatched += 1
            continue
        actual = g['hscore'] - g['ascore']
        n += 1; mae += abs(m['predictedMargin'] - actual)
        if actual == 0 or (m['predictedMargin'] >= 0) == (actual > 0):
            tips += 1
    return n, tips, mae / n if n else 0, unmatched

summary = []
for year in (2023, 2024, 2025):
    tips = json.load(open(f'/tmp/sq_tips_{year}.json'))['tips']
    games = json.load(open(f'/tmp/sq_games_{year}.json'))['games']
    gm = {g['id']: g for g in games}
    gkey = {(g['date'][:10], g['hteam']): g for g in games}

    src = defaultdict(lambda: {'n': 0, 'tips': 0, 'mae': 0.0, 'mn': 0})
    for t in tips:
        if t['gameid'] not in gm:
            continue
        s = src[t['source']]
        s['n'] += 1
        s['tips'] += t['correct'] or 0
        if t.get('err') is not None:
            s['mae'] += abs(float(t['err'])); s['mn'] += 1

    rows = [(name, s['tips'], s['mae']/s['mn'] if s['mn'] else None)
            for name, s in src.items() if s['n'] == len(games)]
    n3, t3, m3, u3 = score_ours(v3all, year, gkey)
    n4, t4, m4, u4 = score_ours(v4all, year, gkey)
    assert n3 == len(games) and n4 == len(games), (year, n3, n4, len(games), u3, u4)
    rows.append(('Tipper v3', t3, m3))
    rows.append(('Tipper v4', t4, m4))
    rows.sort(key=lambda r: (-r[1], r[2] if r[2] is not None else 99))

    print(f"\n=== {year} ({len(games)} games, {len(rows)-2} full-coverage sources + tipper) — scored on TIPS ===")
    show = set()
    for i, (name, tp, mae) in enumerate(rows, 1):
        if i <= 3 or 'Tipper' in name or i == len(rows):
            pad = '>>' if 'Tipper' in name else '  '
            print(f"{pad}{i:>3}  {name:<24} {tp:>4} {100*tp/len(games):>5.1f}%  MAE {mae:.2f}" if mae is not None else f"{pad}{i:>3}  {name:<24} {tp:>4}")
    r3 = next(i for i, r in enumerate(rows, 1) if r[0] == 'Tipper v3')
    r4 = next(i for i, r in enumerate(rows, 1) if r[0] == 'Tipper v4')
    summary.append((year, len(rows), r3, t3, r4, t4))

print("\n=== summary (rank / tips) ===")
print(f"{'year':<6} {'field':<6} {'v3':<12} {'v4':<12} {'v4-v3 tips'}")
for year, n, r3, t3, r4, t4 in summary:
    print(f"{year:<6} {n:<6} {r3} ({t3})    {r4} ({t4})    {t4-t3:+d}")
