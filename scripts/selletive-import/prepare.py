#!/usr/bin/env python3
"""Prepare an Apollo accounts CSV for a reviewed Selletive import."""

import argparse
import csv
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit


STATE_CODES = {
    "acre": "AC", "alagoas": "AL", "amapa": "AP", "amazonas": "AM",
    "bahia": "BA", "ceara": "CE", "distrito federal": "DF",
    "espirito santo": "ES", "goias": "GO", "maranhao": "MA",
    "mato grosso": "MT", "mato grosso do sul": "MS", "minas gerais": "MG",
    "para": "PA", "paraiba": "PB", "parana": "PR", "pernambuco": "PE",
    "piaui": "PI", "rio de janeiro": "RJ", "rio grande do norte": "RN",
    "rio grande do sul": "RS", "rondonia": "RO", "roraima": "RR",
    "santa catarina": "SC", "sao paulo": "SP", "sergipe": "SE",
    "tocantins": "TO",
}
STATE_NAMES = {
    "AC": "acre", "AL": "alagoas", "AP": "amapa", "AM": "amazonas",
    "BA": "bahia", "CE": "ceara", "DF": "distrito federal", "ES": "espirito santo",
    "GO": "goias", "MA": "maranhao", "MT": "mato grosso", "MS": "mato grosso do sul",
    "MG": "minas gerais", "PA": "para", "PB": "paraiba", "PR": "parana",
    "PE": "pernambuco", "PI": "piaui", "RJ": "rio de janeiro",
    "RN": "rio grande do norte", "RS": "rio grande do sul", "RO": "rondonia",
    "RR": "roraima", "SC": "santa catarina", "SP": "sao paulo", "SE": "sergipe",
    "TO": "tocantins",
}
SOCIAL_DOMAINS = {
    "facebook.com", "instagram.com", "linkedin.com", "twitter.com", "x.com",
    "youtube.com", "youtu.be", "tiktok.com", "pinterest.com", "threads.net",
    "wa.me", "whatsapp.com", "linktr.ee", "linktree.com", "beacons.ai",
    "bit.ly", "tinyurl.com", "goo.gl", "medium.com", "substack.com",
    "wordpress.com", "blogspot.com", "wixsite.com", "wix.com", "squarespace.com",
    "sites.google.com", "google.com", "notion.site", "carrd.co", "my.canva.site",
}
MARKETING_TERMS = re.compile(
    r"\b(agency|agencies|agencia|ag[eê]ncia|marketing|advertising|public relations|"
    r"comunica[cç][aã]o|branding|seo|paid media|performance marketing|content marketing|"
    r"social media|digital strategy|demand generation|growth marketing|marketing services)\b", re.I
)
AGENCY_EVIDENCE = re.compile(
    r"\b(agency|agencies|ag[eê]ncia|full[- ]service|we help|our clients|marketing services|"
    r"advertising services|public relations|brand strategy|media buying|campaigns for clients)\b", re.I
)
IT_TERMS = re.compile(
    r"\b(information technology|it services|managed services|cybersecurity|"
    r"consulting|systems integration|cloud services|network services|it consulting|"
    r"technology consulting|software development services)\b", re.I
)
SOFTWARE_ONLY = re.compile(
    r"\b(software|saas|platform|application|app)\b", re.I
)
WORD_RE = re.compile(r"[^a-z0-9]+")


def clean(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def ascii_fold(value):
    return (value.lower().replace("á", "a").replace("à", "a").replace("ã", "a")
            .replace("â", "a").replace("é", "e").replace("ê", "e").replace("í", "i")
            .replace("ó", "o").replace("ô", "o").replace("õ", "o").replace("ú", "u")
            .replace("ç", "c"))


def website_domain(value):
    raw = clean(value)
    if not raw:
        return ""
    candidate = raw if "://" in raw else "https://" + raw
    try:
        parsed = urlsplit(candidate)
        if parsed.scheme not in {"https", "http"} or parsed.username or parsed.password:
            return ""
        host = (parsed.hostname or "").lower().rstrip(".")
    except ValueError:
        return ""
    if host.startswith("www."):
        host = host[4:]
    if not host or "." not in host or any(c.isspace() for c in host):
        return ""
    if host in SOCIAL_DOMAINS or any(host.endswith("." + item) for item in SOCIAL_DOMAINS):
        return ""
    if host.endswith((".pages.dev", ".github.io", ".vercel.app", ".webflow.io", ".netlify.app")):
        return ""
    if not re.fullmatch(r"[a-z0-9.-]+", host) or ".." in host or host.startswith("."):
        return ""
    return host


def normalize_state(value):
    state = re.sub(r"^state of\s+", "", clean(value), flags=re.I).upper()
    if state in STATE_NAMES:
        return state
    return STATE_CODES.get(ascii_fold(state), "")


def normalize_phone(value, country):
    raw = clean(value)
    if not raw:
        return ""
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return ""
    if raw.startswith("+"):
        return "+" + digits
    if ascii_fold(country) in {"brazil", "brasil", "br"}:
        if digits.startswith("55") and len(digits) >= 12:
            return "+" + digits
        return "+55" + digits.lstrip("0")
    return digits


def candidate_type(industry, description, keywords):
    text = " ".join((industry, description, keywords))
    marketing = bool(MARKETING_TERMS.search(text))
    agency = bool(AGENCY_EVIDENCE.search(text))
    if marketing and agency:
        return "marketing"
    if IT_TERMS.search(text) and not SOFTWARE_ONLY.search(industry):
        return "it"
    # An IT services description can mention software; require service evidence in
    # the description and reject software product industries.
    if IT_TERMS.search(text) and not re.search(r"\b(software|saas|platform)\b", industry, re.I):
        return "it"
    return ""


def prepare(input_path, output_dir, limit):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    raw_rows = []
    with open(input_path, newline="", encoding="utf-8-sig") as source:
        reader = csv.DictReader(source)
        required = {"Apollo Account Id", "Company Name", "Website", "Industry", "Short Description"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise ValueError("Missing required CSV columns: " + ", ".join(sorted(missing)))
        for row in reader:
            raw_rows.append(row)

    eligible = []
    for row in raw_rows:
        company_id = clean(row.get("Apollo Account Id"))
        name = clean(row.get("Company Name"))
        domain = website_domain(row.get("Website"))
        industry = clean(row.get("Industry"))
        description = clean(row.get("Short Description"))
        city = clean(row.get("Company City"))
        state = normalize_state(row.get("Company State"))
        keywords = clean(row.get("Keywords"))
        country = clean(row.get("Company Country"))
        kind = candidate_type(industry, description, keywords)
        if not (company_id and name and domain and industry and city and state and description and kind):
            continue
        score = (4 if kind == "marketing" else 3) + (2 if AGENCY_EVIDENCE.search(" ".join((description, keywords))) else 0)
        score += 2 if len(description) >= 100 else 0
        score += 1 if clean(row.get("Company Phone")) else 0
        eligible.append((score, company_id, domain, row, kind))

    # Resolve duplicates after scoring, so the strongest usable source row wins.
    eligible.sort(key=lambda item: (-item[0], item[1], item[2]))
    selected, seen_ids, seen_domains = [], set(), set()
    for item in eligible:
        _, company_id, domain, _, _ = item
        if company_id in seen_ids or domain in seen_domains:
            continue
        seen_ids.add(company_id)
        seen_domains.add(domain)
        selected.append(item)
    selected = selected[:max(0, limit)]
    candidates = []
    full_rows = []
    for _, company_id, domain, row, kind in selected:
        description = clean(row.get("Short Description"))
        keywords = clean(row.get("Keywords"))
        candidates.append({
            "id": company_id,
            "name": clean(row.get("Company Name")),
            "domain": domain,
            "industry": clean(row.get("Industry")),
            "city": clean(row.get("Company City")),
            "state": normalize_state(row.get("Company State")),
            "description": description[:600],
            "keywords": keywords[:350],
        })
        full_rows.append({
            "id": company_id,
            "name": clean(row.get("Company Name")),
            "name_for_emails": clean(row.get("Company Name for Emails")),
            "domain": domain,
            "industry": clean(row.get("Industry")),
            "candidate_type": kind,
            "city": clean(row.get("Company City")),
            "state": normalize_state(row.get("Company State")),
            "country": clean(row.get("Company Country")),
            "description": clean(row.get("Short Description")),
            "keywords": clean(row.get("Keywords")),
            "phone": normalize_phone(row.get("Company Phone"), row.get("Company Country")),
            "employees": clean(row.get("# Employees")),
            "logo_url": clean(row.get("Logo Url")),
            "founded_year": clean(row.get("Founded Year")),
            "linkedin_url": clean(row.get("Company Linkedin Url")),
            "street": clean(row.get("Company Street")),
            "postal_code": clean(row.get("Company Postal Code")),
            "apollo_raw_industry": clean(row.get("Industry")),
        })

    candidates_path = out / "candidates.ndjson"
    rows_path = out / "rows.json"
    candidates_path.write_text("".join(json.dumps(x, ensure_ascii=False, separators=(",", ":")) + "\n" for x in candidates), encoding="utf-8")
    rows_path.write_text(json.dumps(full_rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    rows_path.chmod(0o600)
    print(f"Read {len(raw_rows)} rows; wrote {len(candidates)} candidates")
    print(f"Candidates: {candidates_path}")
    print(f"Private rows: {rows_path}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Apollo CSV export")
    parser.add_argument("--output-dir", required=True, help="Directory for generated files")
    parser.add_argument("--limit", type=int, default=400, help="Maximum candidate count (default: 400)")
    args = parser.parse_args()
    try:
        prepare(args.input, args.output_dir, args.limit)
    except (OSError, ValueError, csv.Error) as error:
        print(f"prepare.py: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
