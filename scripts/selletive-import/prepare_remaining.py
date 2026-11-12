#!/usr/bin/env python3
"""Account for every CSV row and prepare only new, usable Brazilian companies."""
import argparse
import collections
import csv
import json
from pathlib import Path
from uuid import UUID, uuid5

from prepare import clean, normalize_state, website_domain

NAMESPACE = UUID('d2181ad8-7618-4fe3-8c55-1e08eaefc718')


def prepare_remaining(input_path, snapshot_path, directory):
    root = Path(directory)
    root.mkdir(parents=True, exist_ok=True, mode=0o700)
    outputs = [root / 'candidates.ndjson', root / 'ledger-prepared.json']
    if any(p.exists() for p in outputs):
        raise ValueError('Preparation already exists; use a new directory')
    live = json.loads(Path(snapshot_path).read_text())
    live_ids = {r['id'] for r in live}
    live_domains = {website_domain(r.get('website')) for r in live} - {''}
    candidates, ledger, seen_ids, seen_domains = [], [], set(), set()
    with open(input_path, encoding='utf-8-sig', newline='') as source:
        for index, row in enumerate(csv.DictReader(source), 2):
            identity = clean(row['Apollo Account Id'])
            name = clean(row['Company Name'])
            domain = website_domain(row['Website'])
            state = normalize_state(row['Company State'])
            status = 'candidate'
            if str(uuid5(NAMESPACE, 'apollo:' + identity)) in live_ids or domain in live_domains:
                status = 'already_published'
            elif identity in seen_ids or (domain and domain in seen_domains):
                status = 'duplicate'
            elif not identity or not name:
                status = 'missing_identity'
            elif row['Company Country'] != 'Brazil':
                status = 'outside_brazil'
            elif not domain:
                status = 'invalid_website'
            elif not clean(row['Short Description']):
                status = 'missing_description'
            if status == 'candidate':
                seen_ids.add(identity)
                seen_domains.add(domain)
                candidates.append(dict(id=identity, name=name, domain=domain,
                                       industry=clean(row['Industry']), city=clean(row['Company City']),
                                       state=state, description=clean(row['Short Description'])))
            ledger.append(dict(csv_row=index, id=identity, name=name, domain=domain, status=status))
    outputs[0].write_text(''.join(json.dumps(x, ensure_ascii=False) + '\n' for x in candidates))
    outputs[1].write_text(json.dumps(ledger, ensure_ascii=False))
    for p in outputs:
        p.chmod(0o600)
    print(json.dumps(dict(total=len(ledger), candidates=len(candidates),
                          status=collections.Counter(x['status'] for x in ledger))))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True)
    parser.add_argument('--existing-businesses', required=True)
    parser.add_argument('--directory', required=True)
    args = parser.parse_args()
    prepare_remaining(args.input, args.existing_businesses, args.directory)
