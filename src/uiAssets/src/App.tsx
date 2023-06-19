import React from 'react'
import {View, Text, StyleSheet} from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#222',
  },
  text: {
    textAlign: 'center',
    color: 'white',
    fontSize: 32,
  },
})

export const App = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>React code from UI repo</Text>
    </View>
  )
}
