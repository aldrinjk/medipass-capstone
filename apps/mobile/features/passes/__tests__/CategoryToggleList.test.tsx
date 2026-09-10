import { fireEvent, render } from '@testing-library/react-native';
import { CategoryToggleList } from '../components/CategoryToggleList';

describe('CategoryToggleList', () => {
  it('renders all five categories', async () => {
    const { getByLabelText } = await render(<CategoryToggleList selected={[]} onToggle={jest.fn()} />);

    expect(getByLabelText('Demographics')).toBeTruthy();
    expect(getByLabelText('Allergies')).toBeTruthy();
    expect(getByLabelText('Medications')).toBeTruthy();
    expect(getByLabelText('Conditions')).toBeTruthy();
    expect(getByLabelText('Emergency contact')).toBeTruthy();
  });

  it('reflects the selected state via accessibilityState.checked', async () => {
    const { getByLabelText } = await render(
      <CategoryToggleList selected={['ALLERGIES']} onToggle={jest.fn()} />,
    );

    expect(getByLabelText('Allergies').props.accessibilityState.checked).toBe(true);
    expect(getByLabelText('Medications').props.accessibilityState.checked).toBe(false);
  });

  it('calls onToggle with the pressed category', async () => {
    const onToggle = jest.fn();
    const { getByLabelText } = await render(<CategoryToggleList selected={[]} onToggle={onToggle} />);

    await fireEvent.press(getByLabelText('Conditions'));

    expect(onToggle).toHaveBeenCalledWith('CONDITIONS');
  });
});
