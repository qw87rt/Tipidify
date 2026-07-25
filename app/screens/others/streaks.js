import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ConsistencyScreen = () => {
  const [currentRun, setCurrentRun] = useState(0);
  const [longestRun, setLongestRun] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState({ 
    current: 0, 
    goal: 5,           // Badge earning goal
    total: 7,          // Total days in week
    completedWeeks: 0 
  });
  const [monthlyProgress, setMonthlyProgress] = useState({ 
    current: 0, 
    goal: 21,          // Badge earning goal  
    total: 30,         // Total days in month
    completedMonths: 0 
  });
  const [yearlyProgress, setYearlyProgress] = useState({ 
    current: 0, 
    goal: 333,         // Badge earning goal
    total: 365,        // Total days in year
    completedYears: 0 
  });
  const [todayLogged, setTodayLogged] = useState(false);
  const [calendarDays, setCalendarDays] = useState([]);
  const [badges, setBadges] = useState([]);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];
  const router = useRouter();

  // Badge definitions with evolving colors
  const badgeDefinitions = [
    {
      type: 'weekly',
      title: 'Weekly Tracker',
      description: 'Track 5+ days in a week (out of 7)',
      icon: 'today',
      levels: [
        { threshold: 1, name: 'Beginner', color: '#FF9500', icon: 'weekend' },
        { threshold: 5, name: 'Regular', color: '#34C759', icon: 'trending-up' },
        { threshold: 25, name: 'Expert', color: '#00C2CB', icon: 'auto-awesome' },
        { threshold: 50, name: 'Master', color: '#5856D6', icon: 'stars' },
        { threshold: 100, name: 'Legend', color: '#FF2D55', icon: 'verified' },
      ]
    },
    {
      type: 'monthly',
      title: 'Monthly Tracker',
      description: 'Track 21+ days in a month (out of 30)',
      icon: 'calendar-today',
      levels: [
        { threshold: 1, name: 'Beginner', color: '#FF9500', icon: 'calendar-today' },
        { threshold: 3, name: 'Consistent', color: '#34C759', icon: 'repeat' },
        { threshold: 6, name: 'Dedicated', color: '#00C2CB', icon: 'trending-up' },
        { threshold: 12, name: 'Year-Round', color: '#5856D6', icon: 'auto-awesome' },
        { threshold: 24, name: 'Unstoppable', color: '#FF2D55', icon: 'verified' },
      ]
    },
    {
      type: 'yearly',
      title: 'Yearly Milestone',
      description: 'Track 333+ days in a year (out of 365)',
      icon: 'stars',
      levels: [
        { threshold: 1, name: 'First Year', color: '#FF9500', icon: 'emoji-events' },
        { threshold: 2, name: 'Back-to-Back', color: '#34C759', icon: 'cached' },
        { threshold: 3, name: 'Triple Crown', color: '#00C2CB', icon: 'workspace-premium' },
        { threshold: 5, name: 'Half-Decade', color: '#5856D6', icon: 'diamond' },
        { threshold: 10, name: 'Decade Master', color: '#FF2D55', icon: 'celebration' },
      ]
    },
  ];

  // Initialize calendar days
  useEffect(() => {
    initializeCalendar();
    loadConsistencyData();
  }, []);

  const initializeCalendar = () => {
    const days = [];
    const today = new Date();
    
    // Create 30 days of calendar (past 29 days + today)
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      days.push({
        date: date,
        dayOfMonth: date.getDate(),
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: i === 0,
        isLogged: false,
      });
    }
    
    setCalendarDays(days);
  };

  const loadConsistencyData = async () => {
    try {
      const today = getTodayString();
      const todayDate = new Date();
      
      console.log('Loading consistency data for:', today);
      
      // Load all data
      const savedCurrentRun = await AsyncStorage.getItem('currentRun');
      const savedLongestRun = await AsyncStorage.getItem('longestRun');
      const lastLoginDate = await AsyncStorage.getItem('lastLoginDate');
      const loggedDays = JSON.parse(await AsyncStorage.getItem('loggedDays') || '[]');
      const savedBadges = JSON.parse(await AsyncStorage.getItem('badges') || '[]');
      
      console.log('Loaded loggedDays:', loggedDays.length, 'days');
      
      // Initialize current run (consecutive days)
      let currentRunValue = savedCurrentRun ? parseInt(savedCurrentRun) : 0;
      let longestRunValue = savedLongestRun ? parseInt(savedLongestRun) : 0;
      
      // Check consecutive day streak
      if (lastLoginDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = dateToString(yesterday);
        
        console.log('Last login:', lastLoginDate, 'Yesterday:', yesterdayStr);
        
        if (lastLoginDate === yesterdayStr) {
          currentRunValue += 1;
        } else if (lastLoginDate !== today) {
          currentRunValue = 1;
        }
      } else {
        currentRunValue = 1;
      }
      
      // Update today's login if not already logged
      if (!loggedDays.includes(today)) {
        loggedDays.push(today);
        console.log('Added today to loggedDays');
      }
      
      // Update last login date
      await AsyncStorage.setItem('lastLoginDate', today);
      
      // Update longest run
      if (currentRunValue > longestRunValue) {
        longestRunValue = currentRunValue;
        await AsyncStorage.setItem('longestRun', longestRunValue.toString());
      }
      
      // Save updated data
      await AsyncStorage.setItem('currentRun', currentRunValue.toString());
      await AsyncStorage.setItem('loggedDays', JSON.stringify([...new Set(loggedDays)]));
      
      // Calculate current week (starting Monday - ISO week)
      const currentWeekDays = getCurrentWeekDays(loggedDays, todayDate);
      console.log('Current week days:', currentWeekDays);
      
      // Calculate current month
      const currentMonthDays = getCurrentMonthDays(loggedDays, todayDate);
      console.log('Current month days:', currentMonthDays);
      
      // Calculate current year
      const currentYearDays = getCurrentYearDays(loggedDays, todayDate);
      console.log('Current year days:', currentYearDays);
      
      // Load completed counts
      const weeklyStats = JSON.parse(await AsyncStorage.getItem('weeklyStats') || '[]');
      const monthlyStats = JSON.parse(await AsyncStorage.getItem('monthlyStats') || '[]');
      const yearlyStats = JSON.parse(await AsyncStorage.getItem('yearlyStats') || '[]');
      
      // Check if we should award badges (at the end of period)
      await checkAndAwardBadges(currentWeekDays, currentMonthDays, currentYearDays, todayDate);
      
      // Update state
      setCurrentRun(currentRunValue);
      setLongestRun(longestRunValue);
      setWeeklyProgress({ 
        current: currentWeekDays, 
        goal: 5, 
        total: 7,
        completedWeeks: weeklyStats.length || 0 
      });
      setMonthlyProgress({ 
        current: currentMonthDays, 
        goal: 21, 
        total: 30,
        completedMonths: monthlyStats.length || 0 
      });
      setYearlyProgress({ 
        current: currentYearDays, 
        goal: 333, 
        total: 365,
        completedYears: yearlyStats.length || 0 
      });
      setTodayLogged(true);
      setBadges(savedBadges);
      
      // Update calendar with logged days
      updateCalendarWithLoggedDays([...new Set(loggedDays)]);
      
      // Celebrate if any goal was just reached
      if (currentWeekDays >= 5 || currentMonthDays >= 21 || currentYearDays >= 333) {
        celebrate();
      }
      
    } catch (error) {
      console.error('Error loading consistency data:', error);
    }
  };

  // Helper function to get current week days (Monday start)
  const getCurrentWeekDays = (loggedDays, todayDate) => {
    // Get Monday of this week (ISO week starts Monday)
    const dayOfWeek = todayDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(todayDate);
    
    // If today is Sunday, we go back 6 days to get Monday
    // Otherwise, subtract (dayOfWeek - 1) to get Monday
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(todayDate.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    
    // Count logged days from Monday to today
    return loggedDays.filter(dateStr => {
      const date = new Date(dateStr);
      return date >= monday && date <= todayDate;
    }).length;
  };

  // Helper function to get current month days
  const getCurrentMonthDays = (loggedDays, todayDate) => {
    const startOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    return loggedDays.filter(dateStr => {
      const date = new Date(dateStr);
      return date >= startOfMonth && date <= todayDate;
    }).length;
  };

  // Helper function to get current year days
  const getCurrentYearDays = (loggedDays, todayDate) => {
    const startOfYear = new Date(todayDate.getFullYear(), 0, 1);
    startOfYear.setHours(0, 0, 0, 0);
    
    return loggedDays.filter(dateStr => {
      const date = new Date(dateStr);
      return date >= startOfYear && date <= todayDate;
    }).length;
  };

  const checkAndAwardBadges = async (currentWeekDays, currentMonthDays, currentYearDays, todayDate) => {
    const todayStr = dateToString(todayDate);
    
    // Check for weekly badge (on Sunday - end of week)
    const isSunday = todayDate.getDay() === 0; // 0 = Sunday
    if (isSunday && currentWeekDays >= 5) {
      await awardBadge('weekly', todayStr);
    }
    
    // Check for monthly badge (last day of month)
    const isLastDayOfMonth = todayDate.getDate() === new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();
    if (isLastDayOfMonth && currentMonthDays >= 21) {
      await awardBadge('monthly', todayStr);
    }
    
    // Check for yearly badge (December 31st)
    const isLastDayOfYear = todayDate.getMonth() === 11 && todayDate.getDate() === 31;
    if (isLastDayOfYear && currentYearDays >= 333) {
      await awardBadge('yearly', todayStr);
    }
  };

  const awardBadge = async (type, dateAwarded) => {
    const savedBadges = JSON.parse(await AsyncStorage.getItem('badges') || '[]');
    
    // Find existing badge of this type
    const existingBadge = savedBadges.find(b => b.type === type);
    
    if (existingBadge) {
      // Increment count
      existingBadge.count += 1;
      existingBadge.lastAwarded = dateAwarded;
      
      // Update level if threshold reached
      const badgeDef = badgeDefinitions.find(b => b.type === type);
      const nextLevel = badgeDef.levels.find(level => level.threshold <= existingBadge.count);
      
      if (nextLevel) {
        existingBadge.level = nextLevel.threshold;
        existingBadge.name = nextLevel.name;
        existingBadge.color = nextLevel.color;
        existingBadge.icon = nextLevel.icon;
      }
    } else {
      // Create new badge
      const badgeDef = badgeDefinitions.find(b => b.type === type);
      const initialLevel = badgeDef.levels[0];
      
      const newBadge = {
        type,
        title: badgeDef.title,
        description: badgeDef.description,
        name: initialLevel.name,
        color: initialLevel.color,
        icon: initialLevel.icon,
        count: 1,
        level: initialLevel.threshold,
        firstAwarded: dateAwarded,
        lastAwarded: dateAwarded,
      };
      
      savedBadges.push(newBadge);
    }
    
    // Save badge stats by type
    const statsKey = `${type}Stats`;
    const savedStats = JSON.parse(await AsyncStorage.getItem(statsKey) || '[]');
    if (!savedStats.some(stat => stat.date === dateAwarded)) {
      savedStats.push({
        date: dateAwarded,
        completed: true
      });
    }
    
    await AsyncStorage.setItem(statsKey, JSON.stringify(savedStats));
    await AsyncStorage.setItem('badges', JSON.stringify(savedBadges));
    
    // Update local state
    const updatedBadges = await AsyncStorage.getItem('badges');
    setBadges(JSON.parse(updatedBadges || '[]'));
    
    // Update progress counts
    if (type === 'weekly') {
      setWeeklyProgress(prev => ({ 
        ...prev, 
        completedWeeks: prev.completedWeeks + 1 
      }));
    } else if (type === 'monthly') {
      setMonthlyProgress(prev => ({ 
        ...prev, 
        completedMonths: prev.completedMonths + 1 
      }));
    } else if (type === 'yearly') {
      setYearlyProgress(prev => ({ 
        ...prev, 
        completedYears: prev.completedYears + 1 
      }));
    }
  };

  const updateCalendarWithLoggedDays = (loggedDays) => {
    const updatedCalendar = calendarDays.map(day => {
      const dateStr = dateToString(day.date);
      return {
        ...day,
        isLogged: loggedDays.includes(dateStr),
      };
    });
    setCalendarDays(updatedCalendar);
  };

  const getTodayString = () => {
    const today = new Date();
    return dateToString(today);
  };

  const dateToString = (date) => {
    return date.toISOString().split('T')[0];
  };

  const celebrate = () => {
    setIsCelebrating(true);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => setIsCelebrating(false), 1000);
    });
  };

  // Add a refresh function to test/debug
  const refreshData = async () => {
    console.log('Manually refreshing data...');
    await loadConsistencyData();
  };

  const getWeeklyMessage = () => {
    if (weeklyProgress.current === 0) return "Start your week strong!";
    if (weeklyProgress.current >= weeklyProgress.goal) return "🎉 Weekly badge goal achieved!";
    
    const daysNeeded = weeklyProgress.goal - weeklyProgress.current;
    if (daysNeeded === 1) return "Just 1 more day for badge!";
    return `${daysNeeded} more days to reach badge goal`;
  };

  const getMonthlyMessage = () => {
    if (monthlyProgress.current === 0) return "Start building your monthly habit!";
    if (monthlyProgress.current >= monthlyProgress.goal) return "🎉 Monthly badge goal achieved!";
    
    const daysNeeded = monthlyProgress.goal - monthlyProgress.current;
    if (daysNeeded <= 3) return `Only ${daysNeeded} days left for badge!`;
    return `${daysNeeded} more days to reach badge goal`;
  };

  const getYearlyMessage = () => {
    if (yearlyProgress.current === 0) return "Start your journey to legendary status!";
    if (yearlyProgress.current >= yearlyProgress.goal) return "🎉 Yearly badge goal achieved!";
    
    const daysNeeded = yearlyProgress.goal - yearlyProgress.current;
    const percentage = Math.round((yearlyProgress.current / yearlyProgress.goal) * 100);
    return `${percentage}% of badge goal (${daysNeeded} days to go)`;
  };

  const renderProgressCard = (type, progress, title, icon, messageFn) => {
    const badge = badges.find(b => b.type === type);
    const percentage = Math.min(progress.current / progress.total, 1);
    const badgePercentage = Math.min(progress.current / progress.goal, 1);
    
    return (
      <View style={styles.progressCard}>
        <View style={styles.progressCardHeader}>
          <MaterialIcons name={icon} size={28} color={badge?.color || '#666'} />
          <View style={styles.progressTitleContainer}>
            <Text style={styles.progressCardTitle}>{title}</Text>
            {badge && (
              <View style={[styles.badgeLevel, { backgroundColor: badge.color }]}>
                <Text style={styles.badgeLevelText}>{badge.name}</Text>
              </View>
            )}
          </View>
          <View style={styles.completionCount}>
            <Text style={styles.completionCountNumber}>
              {type === 'weekly' ? progress.completedWeeks : 
               type === 'monthly' ? progress.completedMonths : 
               progress.completedYears}
            </Text>
            <Text style={styles.completionCountLabel}>
              {type === 'weekly' ? 'weeks' : 
               type === 'monthly' ? 'months' : 
               'years'}
            </Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>
                {progress.current}/{progress.total} days
              </Text>
             
            </View>
            <Text style={styles.progressPercentage}>{Math.round(percentage * 100)}%</Text>
          </View>
          
          {/* Main progress bar (shows total days) */}
          <View style={styles.progressBarBackground}>
            <Animated.View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${percentage * 100}%`,
                  backgroundColor: badge?.color || '#00C2CB',
                }
              ]} 
            />
            
            {/* Badge goal marker line */}
            <View 
              style={[
                styles.badgeGoalMarker,
                { left: `${(progress.goal / progress.total) * 100}%` }
              ]} 
            />
            
            {/* Badge goal achieved indicator */}
            {progress.current >= progress.goal && (
              <View 
                style={[
                  styles.badgeGoalAchieved,
                  { left: `${(progress.goal / progress.total) * 100}%` }
                ]} 
              >
                <MaterialIcons name="emoji-events" size={16} color="#FFD700" />
              </View>
            )}
          </View>
          
          {/* Progress messages */}
          <Text style={styles.progressMessage}>{messageFn()}</Text>
          
          {/* Current status */}
          <View style={styles.goalStatusContainer}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#00C2CB' }]} />
              <Text style={styles.statusText}>Tracked: {progress.current} days</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.statusText}>Badge: {progress.goal} days</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.statusText}>Total: {progress.total} days</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.goalInfo}>
          <Text style={styles.goalText}>
            {type === 'weekly' ? 
              `Track 5+ days in a week (out of 7) to earn badges. Current: ${progress.current}/5 days for badge` :
             type === 'monthly' ? 
              `Track 21+ days in a month (out of 30) to earn badges. Current: ${progress.current}/21 days for badge` :
              `Track 333+ days in a year (out of 365) to earn badges. Current: ${progress.current}/333 days for badge`}
          </Text>
        </View>
      </View>
    );
  };

  const renderCalendarDay = (day, index) => {
    const isCurrentDay = day.isToday;
    const isLogged = day.isLogged;
    
    return (
      <View key={index} style={styles.calendarDay}>
        <Text style={styles.calendarDayOfWeek}>{day.dayOfWeek.charAt(0)}</Text>
        <View style={[
          styles.calendarDateContainer,
          isCurrentDay && styles.currentDayContainer,
          isLogged && styles.loggedDayContainer,
        ]}>
          <Text style={[
            styles.calendarDate,
            isCurrentDay && styles.currentDayText,
            isLogged && styles.loggedDayText,
          ]}>
            {day.dayOfMonth}
          </Text>
          {isLogged && <View style={styles.checkmark} />}
        </View>
        {isLogged && <View style={styles.streakDot} />}
      </View>
    );
  };

  const renderBadge = (badgeDef, index) => {
    const userBadge = badges.find(b => b.type === badgeDef.type);
    
    return (
      <View key={index} style={[
        styles.badgeCard,
        userBadge ? styles.badgeUnlocked : styles.badgeLocked,
        userBadge && { borderColor: userBadge.color }
      ]}>
        <View style={[
          styles.badgeIconContainer,
          userBadge && { backgroundColor: userBadge.color + '20' }
        ]}>
          <MaterialIcons 
            name={userBadge?.icon || badgeDef.icon} 
            size={32} 
            color={userBadge?.color || '#CCCCCC'} 
          />
          {userBadge && (
            <View style={[styles.badgeCount, { backgroundColor: userBadge.color }]}>
              <Text style={styles.badgeCountText}>{userBadge.count}</Text>
            </View>
          )}
        </View>
        <View style={styles.badgeInfo}>
          <Text style={[
            styles.badgeTitle,
            userBadge ? styles.badgeTitleUnlocked : styles.badgeTitleLocked,
          ]}>
            {userBadge ? `${badgeDef.title} • ${userBadge.name}` : badgeDef.title}
          </Text>
          <Text style={styles.badgeDescription}>
            {badgeDef.description}
          </Text>
          {userBadge ? (
            <>
              <Text style={styles.badgeProgress}>
                Completed {userBadge.count} time{userBadge.count !== 1 ? 's' : ''}
              </Text>
              {userBadge.lastAwarded && (
                <Text style={styles.badgeDate}>
                  Last earned: {new Date(userBadge.lastAwarded).toLocaleDateString()}
                </Text>
              )}
              
              {/* Show next level */}
              {badgeDef.levels.find(level => level.threshold > userBadge.level) && (
                <View style={styles.nextLevelContainer}>
                  <Text style={styles.nextLevelText}>
                    Next: {badgeDef.levels.find(level => level.threshold > userBadge.level).name} 
                    ({badgeDef.levels.find(level => level.threshold > userBadge.level).threshold} total)
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.lockInfo}>
              <MaterialIcons name="lock" size={14} color="#999" />
              <Text style={styles.lockText}>Not yet earned</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F5F7FA" barStyle="dark-content" />
      
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: '#00C2CB' },
          headerShadowVisible: false,
          headerTitle: 'Consistency Overview',
          headerTitleStyle: { 
            color: '#fff', 
            fontSize: 22, 
            fontWeight: 'bold' 
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={refreshData} style={{ marginRight: 15 }}>
              <MaterialIcons name="refresh" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Consistency Overview</Text>
          <Text style={styles.headerSubtitle}>
            It's about showing up, not being perfect.
          </Text>
        </View>

        {/* Consecutive Days */}
        <View style={styles.runContainer}>
          <View style={styles.runStats}>
            <View style={styles.runStat}>
              <MaterialIcons name="local-fire-department" size={32} color="#FF9500" />
              <Text style={styles.runStatNumber}>{currentRun}</Text>
              <Text style={styles.runStatLabel}>Current Streak</Text>
            </View>
            <View style={styles.runDivider} />
            <View style={styles.runStat}>
              <MaterialIcons name="timeline" size={32} color="#00C2CB" />
              <Text style={styles.runStatNumber}>{longestRun}</Text>
              <Text style={styles.runStatLabel}>Longest Streak</Text>
            </View>
          </View>
          <Text style={styles.runNote}>
            Maintain your consecutive day count
          </Text>
        </View>

        {/* Weekly Progress */}
        {renderProgressCard(
          'weekly',
          weeklyProgress,
          'Weekly Streak',
          'today',
          getWeeklyMessage
        )}

        {/* Monthly Progress */}
        {renderProgressCard(
          'monthly',
          monthlyProgress,
          'Monthly Streak',
          'calendar-today',
          getMonthlyMessage
        )}

        {/* Yearly Progress */}
        {renderProgressCard(
          'yearly',
          yearlyProgress,
          'Yearly Milestone',
          'stars',
          getYearlyMessage
        )}

        {/* Debug Info - Remove in production */}
        <TouchableOpacity onPress={refreshData} style={styles.debugButton}>
          <Text style={styles.debugButtonText}>🔄 Refresh Data</Text>
        </TouchableOpacity>

        {/* Calendar */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>30-Day Calendar</Text>
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => renderCalendarDay(day, index))}
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.loggedLegend]} />
              <Text style={styles.legendText}>Tracked day</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.todayLegend]} />
              <Text style={styles.legendText}>Today</Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Your Badges</Text>
          <Text style={styles.sectionSubtitle}>
            Earn and level up badges by maintaining consistency
          </Text>
          
          <View style={styles.badgesList}>
            {badgeDefinitions.map((badgeDef, index) => 
              renderBadge(badgeDef, index)
            )}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips for Success:</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>📅</Text>
            <Text style={styles.tipText}>
              <Text style={{ fontWeight: 'bold' }}>Week starts Monday:</Text> Aim for 5+ days each week (out of 7)
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>🎯</Text>
            <Text style={styles.tipText}>
              <Text style={{ fontWeight: 'bold' }}>Monthly consistency:</Text> Track 21+ days in a month (out of 30)
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>🏆</Text>
            <Text style={styles.tipText}>
              <Text style={{ fontWeight: 'bold' }}>Badges are automatic:</Text> Earn badges at 5/7, 21/30, 333/365 days
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>✨</Text>
            <Text style={styles.tipText}>
              <Text style={{ fontWeight: 'bold' }}>Gold markers:</Text> Orange line shows badge goal, trophy appears when achieved
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ConsistencyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E3A59',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  runContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  runStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  runStat: {
    alignItems: 'center',
    flex: 1,
  },
  runStatNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E3A59',
    marginTop: 8,
  },
  runStatLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  runDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#E0E0E0',
  },
  runNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  progressCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  progressCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E3A59',
    marginBottom: 4,
  },
  badgeLevel: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeLevelText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  completionCount: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  completionCountNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00C2CB',
  },
  completionCountLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
  },
  badgeGoalText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
    marginTop: 2,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00C2CB',
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  badgeGoalMarker: {
    position: 'absolute',
    top: -2,
    width: 3,
    height: 16,
    backgroundColor: '#FF9500',
    borderRadius: 1.5,
  },
  badgeGoalAchieved: {
    position: 'absolute',
    top: -20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  progressMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  goalStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    color: '#666',
  },
  goalInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  goalText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E3A59',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  calendarDay: {
    width: (width - 80) / 7,
    alignItems: 'center',
    marginBottom: 15,
  },
  calendarDayOfWeek: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
    fontWeight: '500',
  },
  calendarDateContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    position: 'relative',
  },
  currentDayContainer: {
    backgroundColor: '#00C2CB',
    borderWidth: 2,
    borderColor: '#00C2CB',
  },
  loggedDayContainer: {
    backgroundColor: '#34C759',
  },
  calendarDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  currentDayText: {
    color: '#FFFFFF',
  },
  loggedDayText: {
    color: '#FFFFFF',
  },
  checkmark: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34C759',
    marginTop: 3,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  loggedLegend: {
    backgroundColor: '#34C759',
  },
  todayLegend: {
    backgroundColor: '#00C2CB',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  badgesList: {
    marginTop: 10,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  badgeUnlocked: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeLocked: {
    opacity: 0.8,
  },
  badgeIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  badgeCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeCountText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badgeTitleUnlocked: {
    color: '#2E3A59',
  },
  badgeTitleLocked: {
    color: '#999',
  },
  badgeDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  badgeProgress: {
    fontSize: 12,
    color: '#00C2CB',
    fontWeight: '600',
    marginBottom: 2,
  },
  badgeDate: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  nextLevelContainer: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  nextLevelText: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '500',
  },
  lockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lockText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  tipsContainer: {
    padding: 20,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E3A59',
    marginBottom: 15,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipBullet: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  debugButton: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    alignItems: 'center',
  },
  debugButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});