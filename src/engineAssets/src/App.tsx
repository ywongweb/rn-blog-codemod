import React from 'react'
import {View, Text, StyleSheet} from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    textAlign: 'center',
    color: 'blue',
    fontSize: 32,
  },
})

export const App = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>HELLO WORLD</Text>
      <Text style={styles.text}>Engine</Text>
    </View>
  )
}
