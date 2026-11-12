#!/usr/bin/env python3
"""High-precision service decisions for the pending B2B candidate set."""

import argparse
import json
import re
import sys
from pathlib import Path

from prepare import clean
from classify_b2b import INTERNAL, NEGATIVE, SERVICE, identity_ok, primary_identity


DIRECT = [
    ("it-consulting-services", "consultoria de TI", r"IT services and consulting company|IT services & consulting company|IT consulting (?:company|firm)|IT consultancy|technology consulting (?:company|firm)"),
    ("software-development", "desenvolvimento de software", r"software development (?:company|firm)|software development agency|f[aá]brica de software"),
    ("management-consulting", "consultoria de gestão", r"business consulting firm|management consulting firm|consultoria empresarial|consultoria de gest[aã]o"),
    ("marketing-services-specific", "serviços de marketing", r"marketing agency|marketing firm|marketing company|ag[eê]ncia de marketing"),
    ("advertising-services-specific", "serviços de publicidade", r"advertising agency|advertising firm|advertising company|ag[eê]ncia de publicidade"),
    ("design-services-specific", "serviços de design", r"design agency|design studio|graphic design studio|ag[eê]ncia de design|est[uú]dio de design"),
    ("web-development-services-specific", "desenvolvimento web", r"web development (?:company|firm|agency)|website development company|ag[eê]ncia de desenvolvimento web"),
    ("financial-consulting", "consultoria financeira", r"financial consulting (?:company|firm)|financial advisory firm|consultoria financeira"),
]

OFFERED = [
    ("accounting-services", "serviços contábeis", r"accounting firm|accountancy firm|escrit[oó]rio cont[aá]bil", r"accounting services?|bookkeeping services?|servi[cç]os? cont[aá]beis?", True),
    ("corporate-legal-services", "serviços jurídicos empresariais", r"law firm|escrit[oó]rio de advocacia|sociedade de advogados", r"corporate legal services?|business law services?|servi[cç]os? jur[ií]dicos empresariais?", False),
    ("insurance-brokerage", "corretagem de seguros", r"insurance broker|corretora de seguros", r"business insurance|commercial insurance|corporate insurance|insurance brokerage|corretagem de seguros", True),
    ("recruitment-services", "serviços de recrutamento", r"recruitment (?:agency|firm|company)|staffing (?:agency|company)|ag[eê]ncia de recrutamento", r"recruitment services?|recruiting services?|executive search|servi[cç]os? de recrutamento", False),
    ("training-services", "treinamento corporativo", r"training (?:company|provider|consultancy)|leadership development firm|empresa de treinamento", r"corporate training|leadership training|training programs?|workshops? (?:for|with) (?:companies|organizations|businesses)|treinamento corporativo|programas? de treinamento", True),
]

OFFER_VERB = re.compile(r"\b(?:offers?|provides?|delivers?|services? include|offerings? include|provides?|oferece|presta|fornece|servi[cç]os? incluem|inclui)\b", re.I)
PRODUCT_CONTEXT = re.compile(r"\b(?:SaaS|software|platform|product|tool|system|application|app|plataforma|produto|ferramenta|sistema|aplicativo|aplica[cç][aã]o|uses?|using|utiliza|usa)\b", re.I)
B2B_BUYER = re.compile(r"\b(?:for|serves?|serving|supports?|supporting|targets?|targeting|clients? (?:are|that are)|clientes? empresariais|para empresas|atende empresas)\b.{0,55}\b(?:business(?:es)?|companies|organizations|institutions|employers|enterprises|corporate clients|empresas|organiza[cç][oõ]es|institui[cç][oõ]es)\b|\b(?:business|corporate|commercial) clients?\b", re.I)
CORROBORATING_SERVICE = {
    "it-consulting-services": re.compile(r"\b(?:IT consulting|technology consulting|IT consultancy|consulting services?|managed IT services?|IT support services?|implementation services?|consultoria de TI|servi[cç]os? de consultoria)\b", re.I),
    "software-development": re.compile(r"\b(?:custom software|bespoke software|software development services?|application development services?|custom application development|desenvolvimento de software sob medida|software personalizado)\b", re.I),
}


def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+|[\r\n]+", clean(text)) if s.strip()]


def result(row, matches):
    selected = list(dict.fromkeys(slug for slug, _, _ in matches))[:3]
    labels = [next(label for slug, label, _ in matches if slug == chosen) for chosen in selected]
    summary = f"{clean(row.get('name'))} oferece {', '.join(labels)} para empresas."
    if not 40 <= len(summary) <= 650:
        selected, matches, summary = [], [], ""
    return {
        "id": row.get("id"), "categories": selected, "description_pt": summary,
        "reason": "explicit B2B service-provider identity and offering" if selected else "abstained: no matching B2B service rule",
        "evidence": [{"slug": slug, "quote": quote} for slug, _, quote in matches if slug in selected],
        "exclude": not bool(selected), "excludedcats": [],
    }


def classify(row, allowed_slugs):
    name, description = clean(row.get("name")), clean(row.get("description"))
    parts = sentences(description)
    if not name or not parts or not identity_ok(name, description):
        return result(row, [])
    opener = parts[0]
    # A negated identity is not positive evidence for the named company's role.
    if NEGATIVE.search(opener):
        return result(row, [])
    direct = []
    for slug, label, pattern in DIRECT:
        if slug not in allowed_slugs or not primary_identity(name, opener, [pattern]):
            continue
        # Finance and broad design identities can describe consumer services.
        if slug in {"financial-consulting", "design-services-specific"} and not B2B_BUYER.search(description):
            continue
        if slug == "design-services-specific" and re.search(r"\binterior design\b", opener, re.I):
            continue
        # Product descriptions can contradict a boilerplate provider identity.
        # In that case require a separate, explicit offered service statement.
        if slug in CORROBORATING_SERVICE and PRODUCT_CONTEXT.search(" ".join(parts[1:])):
            corroboration = next((s for s in parts[1:] if SERVICE.search(s) and CORROBORATING_SERVICE[slug].search(s) and not NEGATIVE.search(s) and not INTERNAL.search(s)), "")
            if not corroboration:
                continue
            direct.append((slug, label, corroboration))
            continue
        direct.append((slug, label, opener))
    if direct:
        return result(row, direct)

    matches = []
    for slug, label, provider_pattern, service_pattern, require_b2b in OFFERED:
        if slug not in allowed_slugs or not primary_identity(name, opener, [provider_pattern]):
            continue
        for sentence in parts:
            if NEGATIVE.search(sentence) or not OFFER_VERB.search(sentence):
                continue
            if not re.search(service_pattern, sentence, re.I):
                continue
            # Product sentences cannot prove a service (including training software).
            if PRODUCT_CONTEXT.search(sentence):
                continue
            if require_b2b and not B2B_BUYER.search(description):
                continue
            matches.append((slug, label, sentence))
            break
    return result(row, matches[:3])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidates", required=True)
    parser.add_argument("--categories", required=True)
    parser.add_argument("--output", required=True)
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
        print(f"classify_b2b_services.py: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
