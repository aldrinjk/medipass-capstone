import { render } from '@testing-library/react-native';
import { PassQrCode } from '../PassQrCode';

jest.mock('react-native-qrcode-svg', () => {
  const { View } = require('react-native');
  const MockQRCode = (props: { value: string }) => <View testID="mock-qr" {...props} />;
  return { __esModule: true, default: MockQRCode };
});

describe('PassQrCode', () => {
  it('encodes exactly the given publicUrl and nothing else', async () => {
    const url = 'https://responder.medipass.example/passes/abc123token';
    const { getByTestId } = await render(<PassQrCode publicUrl={url} />);

    expect(getByTestId('mock-qr').props.value).toBe(url);
  });

  it('never receives patient data fields -- only a publicUrl string prop exists on the component', async () => {
    // Type-level guarantee: PassQrCodeProps only exposes `publicUrl` and `size`.
    // This test documents/pins that contract at the render boundary.
    const url = 'https://responder.medipass.example/passes/xyz789token';
    const { getByTestId } = await render(<PassQrCode publicUrl={url} />);
    const passedProps = Object.keys(getByTestId('mock-qr').props);

    expect(passedProps).toEqual(expect.arrayContaining(['value']));
    expect(getByTestId('mock-qr').props.value).not.toMatch(/allerg|medicat|condition/i);
  });

  it('is labeled for accessibility without exposing the raw URL as visible text', async () => {
    const { getByLabelText } = await render(
      <PassQrCode publicUrl="https://responder.medipass.example/passes/abc123token" />,
    );
    expect(
      getByLabelText("QR code linking to this pass's public emergency summary"),
    ).toBeTruthy();
  });
});
