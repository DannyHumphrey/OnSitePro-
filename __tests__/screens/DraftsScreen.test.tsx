import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { FormCountsProvider } from '@/context/FormCountsContext';
import DraftsScreen from '@/screens/DraftsScreen';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@/services/draftService', () => ({
  getAllDrafts: jest.fn().mockResolvedValue([]),
  getDraftById: jest.fn(),
}));

jest.mock('@/hooks/useAvailableForms', () => ({
  useAvailableForms: () => [
    { key: 'TEST', label: 'Test Form', icon: 'file-plus', formType: 'TEST', version: 1 },
  ],
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn() }),
    useFocusEffect: (fn: any) => { setTimeout(fn, 0); },
  };
});

describe('DraftsScreen', () => {
  it('renders FAB group', () => {
    jest.useFakeTimers();
    const { getByTestId } = render(
      <FormCountsProvider>
        <PaperProvider>
          <DraftsScreen />
        </PaperProvider>
      </FormCountsProvider>
    );
    act(() => {
      jest.runAllTimers();
    });
    expect(getByTestId('fab-group-create')).toBeTruthy();
  });
});
