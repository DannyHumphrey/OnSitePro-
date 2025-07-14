import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontWeight: 'bold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  errorInput: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
  },
  errorContainer: {
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 4,
    padding: 4,
  },
  thumbnail: {
    marginTop: 8,
    width: 100,
    height: 100,
  },
  signatureImage: {
    width: 300,
    height: 150,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  photoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  photoWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  sectionContainer: {
    gap: 8,
  },
  repeatableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionContent: {
    gap: 8,
    marginTop: 8,
  },
});
