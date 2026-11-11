#!/usr/bin/env python3
"""Deterministic, high-precision service classification for Selletive candidates."""

import argparse
import json
import re
import sys
from pathlib import Path

from prepare import ascii_fold, clean


# One tuple per supported category: slug aliases, Portuguese service label, service phrases.
SERVICES = [
    (("seo-services",), "otimização para mecanismos de busca (SEO)", (r"SEO", r"search engine optimization")),
    (("ppc-sem", "paid-media"), "mídia paga (PPC/SEM)", (r"paid media", r"PPC", r"pay-per-click", r"SEM")),
    (("social-media-marketing",), "marketing e gestão de redes sociais", (r"social media management", r"social media marketing")),
    (("content-marketing",), "marketing e criação de conteúdo", (r"content marketing", r"content creation")),
    (("email-marketing",), "e-mail marketing", (r"email marketing", r"e-mail marketing")),
    (("brand-strategy",), "estratégia de marca", (r"brand strategy",)),
    (("branding-services-specific",), "branding", (r"branding",)),
    (("design-services-specific",), "design gráfico", (r"graphic design",)),
    (("video-production",), "produção de vídeo", (r"video production",)),
    (("web-development-services-specific",), "desenvolvimento de websites", (r"website development", r"web development")),
    (("software-development", "custom-software-development"), "desenvolvimento de software sob medida", (r"custom software development",)),
    (("mobile-app-development",), "desenvolvimento de aplicativos móveis", (r"mobile app development",)),
    (("azure-consulting",), "migração ou consultoria Azure", (r"Azure migration", r"Azure consulting", r"migration to (?:Microsoft )?Azure")),
    (("aws-consulting",), "migração ou consultoria AWS", (r"AWS migration", r"AWS consulting", r"migration to (?:Amazon Web Services|AWS)")),
    (("wordpress-development", "wordpress-websites"), "desenvolvimento de websites WordPress", (r"WordPress development", r"WordPress website development")),
    (("shopify-development", "shopify-store-implementation"), "desenvolvimento ou implantação de lojas Shopify", (r"Shopify development", r"Shopify store implementation")),
]
VERB = re.compile(r"\b(?:offers?|provides?|speciali[sz](?:es?|ing) in|services? include|expertise in|develops?|oferece|oferecem|especializad[oa]s? em|especializa(?:da|do)?|desenvolve(?:m)?|serviços? incluem|serviços? de)\b", re.I)
NEGATED = re.compile(r"\b(?:does not|do not|doesn't|don't|no longer|not offer|not provide|não oferece|nao oferece)\b", re.I)
PROVIDER = re.compile(r"\b(?:agency|agência|consultancy|consulting firm|consulting company|software development company|software development firm|development studio|design studio|design firm|creative studio|marketing company|IT services company)\b", re.I)
PRODUCT_OPENER = re.compile(r"\b(?:SaaS|marketplace|platform)\b", re.I)
GENERIC = {"agency", "agencia", "consultancy", "consulting", "marketing", "digital", "tecnologia", "technology", "solutions", "solution", "ltda", "brazil", "brasil", "grupo", "group", "studio", "company", "services", "service", "software", "design", "creative", "it"}
TOKEN = re.compile(r"[a-z0-9]+")


def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+|[\r\n]+", clean(text)) if s.strip()]


def classify(row, allowed_slugs):
    name = clean(row.get("name"))
    description = clean(row.get("description"))
    opener = description[:250]
    name_tokens = {t for t in TOKEN.findall(ascii_fold(name)) if len(t) >= 4 and t not in GENERIC}
    identity_ok = bool(name_tokens and any(t in set(TOKEN.findall(ascii_fold(opener))) for t in name_tokens))
    gate_ok = bool(PROVIDER.search(opener)) and not PRODUCT_OPENER.search(opener) and identity_ok
    found = {}
    if gate_ok:
        for sentence in sentences(description):
            if not VERB.search(sentence) or NEGATED.search(sentence):
                continue
            folded = ascii_fold(sentence)
            for aliases, label, phrases in SERVICES:
                slug = next((item for item in aliases if item in allowed_slugs), None)
                if slug and any(re.search(r"(?<!\w)(?:" + p + r")(?!\w)", folded, re.I) for p in phrases):
                    found.setdefault(slug, (label, sentence))
    # Platform-specific services first, then narrow specialties; order stays stable.
    priority = {"azure": 0, "aws": 1, "wordpress": 2, "shopify": 3}
    selected = sorted(found, key=lambda s: (next((n for k, n in priority.items() if k in s), 10), list(found).index(s)))[:3]
    labels = [found[s][0] for s in selected]
    description_pt = f"{name} oferece {', '.join(labels)}." if labels else ""
    if len(description_pt) < 40 or len(description_pt) > 650:
        selected, description_pt = [], ""
    return {
        "id": row.get("id"), "categories": selected, "description_pt": description_pt,
        "reason": "explicit offered services" if selected else "abstained: no explicit confident rule", "evidence": [
            {"slug": slug, "quote": found[slug][1]} for slug in selected
        ], "exclude": not bool(selected),
        "excludedcats": sorted(set(found) - set(selected)),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidates", required=True, help="Candidate NDJSON")
    parser.add_argument("--categories", required=True, help="Categories JSON snapshot")
    parser.add_argument("--output", required=True, help="Output decisions NDJSON")
    args = parser.parse_args()
    try:
        categories = json.loads(Path(args.categories).read_text(encoding="utf-8"))
        if isinstance(categories, dict):
            categories = categories.get("categories", list(categories.values()))
        allowed = {c["slug"] for c in categories if c.get("slug") and c.get("is_active", c.get("active", False)) and c.get("level") == 3}
        with Path(args.candidates).open(encoding="utf-8") as source, Path(args.output).open("w", encoding="utf-8") as target:
            for line in source:
                if line.strip():
                    target.write(json.dumps(classify(json.loads(line), allowed), ensure_ascii=False, separators=(",", ":")) + "\n")
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f"classify_explicit.py: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
