import { fireEvent, render } from '@testing-library/react-native';
import { ConfirmButton } from '../components/ConfirmButton';

describe('ConfirmButton', () => {
  it('does not fire onConfirm on the first press -- it asks for confirmation instead', async () => {
    const onConfirm = jest.fn();
    const { getByRole, getByText } = await render(
      <ConfirmButton label="Revoke pass" confirmLabel="Tap again to revoke" onConfirm={onConfirm} />,
    );

    await fireEvent.press(getByRole('button'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(getByText('Tap again to revoke')).toBeTruthy();
  });

  it('fires onConfirm on the second press', async () => {
    const onConfirm = jest.fn();
    const { getByRole } = await render(
      <ConfirmButton label="Revoke pass" confirmLabel="Tap again to revoke" onConfirm={onConfirm} />,
    );

    await fireEvent.press(getByRole('button'));
    await fireEvent.press(getByRole('button'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does nothing while disabled', async () => {
    const onConfirm = jest.fn();
    const { getByRole } = await render(
      <ConfirmButton label="Revoke pass" confirmLabel="Tap again to revoke" onConfirm={onConfirm} disabled />,
    );

    await fireEvent.press(getByRole('button'));
    await fireEvent.press(getByRole('button'));

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
