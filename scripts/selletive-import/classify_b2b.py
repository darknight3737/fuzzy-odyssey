#!/usr/bin/env python3
"""Deterministic fallback classifier for pending B2B services and software."""

import argparse
import json
import re
import sys
from pathlib import Path

from prepare import ascii_fold, clean
from classify_remaining import classify_company


TOKEN = re.compile(r"[a-z0-9]+")
GENERIC = {
    "agency", "agencies", "firm", "company", "group", "services", "service",
    "solutions", "technology", "technologies", "digital", "consulting",
    "consultancy", "software", "systems", "system", "ltda", "inc", "the",
    "and", "for", "brasil", "brazil", "de", "da", "do", "e", "empresa",
    "servicos", "consultoria", "tecnologia", "solucoes", "sistemas",
    "agencia", "marketing", "comunicacao", "design", "studio", "estudio",
    "advocacia", "advogados", "contabilidade", "associados",
}
IDENTITIES = [
    ("marketing-services-specific", "serviços de marketing", (r"marketing agency", r"marketing firm", r"marketing company", r"ag[eê]ncia de marketing")),
    ("advertising-services-specific", "serviços de publicidade", (r"advertising agency", r"advertising firm", r"advertising company", r"ag[eê]ncia de publicidade")),
    ("accounting-services", "serviços contábeis", (r"accounting firm", r"accountancy firm", r"escrit[oó]rio cont[aá]bil")),
    ("it-consulting-services", "consultoria de TI", (r"IT consulting firm", r"IT consultancy", r"technology consulting firm", r"consultoria de TI")),
    ("hr-consulting", "consultoria de recursos humanos", (r"HR consultancy", r"HR consulting firm", r"human resources consultancy", r"consultoria de recursos humanos")),
    ("insurance-brokerage", "corretagem de seguros", (r"insurance broker(?:age)?", r"corretora de seguros")),
    ("management-consulting", "consultoria de gestão", (r"business consulting firm", r"management consulting firm", r"consultoria empresarial")),
]
SEMANTIC = [
    ("data-analytics-services", "serviços de análise de dados", (r"business intelligence consulting", r"BI consulting", r"business intelligence services", r"consultoria de business intelligence")),
    ("recruitment-services", "serviços de recrutamento", (r"executive search", r"recruitment", r"recruiting services", r"recrutamento", r"sele[cç][aã]o de executivos")),
    ("tax-consulting", "consultoria tributária", (r"tax planning", r"planejamento tribut[aá]rio")),
    ("cyber-security-services-specific", "serviços de cibersegurança", (r"cybersecurity solutions", r"cyber security solutions", r"cybersecurity services", r"servi[cç]os? de ciberseguran[cç]a")),
    ("managed-it-services", "serviços gerenciados de TI", (r"data center services", r"data centre services", r"cloud management", r"gest[aã]o de nuvem")),
]
OWNED_SOFTWARE = [
    ("hr-software", "recursos humanos", (r"HR (?:software|platform|system)", r"human resources (?:software|platform|system)", r"recruit(?:ment|ing) (?:and selection )?software", r"recruit(?:ment|ing) (?:and selection )?platform", r"applicant tracking system", r"ATS platform", r"employee lifecycle platform", r"platform.{0,140}HR processes", r"plataforma.{0,140}processos? de RH")),
    ("workflow-automation-software", "automação de fluxos de trabalho", (r"workflow automation software", r"process automation software", r"software de automa[cç][aã]o de processos?")),
    ("ecommerce-software", "plataforma de e-commerce", (r"e-?commerce platform", r"virtual store platform", r"online store platform", r"plataforma de loja virtual", r"plataforma de e-?commerce", r"e-?commerce stores?.{0,100}marketplaces?")),
    ("enterprise-software", "software empresarial", (r"business software", r"enterprise software", r"business management system", r"management system", r"workflow system", r"partner success platform", r"business platform", r"corporate voice assistant", r"software empresarial", r"sistema de gest[aã]o empresarial")),
]
PROVIDER = re.compile(r"\b(?:agency|firm|company|consultancy|broker|consultoria|corretora|escrit[oó]rio|IT services company|IT services and consulting company|IT services & consulting company|IT consulting company|technology services company)\b", re.I)
NEGATIVE = re.compile(r"\b(?:not|never|no longer|does not|do not|isn't|aren't|n[aã]o|deixou de)\b", re.I)
INTERNAL = re.compile(r"\b(?:uses?|using|utiliza|usa|internal|internally|for its own|para uso pr[oó]prio)\b", re.I)
OUTSIDE_IDENTITY = re.compile(r"\b(?:is|are|operates as|acts as|é|são)\b.{0,70}\b(?:consumer products? company|manufacturer|manufacturing company|retailer|online retailer|digital bank|bank|marketplace|fabricante|varejista|banco digital|banco)\b", re.I)
PRODUCT = re.compile(r"\b(?:offers?|provides?|sells?|markets?|commercializes?|oferece|fornece|vende|comercializa)\b.{0,100}\b(?:software|platform|system|saas|product|plataforma|sistema|software)\b", re.I)
B2B_CLIENT = re.compile(r"\b(?:businesses|business clients|small (?:and medium )?businesses|corporate clients|companies|organizations|institutions|retailers|franchisors|large retail networks|multi[ -]unit operations|for employers|for firms|targets? .{0,45}(?:business|enterprise|companies|organizations)|serves? .{0,45}(?:business|enterprise|companies|organizations)|empresas|empresarial|corporativo|corporativas|organiza[cç][oõ]es|clientes empresariais|franqueadores|redes de varejo|opera[cç][oõ]es multiunidades|enterprise software|corporate voice assistant)\b", re.I)
B2B_BUYER_RELATION = re.compile(r"\b(?:(?:for|to|serves?|serving|supports?|supporting|targets?|targeting|sold to|used by|built for|designed for|helps?)\s+(?:hundreds of\s+|thousands of\s+|small and medium\s+)?(?:business(?:es)?|companies|organizations|institutions|franchisors|retail networks|multi[ -]unit operations|employers|enterprises|corporate clients|empresas|organiza[cç][oõ]es|franqueadores|redes de varejo)|(?:empresas|organiza[cç][oõ]es|franqueadores)\s+(?:usam|utilizam|contratam))\b", re.I)
SERVICE = re.compile(r"\b(?:offers?|provides?|delivers?|services include|offerings include|offering includes|specializes? in|focuses? on|oferece|presta|fornece|servi[cç]os incluem|ofertas incluem|especializa-se em)\b", re.I)
PRODUCT_CONTEXT = re.compile(r"\b(?:software|SaaS|platform|product|tool|system|application|app|plataforma|produto|ferramenta|sistema|aplicativo|aplica[cç][aã]o)\b", re.I)
GENERIC_PRODUCT_PROOF = re.compile(r"\b(?:offers?|provides?|sells?|markets?|commercializes?|commercialises?|oferece|fornece|vende|comercializa)\s+(?:(?:a|an|the|its|our|own|proprietary|commercial|hosted|subscription|cloud-based|business management|business|workforce|enterprise|software|SaaS|software empresarial|sua|seu|pr[oó]prio|pr[oó]pria)\s+){0,7}(?:SaaS|software|platform|system|product|application|app|plataforma|sistema|produto|aplicativo|aplica[cç][aã]o)\b", re.I)
SOFTWARE_PRODUCT_IDENTITY = re.compile(r"\b(?:is|are|é|são)\b.{0,50}\b(?:SaaS platform|software platform|software product|SaaS company|software company|software empresarial)\b", re.I)
COMMERCIAL_PLAN = re.compile(r"\b(?:offers?|provides?|offering)\b.{0,45}\b(?:tailored|paid|subscription|pricing|commercial)?\s*plans?\s+(?:like|such as|named|called)\s+[A-Z][A-Za-z0-9.-]+|\b(?:SaaS|software|platform|app) subscription plans?\b", re.I)
CONSUMER_APP = re.compile(r"\b(?:consumer[- ]only app|consumer app|app for consumers|application for consumers|personal use app|app for individuals|consumer shopping app|ride[- ]hailing app|food delivery app for consumers)\b", re.I)
SERVICE_ONLY_PRODUCT_SENTENCE = re.compile(r"\b(?:custom software development|software development(?: services?)?|custom development|consulting services?|implementation services?|integration services?|professional services?|software development for clients|custom software for clients|software (?:consulting|support|implementation|integration|development|customization) services?|SaaS implementation|expertise in (?:software|SaaS|platform)|servi[cç]os? de desenvolvimento de software|desenvolvimento de software sob medida|consultoria de software)\b", re.I)
INDIRECT_ROLE = re.compile(r"\b(?:software|platform|provider|vendor|provides?|offers?|serves?|clients?|customers?|tools?|products?|sells?|develops?|apps?|applications?|designed|for|to|with|that|which|who|software|plataforma|fornece|oferece|clientes|ferramentas|produtos|para|com)\b", re.I)


def identity_ok(name, description):
    tokens = [t for t in TOKEN.findall(ascii_fold(name)) if len(t) >= 3 and t not in GENERIC]
    opener = TOKEN.findall(ascii_fold(description[:500]))
    if not tokens:
        return False
    if "&" in name:
        return set(tokens) <= set(opener[:20])
    return tokens[0] in opener[:10]


def primary_identity(name, sentence, patterns):
    name_match = re.search(re.escape(name), sentence, re.I)
    if not name_match or name_match.start() > 32:
        return None
    for pattern in patterns:
        anchor = re.search(pattern, sentence, re.I)
        if anchor and anchor.start() >= name_match.end():
            between = sentence[name_match.end():anchor.start()]
            if not INDIRECT_ROLE.search(between):
                return anchor
    return None


def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+|[\r\n]+", clean(text)) if s.strip()]


def fallback(row, allowed):
    name, desc = clean(row.get("name")), clean(row.get("description"))
    parts = sentences(desc)
    if not identity_ok(name, desc):
        return None
    opener = desc[:500]
    identity_statement = parts[0] if parts else opener
    # A company identity itself is sufficient evidence for these unambiguous service-provider types.
    for slug, label, patterns in IDENTITIES:
        if slug in allowed and not OUTSIDE_IDENTITY.search(identity_statement) and primary_identity(name, identity_statement, patterns):
            if slug in {"accounting-services", "insurance-brokerage"} and not B2B_CLIENT.search(desc):
                continue
            quote = next((s for s in parts if any(re.search(p, s, re.I) for p in patterns)), "")
            if quote and not NEGATIVE.search(quote):
                return decision(row, [(slug, label, quote)], "explicit B2B service-provider identity")
    found = []
    if PROVIDER.search(opener) and not OUTSIDE_IDENTITY.search(identity_statement):
        for slug, label, patterns in SEMANTIC:
            for sentence in parts:
                if slug not in allowed or NEGATIVE.search(sentence) or INTERNAL.search(sentence):
                    continue
                # Tax planning needs both a service provider and an explicit offered phrase.
                if slug == "tax-consulting" and (not SERVICE.search(sentence) or not PROVIDER.search(opener)):
                    continue
                if slug != "tax-consulting" and not (SERVICE.search(sentence) or re.search(r"\b(?:specializ\w*|expertise|focused)\b", sentence, re.I)):
                    continue
                if PRODUCT_CONTEXT.search(sentence):
                    continue
                if any(re.search(p, sentence, re.I) for p in patterns):
                    found.append((slug, label, sentence))
                    break
    # Owned products require explicit product language and B2B audience evidence
    # somewhere in the description. Keep the product quote and client quote separate.
    b2b_quote = next((s for s in parts if B2B_CLIENT.search(s)), "")
    if not found and not OUTSIDE_IDENTITY.search(identity_statement) and b2b_quote:
        product_quotes = []
        for sentence in parts:
            if NEGATIVE.search(sentence) or INTERNAL.search(sentence):
                continue
            if SERVICE_ONLY_PRODUCT_SENTENCE.search(sentence):
                continue
            explicit_product = bool(PRODUCT.search(sentence)) or bool(COMMERCIAL_PLAN.search(sentence) and re.search(r"\b(?:platform|software|SaaS|app|product|plataforma|sistema)\b", sentence, re.I)) or bool(re.search(
                r"\b(?:specializes? in|specialising in|specializing in|is|are|offers?|provides?|sells?|markets?|comercializa|oferece)\b"
                r".{0,90}\b(?:enterprise software|recruit(?:ment|ing) (?:and selection )?(?:software|platform)|applicant tracking system|ATS platform|partner success platform|business platform|HR platform|employee lifecycle platform|"
                r"e-?commerce platform|virtual store platform|online store platform|plataforma de loja virtual|plataforma de e-?commerce|"
                r"corporate voice assistant|software empresarial|plataforma SaaS|SaaS platform)\b", sentence, re.I))
            if not explicit_product:
                continue
            product_quotes.append(sentence)
            description_folded = ascii_fold(desc)
            for slug, label, patterns in OWNED_SOFTWARE:
                if slug == "enterprise-software":
                    continue
                if slug not in allowed:
                    continue
                matched = next((p for p in patterns if re.search(p, sentence, re.I)), None)
                purpose_match = next((p for p in patterns if re.search(p, description_folded, re.I)), None)
                # A product sentence may say only "SaaS platform" while another
                # exact sentence describes what that product does.
                if matched or (purpose_match and re.search(r"\b(?:SaaS|software|platform|plataforma|system|sistema)\b", sentence, re.I)):
                    found.append((slug, label, sentence))
                    break
            if found:
                break
        # Generic enterprise software is the last resort for a clearly sold
        # software product with an explicit business buyer relationship.
        if not found and "enterprise-software" in allowed and product_quotes and B2B_BUYER_RELATION.search(desc) and not CONSUMER_APP.search(desc):
            product_quote = next((s for s in product_quotes if GENERIC_PRODUCT_PROOF.search(s) and not SERVICE_ONLY_PRODUCT_SENTENCE.search(s)), "")
            if not product_quote:
                product_quote = next((s for s in product_quotes if SOFTWARE_PRODUCT_IDENTITY.search(s) and not SERVICE_ONLY_PRODUCT_SENTENCE.search(s)), "")
            if not product_quote and COMMERCIAL_PLAN.search(desc) and re.search(r"\b(?:platform|software|SaaS|app|product|plataforma|software)\b", desc, re.I):
                product_quote = next((s for s in product_quotes if COMMERCIAL_PLAN.search(s) and re.search(r"\b(?:platform|software|SaaS|app|product|plataforma|sistema)\b", s, re.I)), "")
            if product_quote:
                found.append(("enterprise-software", "software empresarial", product_quote))
    if found:
        reason = "explicit B2B software product" if any(slug.endswith("software") for slug, _, _ in found) else "explicit B2B service offering"
        return decision(row, found[:3], reason)
    return None


def decision(row, found, reason):
    selected = [x[0] for x in found]
    labels = [x[1] for x in found]
    summary = f"{clean(row.get('name'))} oferece {', '.join(labels)} para empresas."
    if not 40 <= len(summary) <= 650:
        selected, found, summary = [], [], ""
    parts = sentences(clean(row.get("description")))
    return {
        "id": row.get("id"), "categories": selected, "description_pt": summary,
        "reason": reason if selected else "abstained: summary outside length bounds",
        "evidence": [{
            "slug": slug,
            "quote": quote,
            "supporting_quotes": [s for s in parts if s != quote and (B2B_CLIENT.search(s) or (slug == "ecommerce-software" and re.search(r"e-?commerce stores?.{0,100}marketplaces?", s, re.I)))],
        } for slug, _, quote in found],
        "exclude": not bool(selected), "excludedcats": [],
    }


def classify(row, allowed_slugs):
    # This pending-row identity was explicitly held for review; preserve that hold.
    if row.get("id") == "657af57ccd0c180001adbbc7":
        return {
            "id": row.get("id"), "categories": [], "description_pt": "",
            "reason": "abstained: manual identity hold", "evidence": [],
            "exclude": True, "excludedcats": [],
        }
    # Existing rules can preserve a conservative abstention reason, but their
    # positive classifications do not satisfy this pending-only B2B stage.
    result = classify_company(row, allowed_slugs)
    extra = fallback(row, allowed_slugs)
    if extra is not None:
        return extra
    if result["exclude"]:
        return result
    return {
        "id": row.get("id"), "categories": [], "description_pt": "",
        "reason": "abstained: no B2B-specific fallback evidence", "evidence": [],
        "exclude": True, "excludedcats": [],
    }


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
        print(f"classify_b2b.py: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
