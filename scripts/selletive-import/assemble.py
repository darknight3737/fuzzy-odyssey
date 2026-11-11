#!/usr/bin/env python3
"""Validate reviewed Apollo decisions and assemble an immutable import payload."""

import argparse
import csv
import hashlib
import json
import re
import unicodedata
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

from prepare import clean, normalize_phone, normalize_state, website_domain

NAMESPACE = uuid.UUID('d2181ad8-7618-4fe3-8c55-1e08eaefc718')
EXTRA_CATEGORIES = {
    'seo-services': ('SEO', 'marketing-services'),
    'ppc-sem': ('Mídia paga e SEM', 'marketing-services'),
    'social-media-marketing': ('Marketing em redes sociais', 'marketing-services'),
    'content-marketing': ('Marketing de conteúdo', 'marketing-services'),
    'email-marketing': ('E-mail marketing', 'marketing-services'),
    'video-production': ('Produção de vídeo', 'video-services'),
    'software-development': ('Desenvolvimento de software', 'software-development-services'),
    'mobile-app-development': ('Desenvolvimento de aplicativos', 'software-development-services'),
}
EXTRA_BRANCHES = {
    'video-services': ('Vídeo e animação', 'creative-visual'),
    'software-development-services': ('Software e aplicativos', 'development-product'),
}
STATE_NAMES = dict(zip(
    'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(),
    ['Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
     'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
     'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
     'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
     'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'],
))


def slug(value):
    folded = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode().lower()
    return re.sub('[^a-z0-9]+', '-', folded).strip('-')


def stable_id(kind, key):
    return str(uuid.uuid5(NAMESPACE, kind + ':' + key))


def optional_url(value):
    value = clean(value)
    parsed = urlsplit(value)
    return value if parsed.scheme in ('https', 'http') and parsed.hostname else None


def optional_int(value, minimum, maximum):
    value = clean(value)
    return int(value) if value.isdigit() and minimum <= int(value) <= maximum else None


def assemble(args):
    directory = Path(args.directory)
    payload_path = directory / 'payload.json'
    if payload_path.exists():
        raise ValueError('payload.json already exists; use a new run directory')
    candidates = {r['id']: r for r in map(json.loads, (directory / 'candidates.ndjson').read_text().splitlines())}
    decisions = [json.loads(line) for file in args.decisions for line in Path(file).read_text().splitlines() if line.strip()]
    ids = [d['id'] for d in decisions]
    if len(set(ids)) != len(ids) or set(ids) != set(candidates):
        raise ValueError('Decisions must cover every candidate exactly once')
    sources = {}
    with open(args.input, encoding='utf-8-sig', newline='') as source:
        for record in csv.DictReader(source):
            selected = candidates.get(record['Apollo Account Id'])
            if selected and (clean(record['Company Name']), website_domain(record['Website']), clean(record['Company City']), normalize_state(record['Company State'])) == (selected['name'], selected['domain'], selected['city'], selected['state']):
                sources.setdefault(record['Apollo Account Id'], record)
    if set(sources) != set(candidates):
        raise ValueError('Source identity changed after candidate preparation')
    categories = {r['slug']: r for r in json.loads((directory / 'categories.json').read_text())}
    existing_locations = {r['slug']: r for r in json.loads((directory / 'locations.json').read_text())}
    new_categories, locations, businesses, category_links, location_links = {}, {}, [], [], []
    seen_domains = set()
    timestamp = datetime.now(timezone.utc).isoformat()

    def category(key):
        if key not in categories:
            name, parent = (EXTRA_BRANCHES if key in EXTRA_BRANCHES else EXTRA_CATEGORIES)[key]
            parent_category = category(parent)
            categories[key] = dict(id=stable_id('category', key), name=name, slug=key,
                                   parent_id=parent_category['id'], level=2 if key in EXTRA_BRANCHES else 3, is_active=True)
            new_categories[key] = categories[key]
        return categories[key]

    def location(name, key, kind, parent=None, state=None):
        if key not in locations:
            existing = existing_locations.get(key)
            if existing and (existing['type'] != kind or existing['parent_id'] != parent):
                raise ValueError('Location hierarchy conflict: ' + key)
            locations[key] = existing or dict(id=stable_id('location', key), name=name, slug=key,
                                             type=kind, parent_id=parent, country_code='br', state_code=state)
        return locations[key]

    for decision in decisions:
        if type(decision.get('exclude')) is not bool:
            raise ValueError('Missing explicit exclude decision')
        if decision['exclude']:
            continue
        row, source = candidates[decision['id']], sources[decision['id']]
        keys = decision['categories']
        if not 1 <= len(keys) <= 3 or len(set(keys)) != len(keys):
            raise ValueError('Select 1–3 distinct specific categories')
        for key in keys:
            if key not in EXTRA_CATEGORIES and (key not in categories or categories[key]['level'] != 3 or not categories[key]['is_active']):
                raise ValueError('Unknown/inactive specific category: ' + key)
        description = clean(decision['description_pt'])
        if not 40 <= len(description) <= 650:
            raise ValueError('Invalid Portuguese description: ' + row['name'])
        if row['domain'] in seen_domains:
            raise ValueError('Duplicate domain')
        seen_domains.add(row['domain'])
        if source['Company Country'] != 'Brazil' or row['state'] not in STATE_NAMES:
            raise ValueError('Pilot requires a known Brazilian location')
        business_id = stable_id('apollo', row['id'])
        businesses.append(dict(
            id=business_id, name=row['name'], slug=slug(row['name'])[:140] + '-' + row['id'][-8:],
            description=description, website=optional_url(source['Website']),
            phone=normalize_phone(source['Company Phone'], 'Brazil') or None,
            logo_url=optional_url(source['Logo Url']),
            employee_count=optional_int(source['# Employees'], 0, 10000000),
            founded_year=optional_int(source['Founded Year'], 1800, datetime.now().year),
            address=dict(city=row['city'], state=row['state'], country='BR'),
            account_id=None, tier='unclaimed', verification_status='pending', domain_rating=0,
            created_at=timestamp, updated_at=timestamp,
        ))
        assigned = set()
        for order, key in enumerate(keys):
            current = category(key)
            leaf = True
            visited, expected_level = set(), 3
            while current:
                if current['id'] in visited or current['level'] != expected_level or not current['is_active']:
                    raise ValueError('Invalid category ancestry: ' + key)
                visited.add(current['id'])
                if current['id'] not in assigned:
                    category_links.append(dict(business_id=business_id, category_id=current['id'],
                                               is_primary=leaf and order == 0, display_order=order if leaf else 10 + current['level']))
                    assigned.add(current['id'])
                parent = current['parent_id']
                if bool(parent) != (expected_level > 1):
                    raise ValueError('Incomplete category ancestry: ' + key)
                current = next((c for c in categories.values() if c['id'] == parent), None) if parent else None
                if parent and current is None:
                    raise ValueError('Missing category ancestor: ' + key)
                expected_level -= 1
                leaf = False
        country = location('Brasil', 'brazil-br', 'country')
        state_code = row['state'].lower()
        state = location(STATE_NAMES[row['state']], 'estado-de-' + slug(STATE_NAMES[row['state']]) + '-' + state_code + '-br', 'state', country['id'], state_code)
        city = location(row['city'], slug(row['city']) + '-' + state_code + '-br', 'city', state['id'], state_code)
        for place in [country, state, city]:
            location_links.append(dict(business_id=business_id, location_id=place['id'], is_primary=place['type'] == 'city'))
    if not 200 <= len(businesses) <= 600:
        raise ValueError('Pilot requires 200–600 approved companies')
    payload = dict(categories=list(new_categories.values()), locations=sorted(locations.values(), key=lambda r: {'country': 0, 'state': 1, 'city': 2}[r['type']]),
                   businesses=businesses, business_categories=category_links, business_locations=location_links)
    encoded = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
    payload_path.write_text(encoded)
    payload_path.chmod(0o600)
    manifest = dict(target_project='cnagsmkfjkxyxlefrkhu', source='Apollo', prepared_at=timestamp,
                    input_sha256=hashlib.sha256(Path(args.input).read_bytes()).hexdigest(),
                    payload_sha256=hashlib.sha256(encoded.encode()).hexdigest(),
                    candidate_count=len(candidates), approved_count=len(businesses),
                    businesses=[dict(id=b['id'], slug=b['slug']) for b in businesses])
    (directory / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    print(json.dumps({key: len(value) for key, value in payload.items()}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True)
    parser.add_argument('--directory', required=True)
    parser.add_argument('--decisions', nargs='+', required=True)
    assemble(parser.parse_args())
