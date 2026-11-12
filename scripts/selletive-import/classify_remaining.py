#!/usr/bin/env python3
"""Conservative deterministic classification across Selletive's active leaf taxonomy."""

import argparse
import json
import re
import sys
from pathlib import Path

from prepare import ascii_fold, clean
from classify_software import classify as classify_software


# (category slug, Portuguese label, explicit descriptions of a delivered service).
# Phrases intentionally describe work sold to clients; product names and technology
# mentions alone never qualify.
RULES = [
    ("software-development", "desenvolvimento de software", (r"custom software development", r"software development services", r"develop(?:s|ing)? software for clients", r"desenvolvimento de software", r"desenvolvimento de sistemas sob medida")),
    ("seo-services", "SEO", (r"search engine optimization", r"SEO(?: services?)?", r"servi[cç]os? de SEO", r"otimiza[cç][aã]o para mecanismos de busca")),
    ("ppc-sem", "mídia paga e SEM", (r"paid media(?: management| services?)?", r"paid search (?:management|services?)", r"PPC (?:management|services?|campaigns?)", r"pay-per-click (?:advertising|campaigns?)", r"search engine marketing", r"gest[aã]o de m[ií]dia paga", r"campanhas? de links patrocinados")),
    ("social-media-marketing", "marketing em redes sociais", (r"social media management", r"social media marketing", r"gest[aã]o de redes sociais", r"marketing (?:nas|em) redes sociais")),
    ("content-marketing", "marketing de conteúdo", (r"content marketing", r"content strategy", r"content creation for (?:brands|clients)", r"marketing de conte[uú]do", r"estrat[eé]gia de conte[uú]do")),
    ("email-marketing", "e-mail marketing", (r"e-?mail marketing", r"email campaign management", r"marketing por e-?mail")),
    ("video-production", "produção de vídeo", (r"video production", r"video production services", r"commercial video production", r"produ[cç][aã]o audiovisual", r"produ[cç][aã]o de v[ií]deos?")),
    ("accounting-services", "serviços contábeis", (r"accounting services?", r"accounting and tax services", r"servi[cç]os? cont[aá]beis?", r"contabilidade para empresas")),
    ("bookkeeping-services", "serviços de escrituração contábil", (r"bookkeeping services?", r"bookkeeping and accounting", r"servi[cç]os? de escritura[cç][aã]o cont[aá]bil", r"gest[aã]o cont[aá]bil")),
    ("tax-consulting", "consultoria tributária", (r"tax consulting", r"tax advisory services?", r"consultoria tribut[aá]ria", r"assessoria fiscal")),
    ("payroll-services", "serviços de folha de pagamento", (r"payroll services?", r"payroll processing", r"servi[cç]os? de folha de pagamento", r"processamento de folha")),
    ("management-consulting", "consultoria de gestão", (r"management consulting", r"business management consulting", r"consultoria de gest[aã]o", r"consultoria empresarial")),
    ("business-strategy-consulting", "consultoria em estratégia empresarial", (r"business strategy consulting", r"corporate strategy consulting", r"consultoria em estrat[eé]gia empresarial", r"planejamento estrat[eé]gico empresarial")),
    ("process-consulting", "consultoria de processos", (r"process consulting", r"business process consulting", r"consultoria de processos?", r"mapeamento e otimiza[cç][aã]o de processos?")),
    ("recruitment-services", "serviços de recrutamento", (r"recruitment services?", r"talent acquisition and recruitment", r"servi[cç]os? de recrutamento", r"recrutamento e sele[cç][aã]o")),
    ("hr-consulting", "consultoria de recursos humanos", (r"HR consulting", r"human resources consulting", r"people strategy consulting", r"consultoria de recursos humanos", r"consultoria em RH")),
    ("training-services", "serviços de treinamento corporativo", (r"corporate training services?", r"professional training services?", r"servi[cç]os? de treinamento corporativo", r"treinamento profissional para empresas")),
    ("corporate-legal-services", "serviços jurídicos empresariais", (r"corporate legal services?", r"business law services?", r"servi[cç]os? jur[ií]dicos empresariais?", r"assessoria jur[ií]dica para empresas")),
    ("intellectual-property-services", "serviços de propriedade intelectual", (r"intellectual property services?", r"IP law and trademark services?", r"servi[cç]os? de propriedade intelectual", r"registro de marcas? e patentes?")),
    ("financial-consulting", "consultoria financeira", (r"financial consulting", r"financial advisory services?", r"consultoria financeira", r"assessoria financeira")),
    ("financial-planning-services", "planejamento financeiro", (r"financial planning services?", r"personal financial planning", r"servi[cç]os? de planejamento financeiro", r"planejamento financeiro pessoal")),
    ("insurance-brokerage", "corretagem de seguros", (r"insurance brokerage", r"insurance broker(?:age)? services?", r"corretagem de seguros", r"intermedia[cç][aã]o de seguros")),
    ("investment-advisory", "consultoria de investimentos", (r"investment advisory services?", r"investment advice", r"consultoria de investimentos", r"assessoria de investimentos")),
    ("managed-it-services", "serviços gerenciados de TI", (r"managed IT services?", r"managed technology services?", r"technology management services?", r"server management services?", r"servi[cç]os? gerenciados de TI", r"gest[aã]o de TI terceirizada")),
    ("it-support-services", "suporte técnico de TI", (r"IT support(?: services?)?", r"technical support for businesses", r"help ?desk support", r"IT help ?desk", r"servi[cç]os? de suporte de TI", r"suporte t[eé]cnico para empresas")),
    ("it-outsourcing", "terceirização de TI", (r"IT outsourcing", r"technology outsourcing services?", r"terceiriza[cç][aã]o de TI", r"outsourcing de tecnologia")),
    ("it-consulting-services", "consultoria de TI", (r"IT consulting", r"technology consulting", r"information technology consulting", r"consultoria de TI", r"consultoria de tecnologia da informa[cç][aã]o")),
    ("systems-integration", "integração de sistemas", (r"systems integration services?", r"system integration", r"servi[cç]os? de integra[cç][aã]o de sistemas", r"integra[cç][aã]o de sistemas empresariais")),
    ("erp-consulting", "consultoria e implementação ERP", (r"ERP consulting", r"ERP implementation(?: and consulting)?", r"SAP implementation", r"SAP consulting", r"consultoria ERP", r"implanta[cç][aã]o(?: e consultoria)? de ERP", r"implanta[cç][aã]o de SAP")),
    ("crm-consulting", "consultoria e implementação CRM", (r"CRM consulting", r"CRM implementation(?: and consulting)?", r"consultoria CRM", r"implanta[cç][aã]o(?: e consultoria)? de CRM")),
    ("data-analytics-services", "serviços de análise de dados", (r"data analytics services?", r"business intelligence and analytics services?", r"servi[cç]os? de an[aá]lise de dados", r"intelig[eê]ncia de neg[oó]cios e an[aá]lise de dados")),
    ("data-engineering", "engenharia de dados", (r"data engineering services?", r"data pipeline development", r"servi[cç]os? de engenharia de dados", r"desenvolvimento de pipelines? de dados")),
    ("ai-consulting", "consultoria em inteligência artificial", (r"AI consulting", r"artificial intelligence consulting", r"consultoria em intelig[eê]ncia artificial", r"consultoria em IA")),
    ("ai-development", "desenvolvimento sob medida de soluções de inteligência artificial", (r"custom AI development services?", r"custom artificial intelligence development", r"develop(?:s|ing)? custom AI solutions for clients", r"AI solution development services?", r"desenvolvimento sob medida de solu[cç][oõ]es? de intelig[eê]ncia artificial", r"desenvolvimento de IA sob medida para empresas")),
    ("brand-strategy", "estratégia de marca", (r"brand strategy", r"brand positioning", r"estrat[eé]gia de marca", r"posicionamento de marca")),
    ("branding-services-specific", "branding e identidade de marca", (r"branding services?", r"brand identity (?:design|development|services?)", r"branding and (?:strategy|design)", r"(?<!employer )branding", r"identidade de marca")),
    ("rebranding", "reposicionamento e rebranding", (r"rebranding", r"brand repositioning", r"reposicionamento de marca", r"rebranding de marcas?")),
    ("employer-branding", "employer branding", (r"employer branding", r"employer brand strategy", r"marca empregadora")),
    ("advertising-services-specific", "serviços de publicidade", (r"advertising services?", r"advertising agency services", r"servi[cç]os? de publicidade", r"ag[eê]ncia de publicidade")),
    ("full-service-advertising", "publicidade integrada", (r"full[- ]service advertising", r"integrated advertising campaigns?", r"publicidade integrada", r"campanhas? publicit[aá]rias? completas?")),
    ("advertising-campaign", "campanhas publicitárias", (r"advertising campaigns?", r"campaign planning and execution", r"campanhas? publicit[aá]rias?", r"planejamento de campanhas?")),
    ("creative-advertising", "criação publicitária", (r"creative advertising", r"advertising creative (?:services?|production)", r"cria[cç][aã]o publicit[aá]ria")),
    ("advertising-production", "produção de conteúdo publicitário", (r"advertising production", r"commercial production", r"produ[cç][aã]o publicit[aá]ria")),
    ("360-advertising", "publicidade integrada 360°", (r"360[- ]degree advertising", r"360[°º] advertising", r"full[- ]service advertising agency", r"publicidade 360")),
    ("brand-activation", "ativação de marca", (r"brand activation", r"experiential marketing", r"ativa[cç][aã]o de marca")),
    ("affiliate-marketing", "marketing de afiliados", (r"affiliate marketing", r"affiliate program management", r"marketing de afiliados")),
    ("b2b-marketing", "marketing B2B", (r"B2B marketing", r"business[- ]to[- ]business marketing", r"marketing B2B")),
    ("blockchain-marketing", "marketing para blockchain e cripto", (r"blockchain marketing", r"crypto marketing", r"marketing de blockchain", r"marketing para criptomoedas")),
    ("luxury-marketing", "marketing de luxo", (r"luxury marketing", r"luxury brand marketing", r"marketing de luxo")),
    ("sports-marketing", "marketing esportivo", (r"sports marketing", r"sports sponsorship marketing", r"marketing esportivo")),
    ("marketing-services-specific", "serviços de marketing", (r"marketing services", r"marketing strategy and execution", r"marketing agency", r"marketing consulting and services", r"integrated marketing (?:services|solutions|campaigns)", r"digital marketing services", r"servi[cç]os? de marketing", r"ag[eê]ncia de marketing", r"estrat[eé]gia e execu[cç][aã]o de marketing", r"solu[cç][oõ]es? integradas? de marketing")),
    ("design-services-specific", "serviços de design", (r"design services", r"graphic design", r"design studio (?:for clients|providing)", r"servi[cç]os? de design", r"design gr[aá]fico")),
    ("logo-design", "design de logotipos", (r"logo design", r"logo and visual identity design", r"cria[cç][aã]o de logotipos?")),
    ("brochure-design", "design de brochuras e materiais impressos", (r"brochure design", r"brochure and print design", r"design de brochuras?", r"design de folhetos")),
    ("print-design", "design para impressão", (r"print design", r"print media design", r"design para impress[aã]o")),
    ("illustration", "serviços de ilustração", (r"illustration services?", r"custom illustrations?", r"servi[cç]os? de ilustra[cç][aã]o", r"ilustra[cç][aã]o personalizada")),
    ("merchandising", "design de merchandising", (r"merchandising design", r"product merchandising design", r"design de merchandising")),
    ("event-photography", "fotografia de eventos", (r"event photography", r"event and corporate photography", r"fotografia de eventos?")),
    ("fashion-photography", "fotografia de moda", (r"fashion photography", r"fotografia de moda")),
    ("food-photography", "fotografia gastronômica", (r"food photography", r"culinary photography", r"fotografia gastron[oô]mica", r"fotografia de alimentos?")),
    ("photo-editing", "edição e retoque de fotografias", (r"photo editing services?", r"professional photo retouching", r"edi[cç][aã]o de fotografias?", r"retoque profissional de fotos?")),
    ("photography-services-specific", "serviços de fotografia", (r"photography services", r"commercial photography", r"servi[cç]os? de fotografia", r"fotografia comercial")),
    ("product-photography", "fotografia de produtos", (r"product photography", r"e-?commerce product photography", r"fotografia de produtos?")),
    ("user-experience-ux-ui-specific", "design UX/UI", (r"UX/UI design", r"user experience design services", r"UX and UI design", r"design de UX/UI")),
    ("ux-design", "design de experiência do usuário", (r"UX design", r"user experience design", r"design de experi[eê]ncia do usu[aá]rio")),
    ("ux-optimization", "otimização de experiência do usuário", (r"UX optimization", r"conversion and user experience optimization", r"otimiza[cç][aã]o de UX")),
    ("user-testing", "testes com usuários", (r"user testing", r"user research and testing", r"testes? com usu[aá]rios")),
    ("usability-testing", "testes de usabilidade", (r"usability testing", r"usability studies", r"testes? de usabilidade")),
    ("interface-testing", "testes de interface", (r"interface testing", r"UI testing", r"testes? de interface")),
    ("web-design-services-specific", "design de websites", (r"web design(?: services?)?", r"website design services", r"web design agency", r"design de websites?", r"design de sites?")),
    ("landing-page-design", "design de landing pages", (r"landing page design", r"landing page optimization", r"design de landing pages?")),
    ("website-revamping", "reformulação de websites", (r"website redesign", r"website revamp(?:ing)?", r"redesign de websites?", r"reformula[cç][aã]o de sites?")),
    ("web-development-services-specific", "desenvolvimento web", (r"web development(?: services?)?", r"website development", r"web development agency", r"desenvolvimento web", r"desenvolvimento de websites?", r"cria[cç][aã]o e desenvolvimento de sites?")),
    ("front-end-development", "desenvolvimento front-end", (r"front[- ]end development", r"frontend development services", r"desenvolvimento front[- ]end")),
    ("webflow-development", "desenvolvimento Webflow", (r"Webflow development", r"Webflow website design and development", r"desenvolvimento em Webflow")),
    ("wordpress-development", "desenvolvimento WordPress", (r"WordPress development", r"WordPress website development", r"desenvolvimento WordPress")),
    ("ecommerce-development", "desenvolvimento de e-commerce", (r"e-?commerce development", r"e-?commerce platform development", r"desenvolvimento de e-?commerce")),
    ("shopify-development", "desenvolvimento Shopify", (r"Shopify development", r"Shopify store development", r"desenvolvimento de lojas? Shopify")),
    ("dropshipping", "consultoria e implementação de dropshipping", (r"dropshipping business setup", r"dropshipping consulting", r"implementa[cç][aã]o de opera[cç][oõ]es? de dropshipping")),
    ("ecommerce-consulting", "consultoria de e-commerce", (r"e-?commerce consulting", r"e-?commerce strategy consulting", r"consultoria de e-?commerce")),
    ("ecommerce-services-specific", "serviços de e-commerce", (r"e-?commerce services", r"e-?commerce solutions for clients", r"servi[cç]os? de e-?commerce")),
    ("e-commerce-hosting", "hospedagem para e-commerce", (r"e-?commerce hosting", r"hosting services for online stores", r"hospedagem de e-?commerce")),
    ("web-hosting-management", "hospedagem e gestão web", (r"web hosting management", r"managed web hosting", r"website hosting and management", r"hospedagem e gest[aã]o de sites?")),
    ("programming", "serviços de programação", (r"programming services", r"custom programming", r"servi[cç]os? de programa[cç][aã]o")),
    ("prototype-development", "desenvolvimento de protótipos", (r"prototype development", r"software prototyping services", r"desenvolvimento de prot[oó]tipos?")),
    ("mobile-app-development", "desenvolvimento de aplicativos móveis", (r"mobile app development", r"mobile application development", r"desenvolvimento de aplicativos? m[oó]veis?")),
    ("iot-development", "desenvolvimento de soluções IoT", (r"IoT development", r"Internet of Things development", r"desenvolvimento de solu[cç][oõ]es? IoT")),
    ("blockchain-development", "desenvolvimento blockchain", (r"blockchain development", r"blockchain application development", r"desenvolvimento blockchain")),
    ("ethereum", "desenvolvimento Ethereum", (r"Ethereum development", r"Ethereum application development", r"desenvolvimento Ethereum")),
    ("smart-contract-development", "desenvolvimento de smart contracts", (r"smart contract development", r"smart contracts? auditing and development", r"desenvolvimento de smart contracts?")),
    ("blockchain-consulting", "consultoria blockchain", (r"blockchain consulting", r"blockchain strategy consulting", r"consultoria blockchain")),
    ("initial-coin-offering-consulting", "consultoria para ICO", (r"ICO consulting", r"initial coin offering consulting", r"consultoria para ICO")),
    ("web3-development", "desenvolvimento Web3", (r"Web3 development", r"Web3 application development", r"desenvolvimento Web3")),
    ("aws-consulting", "consultoria AWS", (r"AWS consulting", r"AWS migration services", r"Amazon Web Services consulting", r"consultoria AWS", r"migra[cç][aã]o para AWS")),
    ("azure-consulting", "consultoria Azure", (r"Azure consulting", r"Azure migration services", r"Microsoft Azure consulting", r"consultoria Azure", r"migra[cç][aã]o para Azure")),
    ("cloud-consulting-services-specific", "consultoria em nuvem", (r"cloud consulting(?: services)?", r"cloud strategy and migration consulting", r"cloud migration (?:consulting|services?)", r"cloud migration", r"consultoria em nuvem", r"consultoria cloud", r"migra[cç][aã]o para nuvem")),
    ("cloud-security", "segurança em nuvem", (r"cloud security services", r"cloud security consulting", r"servi[cç]os? de seguran[cç]a em nuvem")),
    ("cloud-storage", "armazenamento em nuvem", (r"cloud storage services", r"cloud storage solutions for clients", r"servi[cç]os? de armazenamento em nuvem")),
    ("saas-strategy-consulting", "consultoria de estratégia SaaS", (r"SaaS strategy consulting", r"SaaS business consulting", r"consultoria de estrat[eé]gia SaaS")),
    ("cyber-security-services-specific", "serviços de cibersegurança", (r"cyber ?security services", r"cybersecurity consulting", r"cybersecurity solutions for (?:businesses|clients)", r"managed security services", r"servi[cç]os? de ciberseguran[cç]a", r"consultoria em seguran[cç]a cibern[eé]tica")),
    ("penetration-testing", "testes de intrusão", (r"penetration testing", r"pen[- ]testing services", r"security penetration tests?", r"testes? de intrus[aã]o")),
    ("digital-forensics", "perícia digital", (r"digital forensics", r"digital forensic investigation", r"per[ií]cia digital", r"investiga[cç][aã]o forense digital")),
    ("account-takeover-prevention-ato", "prevenção contra tomada de contas", (r"account takeover prevention", r"ATO prevention services", r"preven[cç][aã]o de tomada de contas")),
    ("auth0-iam-solution", "serviços de identidade Auth0", (r"Auth0 implementation services", r"Auth0 consulting", r"Auth0 identity management services")),
    ("data-protection", "proteção de dados e privacidade", (r"data protection services", r"data privacy consulting", r"privacy compliance services", r"servi[cç]os? de prote[cç][aã]o de dados", r"consultoria em privacidade")),
]

VERB = re.compile(
    r"\b(?:offers?|provides?|services? include|expertise in|"
    r"delivers?|helps? (?:clients|brands|businesses) (?:with|to)|works? with clients on|"
    r"develops? for clients|oferece(?:m)?|presta(?:m)?|desenvolve(?:m)?|atua(?:m)? com|"
    r"servi[cç]os? incluem|servi[cç]os? de|trabalha(?:m)? com)\b", re.I)
SPECIALIZES_OR_FOCUSES = re.compile(
    r"\b(?:speciali[sz](?:es?|ing) in|focus(?:es|ed|ing)? on|"
    r"especializad[oa]s? em|especializa(?:da|do)? em|focad[oa]s? em|concentra(?:da|do)? em)\b", re.I)
NEGATED = re.compile(r"\b(?:does not|do not|doesn't|don't|no longer|not offer|not provide|não oferece|nao oferece|não presta|nao presta)\b", re.I)
PROVIDER = re.compile(
    r"\b(?:agency|agencies|ag[eê]ncia|consultancy|consulting firm|consulting company|"
    r"software development company|software development firm|development studio|"
    r"design studio|design firm|creative studio|marketing company|marketing firm|"
    r"advertising company|advertising firm|production studio|photography studio|"
    r"IT services company|IT solutions provider|IT consultancy|IT consulting(?: and corporate technology)? company|technology services company|"
    r"information technology (?:and )?services company|software house|consulting and services firm|"
    r"accounting firm|accountancy firm|law firm|business consulting firm|insurance broker|HR (?:consultancy|consulting firm)|cybersecurity (?:consulting )?(?:firm|company)|data services company|"
    r"consultoria|empresa de (?:tecnologia|software|marketing|publicidade|design)|"
    r"est[uú]dio (?:criativo|de design|de desenvolvimento|de produ[cç][aã]o)|"
    r"provedor(?:a)? de servi[cç]os)\b", re.I)
PRODUCT_OPENER = re.compile(r"\b(?:SaaS company|software product|marketplace|platform|digital bank|fintech platform|app that|software that)\b", re.I)
GENERIC = {"agency", "agencies", "agencia", "consultancy", "consulting", "marketing", "digital", "tecnologia", "technology", "solutions", "solution", "ltda", "brazil", "brasil", "grupo", "group", "studio", "company", "services", "service", "software", "design", "creative", "it", "the", "and", "for", "com", "uma", "para", "brasileira", "brasileiro", "advocacia", "advogados", "contabilidade", "consultoria", "consultores", "associados"}
TOKEN = re.compile(r"[a-z0-9]+")


def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+|[\r\n]+", clean(text)) if s.strip()]


def classify(row, allowed_slugs):
    name = clean(row.get("name"))
    description = clean(row.get("description"))
    opener = description[:350]
    name_tokens = {t for t in TOKEN.findall(ascii_fold(name)) if len(t) >= 3 and t not in GENERIC}
    opener_tokens = set(TOKEN.findall(ascii_fold(opener)))
    identity_ok = bool(name_tokens and name_tokens & opener_tokens)
    if "&" in name and len(name_tokens) > 1:
        identity_ok = name_tokens <= opener_tokens
    product_opener = bool(PRODUCT_OPENER.search(opener))
    provider_ok = bool(PROVIDER.search(opener))
    found = {}
    if identity_ok and (not product_opener or provider_ok):
        for sentence in sentences(description):
            has_offer_verb = bool(VERB.search(sentence)) or (provider_ok and bool(SPECIALIZES_OR_FOCUSES.search(sentence)))
            if not has_offer_verb or NEGATED.search(sentence):
                continue
            folded = ascii_fold(sentence)
            for slug, label, phrases in RULES:
                if slug in {"data-analytics-services", "ai-development"} and not provider_ok:
                    continue
                if slug == "ecommerce-services-specific" and not re.search(
                    r"\b(?:offers?|provides?|delivers?|services? include)\s+"
                    r"(?:(?:comprehensive|specialized|integrated|customized|professional|tailored|its|our|end-to-end)\s+){0,4}"
                    r"e-?commerce services?\b|"
                    r"\b(?:oferece(?:m)?|presta(?:m)?|fornece(?:m)?)\s+"
                    r"(?:servicos? de e-?commerce)\b", folded, re.I
                ):
                    continue
                if slug in allowed_slugs and any(re.search(r"(?<!\w)(?:" + p + r")(?!\w)", folded, re.I) for p in phrases):
                    found.setdefault(slug, (label, sentence))
    gate_ok = (provider_ok or bool(found)) and (not product_opener or provider_ok) and identity_ok
    if not gate_ok:
        found = {}
    selected = list(found)[:3]
    labels = [found[slug][0] for slug in selected]
    description_pt = f"{name} oferece {', '.join(labels)} como parte de seus serviços." if labels else ""
    if len(description_pt) < 40 or len(description_pt) > 650:
        selected, description_pt = [], ""
    if selected:
        reason = "explicit offered services"
    elif not name_tokens:
        reason = "abstained: no identity tokens to verify"
    elif not identity_ok:
        reason = "abstained: company identity mismatch"
    elif product_opener:
        reason = "abstained: product vendor"
    elif not PROVIDER.search(opener):
        reason = "abstained: no service-provider identity"
    elif not any(VERB.search(s) and not NEGATED.search(s) for s in sentences(description)):
        reason = "abstained: no explicit offered service"
    else:
        reason = "abstained: no matching taxonomy leaf"
    return {
        "id": row.get("id"), "categories": selected, "description_pt": description_pt,
        "reason": reason,
        "evidence": [{"slug": slug, "quote": found[slug][1]} for slug in selected],
        "exclude": not bool(selected), "excludedcats": sorted(set(found) - set(selected)),
    }


def classify_company(row, allowed_slugs):
    service = classify(row, allowed_slugs)
    if not service['exclude']:
        return service
    software = classify_software(row, allowed_slugs)
    if not software['exclude']:
        return software
    service['software_reason'] = software['reason']
    return service


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
                    target.write(json.dumps(classify_company(json.loads(line), allowed), ensure_ascii=False, separators=(",", ":")) + "\n")
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f"classify_remaining.py: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
