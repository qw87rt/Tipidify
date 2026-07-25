import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Switch,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// ---------- SET FOREGROUND NOTIFICATION HANDLER ----------
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ---------- QUOTES ----------
const notificationVariants = [
  { title: 'Just a reminder 🌿', body: 'You are doing enough. Rest is productive too.' },
  { title: 'Today is yours 🌻', body: 'Go at your own pace today. You got this.' },
  { title: 'Take it slow ☕', body: 'You don\'t have to rush today. Just breathe and enjoy.' },
  { title: 'Kumain ka na ba? 🍚', body: 'Seriously. If you haven\'t eaten yet, go grab something.' },
  { title: 'Drink up! 💧', body: 'Have some water right now. Your body will thank you.' },
  { title: 'Enjoy your day, ha? 🌸', body: 'You deserve happiness that has nothing to do with work or money.' },
  { title: 'Do one thing for you today 🎵', body: 'Listen to a song you love. Or just stare at the clouds. No guilt.' },
  { title: 'You\'re not a machine 🧠', body: 'You\'re allowed to feel tired. You\'re allowed to pause.' },
  { title: 'Ang ganda ng araw ngayon ✨', body: 'Sana may time ka to appreciate it, kahit saglit lang.' },
  { title: 'Psst, ginagawa mo pa rin ba? 🙃', body: 'Tigil muna. Joke lang, pero seryoso — magpahinga ka.' },
  { title: 'Eat something warm 🍲', body: 'Your body needs fuel, not just coffee.' },
  { title: 'Today is a blank canvas 🎨', body: 'Paint it however you want. No pressure, just be you.' },
  { title: 'Hydrate ulit 💦', body: 'Isang baso pa. Kaya mo \'yan.' },
  { title: 'Laugh at something silly 😂', body: 'Watch a funny video. Read a meme. Life is short.' },
  { title: 'Go outside kahit 5 minutes 🌳', body: 'Fresh air is free therapy. Take it.' },
  { title: 'Pat yourself on the back 👏', body: 'You\'re trying. That\'s more than enough.' },
  { title: 'Uy, stop scrolling! 📱', body: 'Just kidding. Pero stretch your neck muna ha.' },
  { title: 'You good? 🤙', body: 'Like, actually good? Okay lang magsabi ng "hindi".' },
];

const NotificationScreen = () => {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('checking');
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ---------- DEBOUNCE & TARGET TIMESTAMP REFS ----------
  const debounceTimer = useRef(null);
  const targetTimestampRef = useRef(null);

  // ---------- HELPERS ----------
  const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

  // ---------- PERMISSIONS ----------
  const checkPermissions = async () => {
    if (Platform.OS === 'web') {
      setPermissionStatus('unavailable');
      return;
    }
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
      setIsEnabled(status === 'granted');
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Notifications are not supported on web.');
      return;
    }

    setIsLoading(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      setIsEnabled(status === 'granted');
      
      if (status === 'granted') {
        await setupNotificationChannel();
        Alert.alert('✅ Permission Granted', 'You can now receive notifications.');
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings.');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- CHANNEL (Android) ----------
  const setupNotificationChannel = async () => {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF9500',
        });
        console.log('✅ Android notification channel created');
      } catch (error) {
        console.error('Error creating channel:', error);
      }
    }
  };

  // ---------- SCHEDULE (with explicit seconds) ----------
  const scheduleDailyReminderWithSeconds = async (secondsUntil) => {
    if (Platform.OS === 'web') return;

    setIsLoading(true);
    try {
      // Cancel existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Pick random quote
      const selected = pickRandom(notificationVariants);

      console.log(`⏰ Scheduling in ${Math.round(secondsUntil)} seconds (${selectedHour}:${selectedMinute})`);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: selected.title,
          body: selected.body,
          sound: true,
        },
        trigger: {
          seconds: Math.round(secondsUntil), // First fire
          repeats: true, // Repeat every 24 hours
        },
      });

      console.log('✅ Daily reminder scheduled with ID:', notificationId);
      console.log('📝 Quote:', selected.title);
      
      setIsEnabled(true);
      Alert.alert(
        '✅ Notification Set',
        `You'll receive a daily reminder at ${selectedHour}:${String(selectedMinute).padStart(2, '0')}`
      );
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', 'Failed to schedule notification.');
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  };

  // ---------- CANCEL ----------
  const cancelNotifications = async () => {
    if (Platform.OS === 'web') return;

    setIsLoading(true);
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setIsEnabled(false);
      Alert.alert('✅ Notifications Cancelled', 'Your daily reminders have been turned off.');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
      Alert.alert('Error', 'Failed to cancel notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- TOGGLE ----------
  const toggleNotifications = async (value) => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Notifications are not supported on web.');
      return;
    }

    if (value) {
      // Enable
      if (permissionStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        setPermissionStatus(status);
        if (status === 'granted') {
          await setupNotificationChannel();
          // Calculate seconds and schedule
          const seconds = calculateSecondsUntil(selectedHour, selectedMinute);
          await scheduleDailyReminderWithSeconds(seconds);
        } else {
          Alert.alert('Permission Denied', 'Please enable notifications in your device settings.');
        }
      } else {
        // Calculate seconds and schedule
        const seconds = calculateSecondsUntil(selectedHour, selectedMinute);
        await scheduleDailyReminderWithSeconds(seconds);
      }
    } else {
      // Disable
      await cancelNotifications();
    }
  };

  // ---------- CALCULATE SECONDS UNTIL TARGET TIME ----------
  const calculateSecondsUntil = (hour, minute) => {
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    
    // If the time already passed today, schedule for TOMORROW
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    
    const secondsUntil = (target.getTime() - now.getTime()) / 1000;
    console.log(`📊 Calculated: ${Math.round(secondsUntil)} seconds until ${hour}:${minute}`);
    return secondsUntil;
  };

  // ---------- TEST NOTIFICATION (5s only) ----------
  const testNotification = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Notifications are not supported on web.');
      return;
    }

    if (permissionStatus !== 'granted') {
      Alert.alert('Permission Required', 'Please enable notifications first.');
      return;
    }

    setIsLoading(true);
    try {
      const selected = pickRandom(notificationVariants);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test (5s)',
          body: selected.body,
          sound: true,
        },
        trigger: {
          seconds: 5,
          repeats: false,
        },
      });
      Alert.alert('✅ Test Sent', 'You should receive a notification in 5 seconds.');
    } catch (error) {
      console.error('Error sending test:', error);
      Alert.alert('Error', 'Failed to send test notification.');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- TIME PICKER (with 3s debounce & target timestamp) ----------
  const updateTime = (hour, minute) => {
    // Update state immediately
    setSelectedHour(hour);
    setSelectedMinute(minute);
    
    // Save to AsyncStorage immediately
    AsyncStorage.setItem('notificationHour', hour.toString());
    AsyncStorage.setItem('notificationMinute', minute.toString());

    // --- STORE TARGET TIMESTAMP (fixes the offset bug) ---
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    
    // If the time already passed today, schedule for TOMORROW
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    
    targetTimestampRef.current = target.getTime();
    console.log(`🎯 Target timestamp set to: ${target.toLocaleTimeString()}`);

    // Clear any existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    // If notifications are enabled, schedule after 3 seconds of no changes
    if (isEnabled && permissionStatus === 'granted') {
      console.log('⏳ Waiting 3 seconds before rescheduling...');
      setIsSaving(true);
      debounceTimer.current = setTimeout(async () => {
        console.log('🔄 Rescheduling notification...');
        
        // Calculate seconds using the STORED TARGET TIMESTAMP (not current time)
        const now2 = new Date();
        let secondsUntil = (targetTimestampRef.current - now2.getTime()) / 1000;
        
        // Safety check: if negative (shouldn't happen), add 24 hours
        if (secondsUntil < 0) {
          secondsUntil += 86400;
        }
        
        console.log(`⏰ Scheduling in ${Math.round(secondsUntil)} seconds`);
        await scheduleDailyReminderWithSeconds(Math.round(secondsUntil));
      }, 3000);
    } else {
      console.log('⏭️ Notifications disabled, time saved but not scheduled.');
    }
  };

  // ---------- BATTERY OPTIMIZATION GUIDE ----------
  const openAppSettings = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    }
  };

  const showBatteryOptimizationGuide = () => {
    Alert.alert(
      '🔋 Improve Notification Reliability',
      'To make sure daily reminders work even when the app is closed, please disable battery optimization for Tipidify:\n\n' +
      '1. Tap "Open Settings" below\n' +
      '2. Go to "Battery" or "Battery optimization"\n' +
      '3. Select "Don\'t optimize" or "Unrestricted"\n' +
      '4. Go back and toggle the switch OFF then ON to reschedule',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: openAppSettings },
      ]
    );
  };

  // ---------- LOAD SAVED TIME ----------
  useEffect(() => {
    checkPermissions();
    const loadSavedTime = async () => {
      try {
        const savedHour = await AsyncStorage.getItem('notificationHour');
        const savedMinute = await AsyncStorage.getItem('notificationMinute');
        if (savedHour) setSelectedHour(parseInt(savedHour));
        if (savedMinute) setSelectedMinute(parseInt(savedMinute));
      } catch (error) {
        console.error('Error loading saved time:', error);
      }
    };
    loadSavedTime();

    // Log pending notifications on mount (for debugging)
    const checkPending = async () => {
      const pending = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`📋 Pending notifications: ${pending.length}`);
      pending.forEach((n) => {
        console.log(`   🔔 ${n.content.title} at ${n.trigger.seconds} seconds interval`);
      });
    };
    if (Platform.OS !== 'web') {
      checkPending();
    }

    // Cleanup debounce timer on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, []);

  // ---------- RENDER ----------
  return (
    <SafeAreaView style={styles.wrapper}>
      <StatusBar backgroundColor="#F5F7FA" barStyle="dark-content" />
      
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: '#00C2CB' },
          headerShadowVisible: false,
          headerTitle: 'Notification Settings',
          headerTitleStyle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
        }}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Permission Status */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Permission Status</Text>
            <Text style={[
              styles.statusText,
              permissionStatus === 'granted' ? styles.statusGranted : 
              permissionStatus === 'denied' ? styles.statusDenied : 
              styles.statusChecking
            ]}>
              {permissionStatus === 'granted' ? '✅ Enabled' : 
               permissionStatus === 'denied' ? '❌ Denied' : 
               permissionStatus === 'unavailable' ? '🚫 Unavailable' : '⏳ Checking...'}
            </Text>
          </View>

          {permissionStatus === 'denied' && (
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={requestPermissions}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Processing...' : 'Request Permission'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Enable/Disable Toggle */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Daily Reminder</Text>
            <Switch
              value={isEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#767577', true: '#00C2CB' }}
              thumbColor={isEnabled ? '#fff' : '#f4f3f4'}
              disabled={permissionStatus === 'unavailable' || permissionStatus === 'denied' || isLoading}
            />
          </View>
          {isEnabled && (
            <Text style={styles.timeText}>
              🔔 Daily at {selectedHour}:{String(selectedMinute).padStart(2, '0')}
            </Text>
          )}
          {isSaving && (
            <Text style={styles.savingText}>⏳ Saving changes...</Text>
          )}
        </View>

        {/* Time Picker */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>⏰ Set Reminder Time</Text>
          
          {/* Hour Section */}
          <Text style={styles.timeLabel}>Hour</Text>
          <View style={styles.timeRow}>
            <TouchableOpacity 
              style={[styles.timeButton, styles.timeButtonSmall]}
              onPress={() => updateTime(Math.max(0, selectedHour - 2), selectedMinute)}
              disabled={isLoading}
            >
              <Text style={styles.timeButtonText}>-2</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.timeButton, styles.timeButtonSmall]}
              onPress={() => updateTime(Math.max(0, selectedHour - 1), selectedMinute)}
              disabled={isLoading}
            >
              <Text style={styles.timeButtonText}>-1</Text>
            </TouchableOpacity>
            
            <Text style={styles.timeDisplay}>
              {String(selectedHour).padStart(2, '0')}
            </Text>
            
            <TouchableOpacity 
              style={[styles.timeButton, styles.timeButtonSmall]}
              onPress={() => updateTime(Math.min(23, selectedHour + 1), selectedMinute)}
              disabled={isLoading}
            >
              <Text style={styles.timeButtonText}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.timeButton, styles.timeButtonSmall]}
              onPress={() => updateTime(Math.min(23, selectedHour + 2), selectedMinute)}
              disabled={isLoading}
            >
              <Text style={styles.timeButtonText}>+2</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.timeButton, styles.timeButtonSmall, styles.timeButtonLarge]}
              onPress={() => updateTime(Math.min(23, selectedHour + 5), selectedMinute)}
              disabled={isLoading}
            >
              <Text style={styles.timeButtonText}>+5</Text>
            </TouchableOpacity>
          </View>

          {/* Minute Section */}
          <Text style={[styles.timeLabel, { marginTop: 16 }]}>Minute</Text>
          <View style={styles.timeRow}>
            <TouchableOpacity 
              style={[styles.timeButton, styles.timeButtonSmall]}
              onPress={() => updateTime(selectedHour, Math.max(0, selectedMinute - 2))}
              disabled={isLoading}
            >
              <Text style={styles.timeButtonText}>-2</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.timeButton, styles.timeButtonSmall]}
              onPress={() => updateTime(selectedHour, Math.max(0, selectedMinute - 1))}
              disabled={isLoading}
            >
              <Text style={styles.timeButtonText}>-1</Text>
            </TouchableOpacity>
            
            <Text style={styles.timeDisplay}>
              {String(selectedMinute).padStart(2, '0')}
            </Text>
            
            <TouchableOpacity 
              style={[styles.timeButton, styles.timeButtonSmall]}
              onPress={() => updateTime(selectedHour, Math.min(59, selectedMinute + 1))}
              disabled={isLoading}
            >
              <Text style={styles.timeButtonText}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.timeButton, styles.timeButtonSmall]}
              onPress={() => updateTime(selectedHour, Math.min(59, selectedMinute + 2))}
              disabled={isLoading}
            >
              <Text style={styles.timeButtonText}>+2</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.timeButton, styles.timeButtonSmall, styles.timeButtonLarge]}
              onPress={() => updateTime(selectedHour, Math.min(59, selectedMinute + 5))}
              disabled={isLoading}
            >
              <Text style={styles.timeButtonText}>+5</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.timeHint}>Changes saved after 3 seconds of inactivity</Text>
        </View>

        {/* Test Button (5s only) */}
        <TouchableOpacity 
          style={styles.testButton} 
          onPress={testNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '...' : '🧪 Send Test (5s)'}
          </Text>
        </TouchableOpacity>

        {/* Fix Notification Issues Button */}
        <TouchableOpacity 
          style={styles.fixButton} 
          onPress={showBatteryOptimizationGuide}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🔋 Fix Notification Issues</Text>
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ How it works</Text>
          <Text style={styles.infoText}>
            • Notification appears even when app is closed{'\n'}
            • Random motivational quote each day{'\n'}
            • Changes save after 3 seconds of inactivity{'\n'}
            • Swipe notification away if busy{'\n'}
            • If notifications don't appear, tap "Fix Notification Issues"
          </Text>
        </View>

        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>⬅ Back to More</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationScreen;

// ---------- STYLES ----------
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusGranted: {
    color: '#4CAF50',
  },
  statusDenied: {
    color: '#F44336',
  },
  statusChecking: {
    color: '#FF9800',
  },
  timeText: {
    marginTop: 10,
    fontSize: 14,
    color: '#00C2CB',
    textAlign: 'center',
    fontWeight: '500',
  },
  savingText: {
    marginTop: 6,
    fontSize: 13,
    color: '#FF9500',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDisplay: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E3A59',
    marginHorizontal: 12,
    minWidth: 50,
    textAlign: 'center',
  },
  timeButton: {
    backgroundColor: '#00C2CB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  timeButtonSmall: {
    minWidth: 40,
  },
  timeButtonLarge: {
    backgroundColor: '#FF9500',
    minWidth: 45,
  },
  timeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
  },
  primaryButton: {
    backgroundColor: '#00C2CB',
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#FF9500',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  fixButton: {
    backgroundColor: '#F44336',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#2E3A59',
    fontSize: 16,
    fontWeight: '500',
  },
});