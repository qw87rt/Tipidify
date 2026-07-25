import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, StatusBar, Image, Linking } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { images } from '../../../constants';


const MoreScreen = () => {
  const [currentView, setCurrentView] = useState('menu');
  const router = useRouter();

  const renderContent = () => {
    switch (currentView) {
      case 'about':
        return (
          <View style={styles.contentBox}>
            <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.text}>
              <Text style={{ fontWeight: 'bold' }}>Tipidify </Text> 
                is a simple app that helps you track where your sweldo/allowance goes. I originally built it for myself as I was getting annoyed at how much time I wasted manually calculating things with a regular calculator.
              I tried other income and expense trackers, but most felt too complex for a simple task or didn’t fit what I actually needed.
              {"\n\n"}
              So I made Tipidify: something straightforward, no ads, no fluff.. just a clean way to track your hard-earned money.
              {"\n\n"}
              Now I’m sharing it with others who want the same thing: a light, easy way to see where your money goes, and make better choices.. <Text style={{ fontWeight: 'bold' }}>one peso at a time.</Text> 
            {"\n\n"}
            </Text>

          </View>
        );
      
      case 'feedback':
        return (
          <View style={styles.contentBox}>
            <Text style={styles.sectionTitle}>Feedback</Text>
            <Text style={styles.text}>
              Got ideas or spotted something that could be better? I'd love to hear from you. Send your thoughts, suggestions, or feedback to <Text
                  style={{ fontWeight: 'bold' }}
                  selectable={true} 
                >
                  jhunrayomiping@gmail.com
                </Text>

            </Text>
          </View>
        );
      case 'menu':
      default:
        return (
          <View>
            <TouchableOpacity style={styles.menuButton} onPress={() => setCurrentView('about')}>
              <Text style={styles.menuText}>About</Text>
            </TouchableOpacity>
          
            <TouchableOpacity style={styles.menuButton} onPress={() => setCurrentView('feedback')}>
              <Text style={styles.menuText}>Feedback</Text>
            </TouchableOpacity>
            
             <TouchableOpacity style={styles.menuButton} onPress={() => router.replace('../others/streaks')}>
              <Text style={styles.menuText}>Consistency Overview</Text>
            </TouchableOpacity>
                        {/* ✅ NEW BUTTON 
            <TouchableOpacity style={[styles.menuButton, styles.notificationButton]} onPress={() => router.replace('../others/notificationScreen')}>
              <Text style={styles.menuText}>Notification Settings -Beta</Text>
            </TouchableOpacity>
                */}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <StatusBar backgroundColor="#F5F7FA" barStyle="dark-content" />
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: '#00C2CB' },
          headerShadowVisible: false,
          headerTitle: 'More',
          headerTitleStyle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        {renderContent()}

       { /*
        {currentView !== 'menu' && (
          <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.backButton}>
            <Text style={styles.backButtonText}>⬅ Back to Options</Text>
            
          </TouchableOpacity>
          
        )}
        
          */ }

      </ScrollView>
    </SafeAreaView>
  );
};

export default MoreScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F7FA', // Light modern background
  },
  container: {
    padding: 20,
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#00C2CB',
    paddingLeft: 10,
    textAlign: 'left',
  },
  text: {
    fontSize: 16,
    textAlign: 'left',
    color: '#2B2D42',
    lineHeight: 22,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  contentBox: {
    marginBottom: 30,
  },
  menuButton: {
    backgroundColor: '#00C2CB',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  menuText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#2E3A59',
    fontSize: 16,
    fontWeight: '500',
  },
  qrImage: {
  width: 200,
  resizeMode: 'contain',
  alignSelf: 'center',
  marginTop: 16,
  borderRadius: 10,
},


});
