#!/usr/bin/env python3
"""Build a short-lived, authenticated Edge bundle without exposing credentials."""

import argparse
import hashlib
import json
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path


def bundle(directory):
    run = Path(directory)
    manifest = json.loads((run / 'manifest.json').read_text())
    payload = (run / 'payload.json').read_bytes()
    if manifest['target_project'] != 'cnagsmkfjkxyxlefrkhu':
        raise ValueError('Wrong project')
    if hashlib.sha256(payload).hexdigest() != manifest['payload_sha256']:
        raise ValueError('Payload changed after approval')
    output = run / 'edge-bundle'
    output.mkdir(mode=0o700)
    token = secrets.token_hex(32)
    expiry = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    source = Path(__file__).with_name('edge-import.js').read_text()
    source = source.replace('__TOKEN_SHA256__', hashlib.sha256(token.encode()).hexdigest(), 1)
    source = source.replace('__EXPIRES_AT__', expiry, 1)
    (output / 'main.js').write_text(source)
    (output / 'payload.json').write_bytes(payload)
    authorization = run / 'authorization.json'
    authorization.write_text(json.dumps(dict(token=token, expires_at=expiry)))
    authorization.chmod(0o600)
    print('Bundle prepared; authorization saved privately. Expiry: ' + expiry)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', required=True)
    bundle(parser.parse_args().directory)
