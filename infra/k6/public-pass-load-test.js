// Performance smoke/load test for the emergency responder's verified
// clinical-summary hot path.
//
// The first anonymous GET after scanning an active QR now correctly returns
// HTTP 428 until responder verification is established. This script therefore
// creates one short-lived emergency-override verification session in setup()
// and then load-tests the same GET the browser performs after verification.
//
// Usage (from the repo root, app running locally on :8080):
//   1. Create a real active pass and extract its raw token from
//      CreatePassResponse.publicUrl.
//   2. Docker Desktop (Windows/macOS):
//        docker run --rm -i -e BASE_URL=http://host.docker.internal:8080 \
//          -e PASS_TOKEN=<raw-token> grafana/k6 run - < infra/k6/public-pass-load-test.js
//      Linux with native k6 can use BASE_URL=http://localhost:8080.
//
// setup() uses only fictional responder metadata and the explicit emergency
// override endpoint. That avoids depending on an SMS provider while still
// exercising the verified public-summary path. This script does not benchmark
// OTP delivery/verification itself.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const PASS_TOKEN = __ENV.PASS_TOKEN;

if (!PASS_TOKEN) {
    throw new Error('Set PASS_TOKEN to the raw token of a real, active emergency pass.');
}

export const options = {
    scenarios: {
        responder_summary_smoke: {
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

export function setup() {
    const response = http.post(
        `${BASE_URL}/api/v1/public/passes/${PASS_TOKEN}/verification/emergency-override`,
        JSON.stringify({
            name: 'K6 Load Test Responder',
            role: 'Paramedic',
            organization: 'MediPass Synthetic EMS',
            reason: 'Synthetic load-test session',
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        },
    );

    const setupOk = check(response, {
        'verification session created': (r) => r.status === 200,
    });

    if (!setupOk) {
        throw new Error(
            `Unable to create responder verification session (HTTP ${response.status}).`,
        );
    }

    const body = response.json();
    if (!body || !body.verificationToken) {
        throw new Error('Verification response did not include verificationToken.');
    }

    return { verificationToken: body.verificationToken };
}

export default function (data) {
    const response = http.get(
        `${BASE_URL}/api/v1/public/passes/${PASS_TOKEN}`,
        {
            headers: {
                Accept: 'application/json',
                'X-MediPass-Verification': data.verificationToken,
            },
        },
    );

    check(response, {
        'status is 200': (r) => r.status === 200,
        'no clinical data leaks patient id': (r) => !r.body || !r.body.includes('"userId"'),
        'trace code is present': (r) => !r.body || r.body.includes('"accessTraceCode"'),
    });

    sleep(1);
}
