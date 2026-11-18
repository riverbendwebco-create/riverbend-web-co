#!/usr/bin/env python3
"""Daily lead finder for riverbendwebcoleads.

Runs from .github/workflows/daily-leads.yml every morning. Searches free map data
around Dubuque (about 30 miles), checks each business's website, and saves up to
TARGET new leads into the Prospects sheet that riverbendwebco.com/leads reads.

Rules:
- Only independent businesses with a real phone number on the map.
- No duplicates: skips any id, name or phone already saved.
- No website and Facebook-only first, then weak websites.
"""
import concurrent.futures as cf
import datetime
import json
import os
import re
import sys
import time
import urllib.request

API = 'https://script.google.com/macros/s/AKfycbwkosfcFSHGXy8EUaAFZ7Q-SFDFllV_k4n8qBABRxoj2hv59RspTU9APLQabwP_ohaW/exec'
TARGET = int(os.environ.get('TARGET') or 50)
CATEGORIES = [
    ('Bars', 'bars'), ('Restaurants', 'restaurants'), ('Pizza', 'pizza'), ('Auto repair', 'auto repair'),
    ('Contractors', 'contractors'), ('Roofers', 'roofers'), ('Salons', 'hair salons'), ('Boutiques', 'boutiques'),
    ('Coffee', 'coffee shops'), ('Bakeries', 'bakeries'), ('Mexican', 'mexican restaurants'), ('Plumbers', 'plumbers'),
    ('Electricians', 'electricians'), ('HVAC', 'hvac'), ('Landscaping', 'landscaping'), ('Painters', 'painters'),
    ('Car washes', 'car wash'), ('Tattoo', 'tattoo shops'), ('Florists', 'florists'), ('Gift shops', 'gift shops'),
    ('Gyms', 'gyms'), ('Breweries', 'breweries and wineries'), ('BBQ', 'bbq restaurants'),
]
RANK = {'none': 0, 'social': 1, 'weak': 2}
LABEL = {'none': 'no website', 'social': 'Facebook only', 'weak': 'weak website'}


def call(body, tries=3):
    err = None
    for i in range(tries):
        try:
            req = urllib.request.Request(API, data=json.dumps(body).encode(), headers={'Content-Type': 'text/plain;charset=utf-8'})
            with urllib.request.urlopen(req, timeout=330) as r:
                return json.load(r)
        except Exception as e:  # network hiccup or Apps Script busy
            err = e
            time.sleep(6 * (i + 1))
    return {'ok': False, 'error': str(err)}


def norm(s):
    return re.sub(r'[^a-z0-9]', '', re.sub(r'^the\s+', '', str(s).lower().strip()).replace('&', 'and'))


def digits(p):
    d = re.sub(r'\D', '', str(p or ''))
    return d[-10:] if len(d) >= 10 else ''


def main():
    # No password: GitHub gives this job a signed ID token, and the backend checks it.
    url, bearer = os.environ.get('ACTIONS_ID_TOKEN_REQUEST_URL'), os.environ.get('ACTIONS_ID_TOKEN_REQUEST_TOKEN')
    if not url or not bearer:
        sys.exit('Run this from the Daily leads GitHub workflow (needs id-token: write).')
    req = urllib.request.Request(url + '&audience=riverbend-leads', headers={'Authorization': 'Bearer ' + bearer})
    with urllib.request.urlopen(req, timeout=30) as r:
        jwt = json.load(r)['value']
    login = call({'action': 'bot_login', 'jwt': jwt})
    if not login.get('ok'):
        sys.exit('Robot login failed: %s' % login.get('error'))
    tok = login['token']

    saved = call({'token': tok, 'action': 'leads_saved'})
    if not saved.get('ok'):
        sys.exit('Could not read saved leads: %s' % saved.get('error'))
    seen_ids = {l['id'] for l in saved['leads']}
    seen_names = {norm(l['name']) for l in saved['leads']}
    seen_phones = {digits(l['phone']) for l in saved['leads'] if digits(l['phone'])}

    def is_new(l):
        return l['id'] not in seen_ids and norm(l['name']) not in seen_names and digits(l.get('phone')) not in seen_phones

    pool, searched = [], []
    hot = 0
    for label, q in CATEGORIES:
        if hot >= TARGET:
            break
        r = call({'token': tok, 'action': 'leads_find', 'q': q, 'wide': True, 'fast': True})
        if not r.get('ok') and r.get('error') == 'busy':
            time.sleep(20)
            r = call({'token': tok, 'action': 'leads_find', 'q': q, 'wide': True, 'fast': True})
        if not r.get('ok'):
            print('skip %s: %s' % (label, r.get('error')))
            continue
        cands = [l for l in r['leads']
                 if not l.get('brand') and l.get('kind') != 'chain' and digits(l.get('phone')) and is_new(l)
                 and (l.get('pending') or l.get('kind') in RANK)]
        cands.sort(key=lambda l: (0 if l.get('searchPending') else 1, RANK.get(l.get('kind'), 3)))
        cands = cands[:48]
        batches = [cands[i:i + 4] for i in range(0, len(cands), 4)]
        checked = []
        with cf.ThreadPoolExecutor(max_workers=4) as ex:
            for res in ex.map(lambda b: call({'token': tok, 'action': 'leads_verify', 'leads': b}), batches):
                if res.get('ok'):
                    checked.extend(res['leads'])
        kept = 0
        for l in checked:
            if l.get('kind') not in RANK or not digits(l.get('phone')) or not is_new(l):
                continue
            l['category'] = label
            pool.append(l)
            seen_names.add(norm(l['name']))
            seen_phones.add(digits(l['phone']))
            kept += 1
            if l['kind'] in ('none', 'social'):
                hot += 1
        searched.append('%s %d' % (label, kept))
        print('%s: %d found, %d checked, %d new leads' % (label, len(r['leads']), len(checked), kept))

    pool.sort(key=lambda l: RANK[l['kind']])
    pick = pool[:TARGET]
    today = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-6))).strftime('%b %-d')
    added = []
    for l in pick:
        l['note'] = 'Daily finder %s: %s' % (today, LABEL[l['kind']])
        r = call({'token': tok, 'action': 'leads_save', 'lead': l})
        if r.get('ok') and not r.get('already'):
            added.append(l)

    by_kind = {k: sum(1 for l in added if l['kind'] == k) for k in RANK}
    by_cat = {}
    for l in added:
        by_cat[l['category']] = by_cat.get(l['category'], 0) + 1
    top = ['%s (%s, %s)' % (l['name'], l['category'], LABEL[l['kind']]) for l in added[:5]]
    summary = ('%d new leads added to riverbendwebco.com/leads for %s: %d no website, %d Facebook only, %d weak website. '
               'By type: %s. Top: %s.') % (
        len(added), today, by_kind['none'], by_kind['social'], by_kind['weak'],
        ', '.join('%s %d' % kv for kv in sorted(by_cat.items(), key=lambda kv: -kv[1])) or 'none',
        '; '.join(top) or 'none')
    if len(added) < TARGET:
        summary += ' Only %d were new today; the free map data around Dubuque is running low on new businesses with a phone number.' % len(added)
    print('SUMMARY: ' + summary)
    out = os.environ.get('GITHUB_STEP_SUMMARY')
    if out:
        with open(out, 'a') as f:
            f.write('## Daily leads\n\n' + summary + '\n\n| Business | Type | Lead | Phone |\n|---|---|---|---|\n')
            for l in added:
                f.write('| %s | %s | %s | %s |\n' % (l['name'], l['category'], LABEL[l['kind']], l.get('phone', '')))
    with open('daily-leads-summary.txt', 'w') as f:
        f.write(summary + '\n')


if __name__ == '__main__':
    main()
