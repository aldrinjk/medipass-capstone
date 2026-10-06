import React from 'react';
import { render } from '@testing-library/react-native';
import { AccessHistoryList } from '../../features/sharing/AccessHistoryList';
import type { AccessLogResponse } from '../../types/pass';

describe('AccessHistoryList responder accountability', () => {
  it('shows responder identity, verification status, device, and trace', () => {
    const log: AccessLogResponse = {
      id: 'record-1',
      passId: 'pass-1',
      outcome: 'SUCCESS',
      responderName: 'Responder1',
      responderRole: 'Paramedic',
      responderOrganization: 'Hospital',
      responderPhoneLast4: '2580',
      verificationMethod: 'PHONE_OTP',
      verificationNote: 'Development OTP simulation; no SMS was sent.',
      responderDevice: 'iPhone · Safari',
      traceCode: 'MP-TESTTRACE000001',
      accessedAt: '2026-10-06T12:12:38Z',
    };

    const { getByText } = render(
      <AccessHistoryList logs={[log]} passId="pass-1" />
    );

    getByText('Responder1 · Paramedic · Hospital');
    getByText('DEMO OTP FLOW · ••••2580');
    getByText('iPhone · Safari');
    getByText('Trace MP-TESTTRACE000001');
  });
});
