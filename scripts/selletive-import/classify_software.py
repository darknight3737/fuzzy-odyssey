#!/usr/bin/env python3
"""Conservatively classify companies that sell their own business software."""

import argparse
import json
import re
import sys
from pathlib import Path

from prepare import ascii_fold, clean


# Leaf, Portuguese label, and product-specific evidence phrases. A phrase only
# counts when the same sentence also explicitly presents a commercial product.
PRODUCTS = [
    ("erp-software", "ERP", (r"\bERP\b", r"enterprise resource planning")),
    ("crm-software", "CRM", (r"\bCRM\b", r"customer relationship management")),
    ("hr-software", "recursos humanos", (r"HR software", r"human resources software", r"people management software", r"software de recursos humanos", r"software de RH")),
    ("accounting-software", "contabilidade", (r"accounting software", r"accounting platform", r"bookkeeping software", r"software cont[aá]bil", r"plataforma cont[aá]bil")),
    ("marketing-software", "marketing", (r"marketing software", r"marketing automation software", r"marketing platform", r"software de marketing", r"plataforma de marketing")),
    ("customer-service-software", "atendimento ao cliente", (r"customer service software", r"customer support software", r"customer service platform", r"help desk software", r"software de atendimento ao cliente", r"software de suporte ao cliente")),
    ("cybersecurity-software", "cibersegurança", (r"cybersecurity software", r"cyber security software", r"security software", r"endpoint security software", r"software de ciberseguran[cç]a", r"software de seguran[cç]a cibern[eé]tica")),
    ("analytics-software", "análise de dados", (r"analytics software", r"business intelligence software", r"BI software", r"analytics platform", r"software de an[aá]lise de dados", r"software de business intelligence", r"plataforma de analytics")),
    ("logistics-software", "logística", (r"logistics software", r"supply chain software", r"fleet management software", r"software de log[ií]stica", r"software para gest[aã]o de frotas")),
    ("education-software", "educação", (r"education software", r"educational software", r"learning management system", r"LMS software", r"software educacional", r"software para educa[cç][aã]o", r"plataforma de aprendizagem")),
    ("healthcare-software", "gestão de saúde", (r"healthcare software", r"health care software", r"medical practice software", r"hospital management software", r"software para gest[aã]o de sa[uú]de", r"software m[eé]dico", r"software hospitalar")),
    ("business-management-software", "gestão empresarial", (r"business management software", r"business management platform", r"business operations software", r"software de gest[aã]o empresarial", r"plataforma de gest[aã]o empresarial")),
]

# Product ownership/sale must be stated, not inferred from development work or
# a technology mentioned in the description. The target term follows the verb.
COMMERCIAL_PRODUCT = re.compile(
    r"\b(?:offers?|provides?|providing|sells?|markets?|commercializes?|commercialises?|"
    r"vende(?:m)?|comercializa(?:m)?|oferece(?:m)?|disponibiliza(?:m)?|"
    r"fornece(?:m)?)\b.{0,100}\b(?:software|saas|platform|application|app|"
    r"product|system|suite|tool|plataforma|aplicativo|aplica[cç][aã]o|"
    r"produto|sistema|ferramenta|solu[cç][aã]o|ERP|CRM|LMS)\b",
    re.I,
)
OWNED_PRODUCT = re.compile(
    r"\b(?:its|our|own|proprietary|nosso|nossa|pr[oó]prio|pr[oó]pria)\b"
    r".{0,60}\b(?:software|saas|platform|application|app|product|system|"
    r"suite|tool|plataforma|aplicativo|aplica[cç][aã]o|produto|sistema|ferramenta)\b",
    re.I,
)
PRODUCT_PORTFOLIO = re.compile(
    r"\b(?:(?:(?:main|flagship|key|primary|principal)\s+)?products?\s+"
    r"(?:include|includes|are|comprise|comprises)|(?:main|flagship|key|primary|"
    r"principal)\s+products?|product portfolio|portfolio of products)\b",
    re.I,
)
VENDOR_PRODUCT = re.compile(
    r"\b(?:is|are|é|são)\b.{0,70}\b(?:software|saas|platform|plataforma|"
    r"application|app|system|sistema|product|produto)\b.{0,45}\b(?:ERP|CRM|"
    r"LMS|marketing|accounting|analytics|cybersecurity|logistics|healthcare|"
    r"education|human resources|customer service)\b|"
    r"\b(?:is|are|é|são)\b.{0,55}\b(?:ERP|CRM|LMS|marketing|accounting|"
    r"analytics|cybersecurity|logistics|healthcare|education|human resources|"
    r"customer service)\b.{0,35}\b(?:software|saas|platform|plataforma|"
    r"application|app|system|sistema|product|produto)\b",
    re.I,
)
NEGATED = re.compile(
    r"\b(?:does not|do not|doesn't|don't|not offer|not provide|no longer|"
    r"n[aã]o oferece|n[aã]o vende|n[aã]o comercializa)\b", re.I
)
SERVICE_ONLY = re.compile(
    r"\b(?:software development (?:company|firm|agency)|custom software|"
    r"software development services?|develop(?:s|ing) software for clients|"
    r"software house|empresa de desenvolvimento de software|f[aá]brica de software)\b",
    re.I,
)
EXCLUDED_IDENTITY = re.compile(
    r"\b(?:is|are|operates as|acts as|atua como|é|são)\b.{0,35}\b(?:"
    r"digital bank|online bank|banking institution|bank|banco digital|"
    r"digital banking|fintech lender|lending company|loan provider|lender|"
    r"marketplace|online retailer|retailer|retail company|e-commerce store|"
    r"manufacturer|manufacturing company|fabricante|varejista)\b",
    re.I,
)
SERVICE_ACTIVITY = re.compile(
    r"\b(?:expertise in|custom|bespoke|implementation|implementa[cç][aã]o|consulting|"
    r"consultoria|development services?|servi[cç]os? de desenvolvimento|"
    r"integration services?|integra[cç][aã]o|software development|"
    r"develop(?:s|ing)? .{0,35} for clients|desenvolve(?:m)? .{0,35} para clientes|"
    r"offers? (?:a range of )?services?\b.{0,90}\b(?:ERP|CRM|LMS|software|"
    r"plataforma|sistema)\b|services? include\b.{0,90}\b(?:ERP|CRM|LMS)\b)",
    re.I,
)
INTERNAL_USE = re.compile(r"\b(?:uses?|utilizes?|adopts?|runs? on|makes? use of|utiliza|usa|adota)\b", re.I)
SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+|[\r\n]+")
TOKEN = re.compile(r"[a-z0-9]+")
GENERIC_NAME = {
    "software", "systems", "system", "technology", "technologies", "digital",
    "solutions", "solution", "services", "service", "company", "group",
    "brasil", "brazil", "ltda", "inc", "the", "and", "for", "de", "do",
    "da", "e", "tecnologia", "tecnologias", "sistemas", "solucoes",
}


def sentences(text):
    return [part.strip() for part in SENTENCE_SPLIT.split(clean(text)) if part.strip()]


def identity_matches(name, description):
    name_tokens = TOKEN.findall(ascii_fold(name))
    if not name_tokens or not any(
        len(token) >= 3 and token not in GENERIC_NAME for token in name_tokens
    ):
        return False
    opener = ascii_fold(description[:350]).strip()
    opener = re.sub(r"^(?:a|an|o|os|as|um|uma)\s+", "", opener)
    opening_tokens = TOKEN.findall(opener)
    # Full legal-name match is preferred. Otherwise allow a distinctive first
    # brand token as an exact prefix (e.g. Fieldlink.me -> FieldLink), or a
    # longer shared prefix after legal suffixes were omitted (A2W Tecnologia).
    if opening_tokens[:len(name_tokens)] == name_tokens:
        return True
    first = name_tokens[0]
    if opening_tokens and opening_tokens[0] == first and (
        len(first) >= 5 or any(char.isdigit() for char in first) or len(first) >= 4
    ) and first not in GENERIC_NAME:
        return True
    shared = 0
    for expected, actual in zip(name_tokens, opening_tokens):
        if expected != actual:
            break
        shared += 1
    return shared >= 2 and any(
        len(token) >= 3 and token not in GENERIC_NAME for token in name_tokens[:shared]
    )


def classify(row, allowed_slugs):
    name = clean(row.get("name"))
    description = clean(row.get("description"))
    parts = sentences(description)
    opener = description[:500]
    identity_ok = identity_matches(name, description)
    excluded_identity = bool(EXCLUDED_IDENTITY.search(opener))
    found = {}

    vendor_product = bool(
        parts and VENDOR_PRODUCT.search(parts[0]) and not SERVICE_ONLY.search(opener)
    )
    if identity_ok and not excluded_identity:
        for sentence in parts:
            if NEGATED.search(sentence) or SERVICE_ACTIVITY.search(sentence) or INTERNAL_USE.search(sentence):
                continue
            opening_vendor_claim = sentence == (parts[0] if parts else "") and vendor_product
            if not (
                COMMERCIAL_PRODUCT.search(sentence)
                or OWNED_PRODUCT.search(sentence)
                or PRODUCT_PORTFOLIO.search(sentence)
                or opening_vendor_claim
            ):
                continue
            folded = ascii_fold(sentence)
            for slug, label, phrases in PRODUCTS:
                if slug in allowed_slugs and any(
                    re.search(r"(?<!\w)(?:" + phrase + r")(?!\w)", folded, re.I)
                    for phrase in phrases
                ):
                    found.setdefault(slug, sentence)

    selected = list(found)[:3]
    description_pt = (
        f"{name} oferece software de {', '.join(PRODUCTS_BY_SLUG[slug] for slug in selected)} para empresas."
        if selected else ""
    )
    if len(description_pt) < 40 or len(description_pt) > 650:
        selected, description_pt = [], ""

    if selected:
        reason = "explicit own software product"
    elif not name:
        reason = "abstained: missing company identity"
    elif not identity_ok:
        reason = "abstained: company identity mismatch"
    elif excluded_identity:
        reason = "abstained: excluded business identity"
    elif SERVICE_ONLY.search(opener):
        reason = "abstained: software services provider"
    else:
        reason = "abstained: no explicit matching software product"

    return {
        "id": row.get("id"),
        "categories": selected,
        "description_pt": description_pt,
        "reason": reason,
        "evidence": [{"slug": slug, "quote": found[slug]} for slug in selected],
        "exclude": not bool(selected),
        "excludedcats": sorted(set(found) - set(selected)),
    }


PRODUCTS_BY_SLUG = {slug: label for slug, label, _ in PRODUCTS}


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
        allowed = {
            category["slug"] for category in categories
            if category.get("slug")
            and category.get("is_active", category.get("active", False))
            and category.get("level") == 3
        }
        with Path(args.candidates).open(encoding="utf-8") as source, Path(args.output).open(
            "w", encoding="utf-8"
        ) as target:
            for line in source:
                if line.strip():
                    decision = classify(json.loads(line), allowed)
                    target.write(json.dumps(decision, ensure_ascii=False, separators=(",", ":")) + "\n")
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f"classify_software.py: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
