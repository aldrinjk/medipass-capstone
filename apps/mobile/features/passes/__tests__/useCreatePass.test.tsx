import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useCreatePass } from '../hooks/useCreatePass';
import * as passApi from '../api/passApi';
import { getCachedPublicUrl } from '../api/passUrlCache';

jest.mock('../api/passApi');

describe('useCreatePass', () => {
  it('rejects submission with no categories selected, without calling the API', async () => {
    const { result } = await renderHook(() => useCreatePass());

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.error).toBe('Choose at least one category to share.');
    expect(passApi.createPass).not.toHaveBeenCalled();
  });

  it('creates a pass with the selected categories and expiry, and caches publicUrl', async () => {
    (passApi.createPass as jest.Mock).mockResolvedValue({
      passId: 'pass-1',
      status: 'ACTIVE',
      expiresAt: '2030-01-01T00:00:00.000Z',
      publicUrl: 'https://responder.example/passes/token-1',
      categories: ['ALLERGIES'],
    });

    const { result } = await renderHook(() => useCreatePass());

    await act(() => {
      result.current.toggleCategory('ALLERGIES');
    });
    expect(result.current.selectedCategories).toEqual(['ALLERGIES']);
    expect(result.current.canSubmit).toBe(true);

    let response;
    await act(async () => {
      response = await result.current.submit();
    });

    expect(passApi.createPass).toHaveBeenCalledWith({
      categories: ['ALLERGIES'],
      expiresAt: expect.any(String),
    });
    expect(response).toMatchObject({ passId: 'pass-1' });
    await waitFor(async () => {
      expect(await getCachedPublicUrl('pass-1')).toBe('https://responder.example/passes/token-1');
    });
  });

  it('toggling a category twice returns to unselected', async () => {
    const { result } = await renderHook(() => useCreatePass());

    await act(() => result.current.toggleCategory('MEDICATIONS'));
    await act(() => result.current.toggleCategory('MEDICATIONS'));

    expect(result.current.selectedCategories).toEqual([]);
  });

  it('surfaces the backend error message when creation fails', async () => {
    (passApi.createPass as jest.Mock).mockRejectedValue(new Error('boom'));

    const { result } = await renderHook(() => useCreatePass());
    await act(() => result.current.toggleCategory('CONDITIONS'));

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.error).toBe('Could not create the pass. Please try again.');
  });
});
