from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


F_TITLE = font(54, True)
F_H2 = font(34, True)
F_H3 = font(24, True)
F_BODY = font(24)
F_SMALL = font(18)
F_MONO = font(19)


def rounded(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def text(draw, xy, value, fill="#111827", fnt=F_BODY, anchor=None):
    draw.text(xy, value, fill=fill, font=fnt, anchor=anchor)


def pill(draw, xy, label, fill, ink="#ffffff"):
    x, y = xy
    pad_x = 18
    pad_y = 8
    box = draw.textbbox((0, 0), label, font=F_SMALL)
    w = box[2] - box[0] + pad_x * 2
    h = box[3] - box[1] + pad_y * 2
    rounded(draw, (x, y, x + w, y + h), 8, fill)
    text(draw, (x + pad_x, y + pad_y - 1), label, ink, F_SMALL)
    return x + w + 10


def save(img, name):
    img.save(ASSETS / name, quality=92, optimize=True)


def hero():
    img = Image.new("RGB", (1800, 1000), "#111827")
    draw = ImageDraw.Draw(img)

    for y in range(0, 1000, 26):
        color = "#182033" if (y // 26) % 2 == 0 else "#141c2d"
        draw.rectangle((0, y, 1800, y + 13), fill=color)

    draw.rectangle((1040, 0, 1800, 1000), fill="#0f766e")
    draw.polygon([(1040, 0), (1260, 0), (920, 1000), (680, 1000)], fill="#111827")

    rounded(draw, (980, 150, 1660, 790), 24, "#f8fafc")
    rounded(draw, (1020, 205, 1620, 330), 14, "#111827")
    rounded(draw, (1020, 360, 1300, 720), 14, "#e7f7f3")
    rounded(draw, (1330, 360, 1620, 720), 14, "#fff7df")

    text(draw, (1054, 238), "risk_score = weighted(confidence)", "#8af5d5", F_MONO)
    text(draw, (1054, 272), "verdict = SUSPICIOUS if score >= 0.30", "#facc15", F_MONO)

    for i, h in enumerate([240, 172, 292, 118, 216]):
        x = 1060 + i * 42
        draw.rectangle((x, 682 - h, x + 22, 682), fill=["#0f766e", "#1f5fbf", "#b73535", "#9a6a00", "#334155"][i])

    for i, label in enumerate(["Header", "URL", "Domain", "NLP", "Brand"]):
        text(draw, (1054, 390 + i * 45), label, "#0f172a", F_SMALL)
        draw.line((1160, 402 + i * 45, 1265, 402 + i * 45), fill="#0f766e", width=8)

    for i, label in enumerate(["OWASP", "Vault", "STIX", "CI/CD"]):
        pill(draw, (1370, 392 + i * 58), label, ["#1f5fbf", "#0f766e", "#b73535", "#9a6a00"][i])

    # Left-side abstract security graph. The actual hero copy is HTML text.
    nodes = [(150, 240), (340, 180), (520, 285), (270, 430), (600, 520), (130, 610)]
    for start, end in [(0, 1), (1, 2), (0, 3), (3, 4), (2, 4), (3, 5)]:
        draw.line((nodes[start][0], nodes[start][1], nodes[end][0], nodes[end][1]), fill="#334155", width=4)
    for i, (x, y) in enumerate(nodes):
        color = ["#0f766e", "#1f5fbf", "#b73535", "#9a6a00", "#0f766e", "#1f5fbf"][i]
        draw.ellipse((x - 26, y - 26, x + 26, y + 26), fill=color, outline="#dbeafe", width=3)
    rounded(draw, (120, 720, 650, 790), 14, "#0b1220", "#334155", 2)
    text(draw, (150, 742), "events -> triage -> evidence -> remediation", "#8af5d5", F_MONO)

    save(img, "hero-security-console.jpg")


def project_base(title, subtitle, accent="#0f766e"):
    img = Image.new("RGB", (1200, 720), "#f8fafc")
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, 1200, 100), fill="#111827")
    draw.rectangle((0, 100, 1200, 118), fill=accent)
    text(draw, (42, 30), title, "#ffffff", F_H2)
    text(draw, (44, 76), subtitle, "#cbd5e1", F_SMALL)
    return img, draw


def securevote():
    img, draw = project_base("SecureVote", "Blind signatures, PII encryption, WAF, Vault signing", "#0f766e")
    rounded(draw, (58, 160, 520, 620), 18, "#ffffff", "#d7dce3", 2)
    rounded(draw, (610, 160, 1142, 620), 18, "#ffffff", "#d7dce3", 2)
    text(draw, (92, 200), "Anonymous voting protocol", "#0f172a", F_H3)
    steps = ["1. Blind ballot", "2. Server signs blind data", "3. Voter unblinds", "4. Cast with no session"]
    for i, step in enumerate(steps):
        y = 260 + i * 72
        draw.ellipse((94, y, 132, y + 38), fill="#e7f7f3", outline="#0f766e", width=3)
        text(draw, (148, y + 5), step, "#111827", F_BODY)
        if i < len(steps) - 1:
            draw.line((113, y + 44, 113, y + 64), fill="#0f766e", width=4)
    text(draw, (650, 200), "Security controls", "#0f172a", F_H3)
    x = 650
    y = 262
    for label, color in [
        ("103 pytest tests", "#1f5fbf"),
        ("ChaCha20-Poly1305", "#0f766e"),
        ("ModSecurity CRS", "#b73535"),
        ("Vault Transit", "#9a6a00"),
        ("HMAC audit chain", "#334155"),
        ("MFA + RBAC", "#0f766e"),
    ]:
        x = pill(draw, (x, y), label, color)
        if x > 1030:
            x = 650
            y += 62
    save(img, "project-securevote.jpg")


def phishing():
    img, draw = project_base("PhishAnalyze", "Async phishing analysis with STIX export", "#b73535")
    stages = ["Ingest", "Extract", "Analyze", "Score", "Report"]
    for i, stage in enumerate(stages):
        x = 70 + i * 222
        rounded(draw, (x, 170, x + 168, 250), 14, "#ffffff", "#d7dce3", 2)
        text(draw, (x + 84, 198), stage, "#111827", F_H3, anchor="ma")
        if i < len(stages) - 1:
            draw.line((x + 174, 210, x + 210, 210), fill="#b73535", width=5)
            draw.polygon([(x + 210, 210), (x + 198, 201), (x + 198, 219)], fill="#b73535")
    rounded(draw, (70, 320, 1130, 610), 18, "#111827")
    code = [
        "analyzers = [header, url_rep, domain_intel, detonation, brand, sandbox, nlp]",
        "score = sum(weight * risk * confidence) / sum(weight * confidence)",
        "export_iocs(format='STIX 2.1')",
        "precision=91%  recall=90%  f1=0.90",
    ]
    for i, line in enumerate(code):
        text(draw, (110, 370 + i * 52), line, ["#8af5d5", "#facc15", "#c4b5fd", "#fca5a5"][i], F_MONO)
    save(img, "project-phishing.jpg")


def cryptotoolkit():
    img, draw = project_base("CryptoToolkit", "36 modules with real cryptographic attack demos", "#1f5fbf")
    rounded(draw, (70, 160, 520, 620), 18, "#ffffff", "#d7dce3", 2)
    rounded(draw, (575, 160, 1130, 620), 18, "#ffffff", "#d7dce3", 2)
    text(draw, (108, 205), "Attack lab", "#0f172a", F_H3)
    attacks = ["Padding Oracle", "ECDSA nonce reuse", "Hash length extension", "Wiener's attack", "GCM nonce reuse"]
    for i, attack in enumerate(attacks):
        y = 270 + i * 55
        draw.rectangle((108, y, 130, y + 22), fill="#1f5fbf")
        text(draw, (148, y - 4), attack, "#111827", F_BODY)
    text(draw, (615, 205), "Test vectors", "#0f172a", F_H3)
    for i, (label, val) in enumerate([("FIPS 197 AES", "pass"), ("NIST AES-GCM", "pass"), ("RFC 4231 HMAC", "pass"), ("SHA-256", "pass")]):
        y = 280 + i * 70
        rounded(draw, (620, y, 1050, y + 44), 8, "#eff6ff", "#bfdbfe", 2)
        text(draw, (642, y + 8), label, "#0f172a", F_SMALL)
        text(draw, (990, y + 8), val, "#0f766e", F_SMALL)
    text(draw, (620, 550), "95 tests", "#1f5fbf", F_H2)
    save(img, "project-cryptotoolkit.jpg")


def vault():
    img, draw = project_base("AES Secure Vault", "AES-256-GCM package with Argon2id and threat model", "#9a6a00")
    rounded(draw, (90, 165, 1110, 610), 18, "#ffffff", "#d7dce3", 2)
    draw.rectangle((130, 220, 1070, 300), fill="#111827")
    text(draw, (160, 246), "{ header: { kdf, salt, nonce }, ciphertext, tag }", "#facc15", F_MONO)
    labels = [
        ("Argon2id", 170, 370, "#0f766e"),
        ("AAD binding", 390, 370, "#1f5fbf"),
        ("KDF floor", 640, 370, "#b73535"),
        ("Fuzz tests", 870, 370, "#9a6a00"),
    ]
    for label, x, y, color in labels:
        rounded(draw, (x, y, x + 170, y + 90), 12, "#f8fafc", color, 3)
        text(draw, (x + 85, y + 32), label, "#111827", F_SMALL, anchor="ma")
    text(draw, (150, 525), "Threat model covers tampering, brute force, nonce reuse, side channels, and dependency risk.", "#334155", F_BODY)
    save(img, "project-vault.jpg")


def dns():
    img, draw = project_base("Cloudflare DNS Action", "Netlify domain attach plus Cloudflare CNAME upsert", "#334155")
    nodes = [
        ("GitHub Action", 90, 240, "#111827"),
        ("Netlify API", 430, 170, "#0f766e"),
        ("Cloudflare DNS", 430, 330, "#f97316"),
        ("HTTPS site", 790, 250, "#1f5fbf"),
    ]
    for label, x, y, color in nodes:
        rounded(draw, (x, y, x + 260, y + 86), 14, "#ffffff", color, 3)
        text(draw, (x + 130, y + 31), label, "#111827", F_H3, anchor="ma")
    draw.line((350, 282, 430, 212), fill="#334155", width=5)
    draw.line((350, 282, 430, 372), fill="#334155", width=5)
    draw.line((690, 212, 790, 292), fill="#334155", width=5)
    draw.line((690, 372, 790, 292), fill="#334155", width=5)
    text(draw, (125, 520), "Scoped token design | dry-run mode | retries | SSL checks | CI validation", "#334155", F_BODY)
    save(img, "project-dns.jpg")


def command_center():
    img, draw = project_base("Cyber Command Center", "Security training tracker with Supabase RLS", "#0f766e")
    rounded(draw, (70, 155, 1130, 620), 18, "#ffffff", "#d7dce3", 2)
    text(draw, (115, 205), "Training progress", "#0f172a", F_H3)
    phases = [0.92, 0.76, 0.55, 0.34, 0.18, 0.08]
    for i, progress in enumerate(phases):
        y = 270 + i * 48
        text(draw, (115, y - 4), f"Phase {i + 1}", "#334155", F_SMALL)
        draw.rectangle((240, y, 920, y + 20), fill="#e5e7eb")
        draw.rectangle((240, y, 240 + int(680 * progress), y + 20), fill=["#0f766e", "#1f5fbf", "#9a6a00", "#b73535", "#334155", "#0f766e"][i])
    rounded(draw, (950, 265, 1090, 420), 14, "#eff6ff", "#1f5fbf", 2)
    text(draw, (1020, 310), "49", "#1f5fbf", F_TITLE, anchor="ma")
    text(draw, (1020, 370), "tasks", "#334155", F_SMALL, anchor="ma")
    save(img, "project-command-center.jpg")


def favicon():
    img = Image.new("RGB", (256, 256), "#111827")
    draw = ImageDraw.Draw(img)
    rounded(draw, (42, 42, 214, 214), 30, "#0f766e")
    text(draw, (128, 103), "MF", "#ffffff", font(74, True), anchor="ma")
    save(img, "favicon.jpg")


def main():
    hero()
    securevote()
    phishing()
    cryptotoolkit()
    vault()
    dns()
    command_center()
    favicon()


if __name__ == "__main__":
    main()
