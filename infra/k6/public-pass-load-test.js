// Performance smoke/load test for the emergency responder's hot path:
// GET /api/v1/public/passes/{token}. This is the single endpoint a real
// emergency responder hits after scanning a QR code, so it is the one
// endpoint in MediPass where response time is a patient-safety concern.
//
// Usage (from the repo root, app running locally on :8080):
//   1. Create a real pass and extract its raw token from CreatePassResponse.publicUrl
//      (see docs/testing/README.md for a step-by-step curl walkthrough).
//   2. Docker Desktop (Windows/macOS) - tested and confirmed working:
//        docker run --rm -i -e BASE_URL=http://host.docker.internal:8080 \
//          -e PASS_TOKEN=<raw-token> grafana/k6 run - < infra/k6/public-pass-load-test.js
//      Linux with a native k6 install, or Docker Engine with
//      --add-host=host.docker.internal:host-gateway, also works with
//      BASE_URL=http://localhost:8080.
//
// This script only ever calls the anonymous public endpoint - it never
// needs a JWT and never touches patient-authenticated routes.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const PASS_TOKEN = __ENV.PASS_TOKEN;

if (!PASS_TOKEN) {
    throw new Error('Set PASS_TOKEN to the raw token of a real, active emergency pass.');
}

export const options = {
    scenarios: {
        responder_scan_smoke: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '10s', target: 10 },
                { duration: '20s', target: 10 },
                { duration: '5s', target: 0 },
            ],
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.01'],
    },
};

export default function () {
    const response = http.get(`${BASE_URL}/api/v1/public/passes/${PASS_TOKEN}`);

    check(response, {
        'status is 200': (r) => r.status === 200,
        'no clinical data leaks patient id': (r) => !r.body || !r.body.includes('"userId"'),
    });

    sleep(1);
}
