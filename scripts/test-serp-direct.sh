#!/bin/bash

# Test SERP API directly with exact same parameters as app uses
curl -s -X POST 'https://api.dataforseo.com/v3/serp/google/organic/live/advanced' \
  -u 'jack@scaletotop.com:7f326b700af818f2' \
  -H 'Content-Type: application/json' \
  -d '[{
    "keyword": "project management software",
    "location_name": "United States",
    "language_code": "en",
    "device": "desktop",
    "depth": 100
  }]' | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('=== SERP API Test ===')
print('Status:', d['status_code'], d['status_message'])
if d.get('tasks'):
    task = d['tasks'][0]
    print('Task status:', task.get('status_code'), task.get('status_message'))
    if task.get('result'):
        result = task['result'][0]
        items = result.get('items', [])
        print(f'Items count: {len(items)}')
        print('Item types:', list(set(item['type'] for item in items)))
        
        # Check for PAA
        paa = [item for item in items if item['type'] == 'people_also_ask']
        if paa:
            print(f'\\nPeople Also Ask: {len(paa)} groups found')
            for p in paa[:1]:
                if p.get('items'):
                    print(f'  - Contains {len(p[\"items\"])} questions')
        
        # Check for featured snippet
        snippet = [item for item in items if item['type'] == 'featured_snippet']
        print(f'Featured Snippet: {\"YES\" if snippet else \"NO\"}')
    else:
        print('ERROR: No result in task')
        print('Task error:', task.get('error'))
else:
    print('ERROR: No tasks in response')
"
