"""86번: 외부 생성툴(Gemini 등) 24컷 시트 → 게임용 고해상도 아틀라스.
마젠타 배경 제거 → 색 분류(확정색 + 번짐 픽셀은 가장 가까운 확정색) → 떨어진 잡티·워터마크 제거 →
칸 나누기(6×4 균등) → 필요하면 좌우 반전(게임 기준 = 왼쪽 보기) → 목표 크기로 면적 투표 축소 →
칸 안 가로 중앙·바닥 정렬 → 모색별 재채색 → 인덱스 PNG.
사용: python3 import_sheet.py  (설정은 아래 CONFIG)
"""
import numpy as np, json, base64, io, sys
from PIL import Image
from scipy import ndimage
from scipy.ndimage import distance_transform_edt

CONFIG = dict(
    src="sheet.png", breed="border", stage="adult",
    face_right=True,                      # 원본이 오른쪽을 보면 True → 좌우 반전
    target_ref_h=None,                    # None이면 게임 공식으로 계산
    # 원본에서 뽑은 대표색 → 역할. role: out/b/a/aDark/tan/tongue
    classes=[("out",(31,7,6),26), ("b",(56,52,50),26), ("a",(245,240,229),22),
             ("aDark",(212,199,182),16), ("tan",(165,112,90),30), ("tongue",(223,115,97),30)],
    coats={ "classic":dict(a="#F4F1E6",aDark="#D8D3C2",b="#3A3A3A"),
            "red":    dict(a="#F4F1E6",aDark="#D8D3C2",b="#9A4E30"),
            "merle":  dict(a="#C9CDD6",aDark="#A9AFBC",b="#5B6270") },
    fixed=dict(out=(55,33,9), tan=(166,110,80), tongue=(224,110,100)),
)

def hx(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))

def game_ref_h(breed):
    # 031 dogBase(): sceneH = 193 * sqrt(yardTargetH(breed)/yardTargetH(corgi)) (성견, 푸들 배율 1)
    CM_PER_PX = (170 + 170/7.5) / 100
    import re
    src = open("/home/claude/ppp/src/script/002-pixel-art.js", encoding="utf-8").read()
    hcm = {m.group(1): float(m.group(2)) for m in re.finditer(r"^\s*(\w+):\{ heightCm:(\d+)", src, re.M)}
    t = lambda b: max(6, round(hcm[b]/CM_PER_PX*2.1))*1.18
    return 193 * (t(breed)/t("corgi"))**0.5

def main(cfg):
    im = np.array(Image.open(cfg["src"]).convert("RGB")).astype(int)
    H, W, _ = im.shape
    r, g, b = im[...,0], im[...,1], im[...,2]
    mag = np.minimum(r, b) - g
    names = [c[0] for c in cfg["classes"]]
    cols = np.array([c[1] for c in cfg["classes"]])
    thr = np.array([c[2] for c in cfg["classes"]])
    d = np.sqrt(((im[...,None,:] - cols[None,None,:,:])**2).sum(-1))
    near = d.argmin(-1); dmin = d.min(-1)
    lab = near + 1                                   # 0 = 배경
    bg_sure = (mag > 110) & (r > 150) & (b > 150)
    certain = bg_sure | (dmin < thr[near])
    lab[bg_sure] = 0
    _, (iy, ix) = distance_transform_edt(~certain, return_indices=True)
    lab = lab[iy, ix]                                 # 번짐 픽셀은 가장 가까운 확정 픽셀(배경 포함)을 따름
    # 잡티 흡수(작은 색 조각 → 주변 다수 색)
    for k in range(1, len(names)+1):
        if names[k-1] == "tongue": continue
        L, n = ndimage.label(lab == k)
        if n == 0: continue
        sizes = ndimage.sum(np.ones_like(L), L, range(1, n+1))
        for j, sz in enumerate(sizes, 1):
            if sz >= 30: continue
            m = L == j
            ring = ndimage.binary_dilation(m, np.ones((3,3))) & ~m
            v = lab[ring]; v = v[v != k]
            if v.size: lab[m] = np.bincount(v).argmax()
    # 칸 나누기 + 칸마다 본체만 남기기(워터마크·날벌레 등 떨어진 조각 제거)
    frames, removed = [], []
    for row in range(4):
        for col in range(6):
            y0, y1 = round(row*H/4), round((row+1)*H/4)
            x0, x1 = round(col*W/6), round((col+1)*W/6)
            c = lab[y0+3:y1-3, x0+3:x1-3].copy()
            L, n = ndimage.label(c > 0, np.ones((3,3)))
            sizes = ndimage.sum(np.ones_like(L), L, range(1, n+1))
            big = sizes.max()
            rm = 0
            for j, sz in enumerate(sizes, 1):
                if sz < 0.05 * big: c[L == j] = 0; rm += 1
            # 본체 안에 갇힌 구멍(워터마크가 덮은 자리 등) 메우기: 구멍 → 주변 색
            filled = ndimage.binary_fill_holes(c > 0)
            holes = filled & (c == 0)
            if holes.any():
                hl, hn = ndimage.label(holes)
                hs = ndimage.sum(np.ones_like(hl), hl, range(1, hn+1))
                for j, sz in enumerate(hs, 1):
                    if sz < 400:                       # 작은 구멍만(다리 사이 같은 큰 틈은 유지)
                        m = hl == j
                        ring = ndimage.binary_dilation(m, np.ones((3,3))) & ~m
                        v = c[ring]; v = v[v > 0]
                        if v.size: c[m] = np.bincount(v).argmax()
            ys, xs = np.nonzero(c)
            c = c[ys.min():ys.max()+1, xs.min():xs.max()+1]
            if cfg["face_right"]: c = c[:, ::-1]
            frames.append(c); removed.append(rm)
    # 목표 크기로 면적 투표 축소(0번 프레임 높이 = target)
    target = cfg["target_ref_h"] or game_ref_h(cfg["breed"])
    sc = target / frames[0].shape[0]
    out = []
    K = len(names) + 1
    for c in frames:
        h, w = c.shape
        nh, nw = max(1, round(h*sc)), max(1, round(w*sc))
        votes = np.zeros((K, nh, nw))
        for k in range(K):
            m = Image.fromarray(((c == k)*255).astype(np.uint8))
            votes[k] = np.array(m.resize((nw, nh), Image.BOX)).astype(float)
        votes[0] *= 1.15                              # 경계에서 배경 쪽으로 살짝(외곽선 번짐 방지)
        out.append(votes.argmax(0))
    CW = max(f.shape[1] for f in out); CH = max(f.shape[0] for f in out)
    REF = out[0].shape[0]
    print("scale", round(sc,3), "cell", CW, CH, "refH", REF, "removed", removed)
    res = {}
    for cid, cc in cfg["coats"].items():
        role = dict(cfg["fixed"]); role.update({k: hx(v) for k, v in cc.items()})
        P = [(0,0,0)] + [role[n] for n in names]
        ai = np.zeros((CH*4, CW*6), np.uint8)
        for n, f in enumerate(out):
            rr, cc2 = divmod(n, 6); h, w = f.shape
            ox = cc2*CW + (CW-w)//2; oy = rr*CH + CH - h
            ai[oy:oy+h, ox:ox+w] = f
        q = Image.fromarray(ai, "P")
        q.putpalette([v for p in P for v in p] + [0]*(768 - 3*len(P)))
        buf = io.BytesIO(); q.save(buf, "PNG", optimize=True, transparency=0)
        open(f"atlas_{cid}.png", "wb").write(buf.getvalue())
        res[cid] = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
        print(cid, len(buf.getvalue()), "bytes")
    json.dump({"breed":cfg["breed"],"stage":cfg["stage"],"cw":CW,"ch":CH,"refH":REF,"uris":res}, open("atlas.json","w"))

if __name__ == "__main__":
    main(CONFIG)
