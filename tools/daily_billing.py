#!/usr/bin/env python3
"""Daily billing check for Riverbend Web Co.

Runs from .github/workflows/daily-billing.yml. Logs in with GitHub's OIDC token and asks
the backend to run billing_tick (charges due on the 1st, retries, reminders, past-due
flags). The backend decides everything; this script only starts it and prints a summary.
"""
import json
import os
import sys
import time
import urllib.request

API = 'https://script.google.com/macros/s/AKfycbwkosfcFSHGXy8EUaAFZ7Q-SFDFllV_k4n8qBABRxoj2hv59RspTU9APLQabwP_ohaW/exec'


def call(body, tries=3):
    err = None
    for i in range(tries):
        try:
            req = urllib.request.Request(API, data=json.dumps(body).encode(), headers={'Content-Type': 'text/plain;charset=utf-8'})
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.load(r)
        except Exception as e:  # network hiccup: billing_tick is safe to repeat
            err = e
            time.sleep(10 * (i + 1))
    return {'ok': False, 'error': 'network: %s' % err}


def main():
    url, bearer = os.environ.get('ACTIONS_ID_TOKEN_REQUEST_URL'), os.environ.get('ACTIONS_ID_TOKEN_REQUEST_TOKEN')
    if not url or not bearer:
        sys.exit('Run this from the Daily billing GitHub workflow (needs id-token: write).')
    req = urllib.request.Request(url + '&audience=riverbend-billing', headers={'Authorization': 'Bearer ' + bearer})
    with urllib.request.urlopen(req, timeout=30) as r:
        jwt = json.load(r)['value']
    login = call({'action': 'bot_login', 'jwt': jwt})
    if not login.get('ok'):
        sys.exit('Robot login failed: %s' % login.get('error'))
    res = call({'token': login['token'], 'action': 'billing_tick'}, tries=2)
    if not res.get('ok'):
        sys.exit('Billing check failed: %s' % (res.get('detail') or res.get('error')))
    s = res['summary']
    print('SUMMARY: %s mode, %s. Charged %d (paid %d, failed %d), reminders %d, flagged %d, refunds %d, errors %d.' % (
        'Live' if s['env'] == 'production' else 'Test', s['date'], s['charged'], s['paid'], s['failed'], s['reminders'], s['flagged'], s['refunds'], s['errors']))
    if s['errors']:
        sys.exit(1)


if __name__ == '__main__':
    main()
