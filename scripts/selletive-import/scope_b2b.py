#!/usr/bin/env python3
"""Conservative, pending-only scope exclusions for the private import ledger.

This is a negative scope check, not a classifier: it only returns a decision
when the opening sentence directly identifies the company as a consumer
business and the complete description contains no evidence of an offered B2B
service or software product. Anything ambiguous stays pending.
"""

import re


_SENTENCE_END = re.compile(r"(?<=[.!?])\s+|[\r\n]+")
_TOKEN = re.compile(r"[a-z0-9]+", re.I)
_GENERIC_NAME = {
    "the", "and", "company", "group", "inc", "ltd", "ltda", "sa",
    "services", "service", "solutions", "solution", "brasil", "brazil",
    "digital", "online", "app", "tech", "technology", "industries",
}

# These are identity-level descriptions, not industry labels. The first
# sentence must contain both the company's name and one of these anchors.
_DIRECT_IDENTITIES = (
    ("consumer-retailer", re.compile(
        r"\b(?:retailer|retail company|retail business|e-commerce store|"
        r"online store|varejista|loja virtual|loja de varejo)\b", re.I)),
    ("manufacturer-of-goods", re.compile(
        r"\b(?:manufacturer|manufacturing company|manufacturer of|"
        r"fabricante|ind[uú]stria de)\b", re.I)),
    ("consumer-brand", re.compile(
        r"\b(?:consumer brand|direct-to-consumer brand|DTC brand|"
        r"consumer products? company|consumer goods company|"
        r"fashion brand|clothing brand|apparel brand|skincare brand|skin care brand|"
        r"cosmetics brand|beauty products? brand|personal care brand|"
        r"marca de consumo|marca de produtos? para consumidores|marca de roupas?|"
        r"marca de cosm[eé]ticos|marca de cuidados pessoais)\b", re.I)),
    ("food-drink-supplement-brand", re.compile(
        r"\b(?:food brand|beverage brand|drink brand|supplement brand|"
        r"food and beverage brand|restaurant chain|consumer food company|"
        r"food products? company|packaged food company|beverage company|"
        r"vitamin brand|vitamin company|nutrition products? brand|"
        r"marca de alimentos?|marca de bebidas?|marca de suplementos?|"
        r"rede de restaurantes?)\b", re.I)),
    ("consumer-medical-fitness-venue", re.compile(
        r"\b(?:medical clinic|health clinic|dental clinic|dentist(?:'s)? office|"
        r"physiotherapy clinic|physical therapy clinic|fitness studio|gym|"
        r"health club|yoga studio|pilates studio|medical practice|"
        r"cl[ií]nica m[eé]dica|cl[ií]nica odontol[oó]gica|academia|"
        r"est[uú]dio de (?:fitness|yoga|pilates))\b", re.I)),
    ("consumer-shopping-transport-app", re.compile(
        r"\b(?:consumer shopping app|shopping app for consumers|"
        r"consumer marketplace|ride-hailing app|rideshare app|"
        r"consumer transportation app|food delivery app for consumers|"
        r"aplicativo de compras para consumidores|app de transporte para passageiros)\b", re.I)),
    ("consumer-financial-institution", re.compile(
        r"\b(?:consumer bank|retail bank|personal banking provider|"
        r"consumer lending company|consumer finance company|"
        r"banco de varejo|banco para pessoas f[ií]sicas)\b", re.I)),
)

# Scan the entire description, not a clipped opener. Any clearly stated
# business-facing service, custom software, or corporate audience vetoes an
# exclusion, even when the company also has a consumer identity.
_BUSINESS_OFFER = re.compile(
    r"\b(?:B2B|business[- ]to[- ]business|business clients?|corporate clients?|"
    r"enterprise clients?|clients? (?:that are )?companies|serves? companies|"
    r"serves? businesses|serving businesses|for businesses|for companies|"
    r"for enterprises|for corporate|corporate customers?|business customers?|"
    r"custom software|custom software development|software development services|"
    r"develops? software for clients|software for businesses|software for companies|"
    r"consult(?:ing|ancy) services?|professional services?|IT services? for|"
    r"managed services?|implementation services?|business consulting|"
    r"corporate solutions?|servi[cç]os? (?:para|a) empresas|"
    r"consultoria empresarial|desenvolvimento de software sob medida|"
    r"software personalizado para empresas|clientes empresariais|"
    r"atende empresas|para empresas|solu[cç][oõ]es corporativas)\b", re.I)
_CLIENT_AUDIENCE = re.compile(
    r"\b(?:B2B|business[- ]to[- ]business|business clients?|corporate clients?|"
    r"enterprise clients?|clients? (?:that are )?companies|serves? companies|"
    r"serves? businesses|serving businesses|for businesses|for companies|"
    r"for enterprises|for corporate|corporate customers?|business customers?|"
    r"empresas|empresarial|corporativo|corporativas|clientes empresariais|"
    r"atende empresas|para empresas)\b", re.I)
_SERVICE_ACTIVITY = re.compile(
    r"\b(?:consult(?:ing|ancy)|professional services?|IT services?|managed services?|"
    r"implementation services?|custom software|software development|"
    r"develops? software|software products?|SaaS|contract manufacturing|"
    r"private[- ]label manufacturing|manufacturing services?|corporate catering|"
    r"catering services?|servi[cç]os? profissionais?|consultoria|"
    r"desenvolvimento de software|software personalizado|fabrica[cç][aã]o por contrato|"
    r"produ[cç][aã]o terceirizada|catering corporativo)\b", re.I)
_SERVICE_OFFER_VERB = re.compile(
    r"\b(?:offers?|provides?|delivers?|sells?|develops?|receives?|services? include|"
    r"serves? as|oferece(?:m)?|presta(?:m)?|fornece(?:m)?|vende(?:m)?|"
    r"desenvolve(?:m)?|servi[cç]os? incluem)\b", re.I)
_SERVICE_PROVIDER_IDENTITY = re.compile(
    r"\b(?:systems? integrator|IT integrator|technology integrator|integrator|"
    r"systems? integration provider|IT services provider|technology services provider|"
    r"enterprise technology provider|B2B technology provider|"
    r"integrador de sistemas|integradora de sistemas|integra[cç][aã]o de sistemas)\b", re.I)
_FOOD_GOODS_CONTEXT = re.compile(
    r"\b(?:packaged foods?|food products?|snacks?|bottled drinks?|"
    r"beverages?|ingredients?|frozen foods?|consumer food products?|"
    r"alimentos? embalados?|produtos? aliment[ií]cios?|bebidas?|ingredientes)\b", re.I)

_CONSUMER_ONLY_FINANCE = re.compile(
    r"\b(?:only (?:serves?|serving|for) (?:individuals|consumers|retail customers)|"
    r"exclusively (?:serves?|for) (?:individuals|consumers|retail customers)|"
    r"personal banking only|consumer-only|only for consumers|"
    r"somente (?:pessoas f[ií]sicas|consumidores)|exclusivamente para pessoas f[ií]sicas)\b", re.I)
_FINANCE_IDENTITY = re.compile(
    r"\b(?:bank|banking institution|investment fund|mutual fund|venture capital fund|"
    r"private equity fund|asset manager|credit union|banco|fundo de investimento|"
    r"gestora de ativos)\b", re.I)
_INDIRECT_ROLE = re.compile(
    r"\b(?:software|platform|platforms|provider|providers|vendor|vendors|"
    r"provides?|offers?|serves?|serving|clients?|customers?|tools?|products?|"
    r"sells?|develops?|apps?|applications?|integrator|integration|designed|"
    r"for|to|with|that|which|who)\b", re.I)


def _clean(value):
    return " ".join(str(value or "").split())


def _has_positive_classification(row):
    """Do not let scope triage override a classification already present."""
    categories = row.get("categories")
    if isinstance(categories, (list, tuple, set)) and categories:
        return True
    return bool(row.get("positive_classification") or row.get("classified_positive"))


def _identity_matches(name, sentence):
    name_tokens = {
        token.casefold() for token in _TOKEN.findall(name)
        if len(token) >= 3 and token.casefold() not in _GENERIC_NAME
    }
    sentence_tokens = {token.casefold() for token in _TOKEN.findall(sentence)}
    return bool(name_tokens and name_tokens & sentence_tokens)


def _is_direct_identity(name, sentence, anchor):
    """Reject a consumer noun that appears as a customer's role or use case."""
    # Prefer the literal company name, so a phrase like "software for Acme's
    # clinic" cannot be mistaken for Acme's identity. If the exact name is
    # absent (for example, the description opens with a brand alias), abstain.
    name_match = re.search(re.escape(name), sentence, re.I)
    if not name_match or name_match.start() > 32:
        return False
    if anchor.start() < name_match.end():
        return False
    between = sentence[name_match.end():anchor.start()]
    return not _INDIRECT_ROLE.search(between)


def out_of_scope(row):
    """Return a stable exclusion proof, or ``None`` when evidence is uncertain.

    Call only for rows without an existing positive classification. The quote
    is the exact first sentence that ties the consumer-business identity to
    the company's name.
    """
    if not isinstance(row, dict) or _has_positive_classification(row):
        return None

    name = _clean(row.get("name"))
    description = _clean(row.get("description"))
    if not name or not description:
        return None

    parts = [part.strip() for part in _SENTENCE_END.split(description) if part.strip()]
    if not parts:
        return None
    first = parts[0]
    if not _identity_matches(name, first):
        return None

    direct_identity = None
    for code, pattern in _DIRECT_IDENTITIES:
        anchor = pattern.search(first)
        if anchor and _is_direct_identity(name, first, anchor):
            if code == "food-drink-supplement-brand" and re.search(
                r"\b(?:food products? company|packaged food company|beverage company|"
                r"vitamin company)\b", anchor.group(), re.I
            ) and not _FOOD_GOODS_CONTEXT.search(first):
                continue
            direct_identity = (code, pattern)
            break
    if direct_identity is None:
        # Financial firms require an explicit consumer-only statement, and
        # that statement cannot be outweighed by a business offering.
        finance_anchor = _FINANCE_IDENTITY.search(first)
        if not (
            finance_anchor
            and _is_direct_identity(name, first, finance_anchor)
            and _CONSUMER_ONLY_FINANCE.search(description)
        ):
            return None
        reason = "consumer-only-financial-institution"
    else:
        reason = direct_identity[0]

    # A direct consumer identity is insufficient if any part of the complete
    # source description advertises B2B work, custom software, or corporate
    # clients. This deliberately prefers a false negative over dropping a
    # legitimate provider.
    is_goods_identity = reason in {
        "consumer-retailer", "manufacturer-of-goods", "consumer-brand",
        "food-drink-supplement-brand",
    }
    if is_goods_identity:
        # Wholesale or corporate buyers do not change a goods seller's scope.
        # Only an explicit offered service/software activity is counterevidence.
        if _SERVICE_PROVIDER_IDENTITY.search(description):
            return None
        service_offer = any(
            _SERVICE_OFFER_VERB.search(sentence) and _SERVICE_ACTIVITY.search(sentence)
            for sentence in parts
        )
        if service_offer:
            return None
    elif _BUSINESS_OFFER.search(description) or _CLIENT_AUDIENCE.search(description):
        return None

    return {"reason": reason, "quote": first}
