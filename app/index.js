import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  SafeAreaView, 
  Text, 
  StatusBar, 
  View 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Stack } from 'expo-router';

// Quotes array
const motivationalQuotes = [
  // ⭐ Short & Famous (safe picks)
  "Believe you can and you're halfway there.",
  "The best time to start was yesterday. The next best time is now.",
  "Don't watch the clock; do what it does. Keep going.",
  "Success is the sum of small efforts repeated daily.",
  "Dream big. Start small. Act now.",
  
  // 🔥 Very Popular Motivation Quotes
  "It always seems impossible until it's done.",
  "Your only limit is your mind.",
  "Great things never come from comfort zones.",
  "Hard work beats talent when talent doesn't work hard.",
  
  // 💪 Discipline & Consistency (widely used)
  "Discipline is the bridge between goals and accomplishment.",
  "We are what we repeatedly do.",
  "Motivation gets you started. Habit keeps you going.",
  "Success doesn't come from what you do occasionally.",
  "Consistency is the key.",
  
  // 🌱 Simple & Timeless
  "Every journey begins with a single step.",
  "Little by little, a little becomes a lot.",
  "Fall seven times, stand up eight.",
  "What you do today matters.",
  "Keep moving forward.",
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#2E3A59',
    fontWeight: '600',
    fontStyle: 'italic',
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
  },
  streakContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF9500',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  streakMessage: {
    fontSize: 18,
    color: '#2E3A59',
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  streakEncouragement: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
    textAlign: 'center',
  },
  quoteContainer: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  quoteText: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  quoteIcon: {
    fontSize: 24,
    marginBottom: 10,
    textAlign: 'center',
  },
  footerText: {
    position: 'absolute',
    bottom: 30,
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

const LoginScreen = () => {
  const router = useRouter();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isCalculating, setIsCalculating] = useState(true);
  const [isFirstLoginToday, setIsFirstLoginToday] = useState(true);
  const [randomQuote, setRandomQuote] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    // Get a random quote
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setRandomQuote(motivationalQuotes[randomIndex]);

    const updateStreakAndNavigate = async () => {
      try {
        // Check if user has onboarded
        const onboardingStatus = await AsyncStorage.getItem('hasOnboarded');
        const isOnboarded = onboardingStatus === 'true';
        setHasOnboarded(isOnboarded);
        
        // First, calculate and update the streak (always logs the day)
        const isFirstLogin = await calculateAndUpdateStreak();
        setIsFirstLoginToday(isFirstLogin);
        
        // Then navigate after delay
        setTimeout(() => {
          setIsNavigating(true);
          if (isOnboarded) {
            router.replace('./screens/mainScreen');
          } else {
            router.replace('./screens/others/onboarding');
          }
        }, 3600);
        
      } catch (error) {
        console.error('Error:', error);
        router.replace('./screens/others/onboarding');
      }
    };

    updateStreakAndNavigate();
  }, []);

  const calculateAndUpdateStreak = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already logged in today
      const lastLoginDate = await AsyncStorage.getItem('lastLoginDate');
      const isFirstLoginToday = lastLoginDate !== today;
      
      // Load existing data
      const savedCurrentRun = await AsyncStorage.getItem('currentRun');
      const savedLongestRun = await AsyncStorage.getItem('longestRun');
      const loggedDays = JSON.parse(await AsyncStorage.getItem('loggedDays') || '[]');
      
      let currentRunValue = savedCurrentRun ? parseInt(savedCurrentRun) : 0;
      let longestRunValue = savedLongestRun ? parseInt(savedLongestRun) : 0;
      
      console.log('Last login:', lastLoginDate, 'Today:', today);
      
      // Only update streak if first login today
      if (isFirstLoginToday) {
        if (lastLoginDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastLoginDate === yesterdayStr) {
            // Consecutive day - increment streak
            currentRunValue += 1;
            console.log('Consecutive day! Incrementing streak to:', currentRunValue);
          } else if (lastLoginDate !== today) {
            // Not consecutive - reset to 1 (first login today)
            currentRunValue = 1;
            console.log('New day, resetting streak to 1');
          }
        } else {
          // First time ever - start at 1
          currentRunValue = 1;
          console.log('First time login, starting streak at 1');
        }
        
        // Update last login date
        await AsyncStorage.setItem('lastLoginDate', today);
        
        // Add today to logged days if not already there
        if (!loggedDays.includes(today)) {
          loggedDays.push(today);
          await AsyncStorage.setItem('loggedDays', JSON.stringify([...new Set(loggedDays)]));
        }
        
        // Update longest run if current is longer
        if (currentRunValue > longestRunValue) {
          longestRunValue = currentRunValue;
          await AsyncStorage.setItem('longestRun', longestRunValue.toString());
        }
        
        // Save current run
        await AsyncStorage.setItem('currentRun', currentRunValue.toString());
        
        console.log('Final streak:', currentRunValue, 'Longest:', longestRunValue);
      }
      
      // Update state to show streak (even if not changed)
      setCurrentStreak(currentRunValue);
      setIsCalculating(false);
      
      return isFirstLoginToday;
      
    } catch (error) {
      console.error('Error calculating streak:', error);
      setIsCalculating(false);
      return true; // Assume first login on error
    }
  };

  const getStreakMessage = (streak) => {
    if (streak === 1) return 'Nice start!';
    if (streak < 5) return 'Doing great!';
    if (streak < 10) return 'Solid streak!';
    return 'Legendary run!';
  };

  const getQuoteIcon = () => {
    const icons = ['⭐', '🔥', '💪', '🌱'];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F5F7FA" barStyle="dark-content" />

      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: '#00C2CB' },
          headerShadowVisible: false,
          headerLeft: () => <Text> </Text>,
          headerTitle: 'Tipidify  ~Track, Sort & Save',
          headerTitleStyle: {
            color: '#fff',
            fontSize: 21,
          },
        }}
      />

      {!isCalculating && hasOnboarded && (
        <>
          {/* Show "Getting things ready..." only on 2nd+ login of the day */}
          {!isFirstLoginToday && (
            <Text style={styles.loadingText}>
              Getting things ready for you...
            </Text>
          )}

          {/* Show streak info ONLY on first login of the day */}
          {isFirstLoginToday && (
            <View style={styles.streakContainer}>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
              <Text style={styles.streakMessage}>
                {currentStreak === 1 ? 'Day Streak!' : 'Day Streak!'}
              </Text>
              <Text style={styles.streakEncouragement}>
                {getStreakMessage(currentStreak)}
              </Text>
            </View>
          )}

          {/* Show random quote only if onboarded */}
          {randomQuote && (
            <View style={styles.quoteContainer}>
              <Text style={styles.quoteIcon}>{getQuoteIcon()}</Text>
              <Text style={styles.quoteText}>"{randomQuote}"</Text>
            </View>
          )}
        </>
      )}

      {!isCalculating && !hasOnboarded && (
        <Text style={styles.loadingText}>
          Getting things ready for you...
        </Text>
      )}

      {isCalculating && (
        <Text style={styles.loadingText}>
          Loading your progress...
        </Text>
      )}

      {isNavigating && (
        <Text style={styles.footerText}>
          Redirecting, please wait...
        </Text>
      )}
    </SafeAreaView>
  );
};

export default LoginScreen;