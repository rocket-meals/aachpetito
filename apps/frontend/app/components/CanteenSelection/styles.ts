import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    width: '100%',
  },
  contentContainer: {
    alignItems: 'center',
  },
  heading: {
    fontFamily: 'Poppins_700Bold',
  },
  canteensContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
    flexWrap: 'wrap',
    rowGap: 10,
    paddingBottom: 20,
  },
  foodName: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    paddingBottom: 2,
    overflow: 'hidden',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 5,
  },
  archiveContainer: {
    width: 35,
    height: 35,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 5,
    right: 5,
  },
});
