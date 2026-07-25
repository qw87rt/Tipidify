import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Dimensions,
  StatusBar,
  Animated,
  TextInput,
  Platform,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Stack } from 'expo-router';
import * as Notifications from 'expo-notifications'; // 👈 Added

const { width, height } = Dimensions.get('window');

// Check if device is small screen
const isSmallScreen = height < 700;
const isVerySmallScreen = height < 600;

const onboardingSlides = [
  {
    id: '1',
    title: 'Track Your Income',
    description: 'Easily record and calculate your multiple income sources with simple math expressions.',
    color: '#00C2CB',
    icon: '💰',
  },
  {
    id: '2',
    title: 'Monitor Expenses',
    description: 'Keep an eye on your spending by categorizing and calculating expenses in real-time.',
    color: '#2E3A59',
    icon: '📊',
  },
  {
    id: '3',
    title: 'Stay on top of your Budget',
    description: 'See how much you can still spend while staying on budget, with motivational nudges.',
    color: '#FF9500',
    icon: '⚖️',
  },
  {
    id: '4',
    title: 'Start Saving',
    description: 'Take control of your finances and build better money habits one peso at a time.',
    color: '#34C759',
    icon: '🎯',
  },
];

const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      slidesRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleOnboardingComplete();
    }
  };


    const handleOnboardingComplete = async () => {
    try {
      // Save onboarding status to AsyncStorage
      await AsyncStorage.setItem('hasOnboarded', 'true');
      console.log('✅ Onboarding completed and saved!');
      
      // Navigate to main screen
      router.replace('../mainScreen');
    } catch (error) {
      console.error('❌ Error saving onboarding status:', error);
      // Still try to navigate even if there's an error
      router.replace('../mainScreen');
    }
  };

  const skipOnboarding = async () => {
    await handleOnboardingComplete();
  };

  // Dynamic scaling based on screen size
  const getScaledSize = (baseSize) => {
    const scaleFactor = Math.min(windowHeight / 800, 1.2); // Base on 800 height
    return Math.round(baseSize * scaleFactor);
  };

  const getScaledPadding = (basePadding) => {
    const scaleFactor = Math.min(windowHeight / 800, 1.2);
    return Math.round(basePadding * scaleFactor);
  };

  const renderSlide = ({ item, index }) => {
    const inputRange = [(index - 1) * windowWidth, index * windowWidth, (index + 1) * windowWidth];
    
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.slideContainer, { width: windowWidth, opacity }]}>
        {/* Icon */}
        <View style={[
          styles.iconContainer, 
          { 
            backgroundColor: `${item.color}20`,
            width: getScaledSize(isSmallScreen ? 90 : 120),
            height: getScaledSize(isSmallScreen ? 90 : 120),
            borderRadius: getScaledSize(isSmallScreen ? 45 : 60),
            marginBottom: getScaledSize(isSmallScreen ? 25 : 40),
          }
        ]}>
          <Text style={[
            styles.icon, 
            { 
              fontSize: getScaledSize(isSmallScreen ? 45 : 60)
            }
          ]}>
            {item.icon}
          </Text>
        </View>
        
        {/* Title */}
        <Text style={[
          styles.title, 
          { 
            color: item.color,
            fontSize: getScaledSize(isSmallScreen ? 22 : 28),
            marginBottom: getScaledSize(isSmallScreen ? 12 : 16),
          }
        ]}>
          {item.title}
        </Text>
        
        {/* Description */}
        <Text style={[
          styles.description, 
          { 
            fontSize: getScaledSize(isSmallScreen ? 16 : 18),
            lineHeight: getScaledSize(isSmallScreen ? 22 : 26),
            marginBottom: getScaledSize(isSmallScreen ? 20 : 30),
          }
        ]}>
          {item.description}
        </Text>
        
        {/* Special content for slide 1 - Input Example */}
        {item.id === '1' && (
          <View style={styles.exampleContainer}>
            <Text style={styles.exampleTitle}>Example:</Text>
            <View style={styles.exampleRow}>
              <TextInput
                style={[
                  styles.exampleLabelInput,
                  { 
                    flex: 0.7,
                    height: getScaledSize(isSmallScreen ? 42 : 44),
                    fontSize: getScaledSize(isSmallScreen ? 14 : 16),
                  }
                ]}
                placeholder="Food"
                placeholderTextColor="#999"
                editable={false}
                value="Rent"
              />
              <TextInput
                style={[
                  styles.exampleAmountInput,
                  { 
                    flex: 1.3,
                    height: getScaledSize(isSmallScreen ? 42 : 44),
                    fontSize: getScaledSize(isSmallScreen ? 14 : 16),
                  }
                ]}
                placeholderTextColor="#999"
                editable={false}
                value="500 + (125 * 3 * 30)"
              />
            </View>
            <Text style={styles.exampleNote}>
              You can use math expressions like: 125 * 3 * 30 = ₱11,750
            </Text>
          </View>
        )}
        
        {/* Special content for slide 4 - Features */}
        {item.id === '4' && (
          <View style={styles.featureList}>
            <View style={[
              styles.featureItem,
              { 
                paddingVertical: getScaledSize(8),
                marginBottom: getScaledSize(8),
              }
            ]}>
              <Text style={[
                styles.featureIcon,
                { fontSize: getScaledSize(isSmallScreen ? 16 : 20) }
              ]}>
                ✅
              </Text>
              <Text style={[
                styles.featureText,
                { fontSize: getScaledSize(isSmallScreen ? 14 : 16) }
              ]}>
                No ads, no clutter
              </Text>
            </View>
            <View style={[
              styles.featureItem,
              { 
                paddingVertical: getScaledSize(8),
                marginBottom: getScaledSize(8),
              }
            ]}>
              <Text style={[
                styles.featureIcon,
                { fontSize: getScaledSize(isSmallScreen ? 16 : 20) }
              ]}>
                ✅
              </Text>
              <Text style={[
                styles.featureText,
                { fontSize: getScaledSize(isSmallScreen ? 14 : 16) }
              ]}>
                Data saved locally
              </Text>
            </View>
            <View style={[
              styles.featureItem,
              { 
                paddingVertical: getScaledSize(8),
                marginBottom: getScaledSize(8),
              }
            ]}>
              <Text style={[
                styles.featureIcon,
                { fontSize: getScaledSize(isSmallScreen ? 16 : 20) }
              ]}>
                ✅
              </Text>
              <Text style={[
                styles.featureText,
                { fontSize: getScaledSize(isSmallScreen ? 14 : 16) }
              ]}>
                Simple & intuitive
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    );
  };

  const Paginator = () => {
    return (
      <View style={[
        styles.paginatorContainer,
        { height: getScaledSize(20) }
      ]}>
        {onboardingSlides.map((_, i) => {
          const inputRange = [(i - 1) * windowWidth, i * windowWidth, (i + 1) * windowWidth];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [
              getScaledSize(8), 
              getScaledSize(24), 
              getScaledSize(8)
            ],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              style={[
                styles.dot, 
                { 
                  width: dotWidth, 
                  opacity,
                  height: getScaledSize(8),
                  borderRadius: getScaledSize(4),
                  marginHorizontal: getScaledSize(6),
                }
              ]}
              key={i.toString()}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F5F7FA" barStyle="dark-content" />
      
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header with Skip Button */}
      <View style={[
        styles.header,
        { 
          paddingTop: Platform.OS === 'ios' ? getScaledSize(10) : getScaledSize(20),
          paddingBottom: getScaledSize(10),
        }
      ]}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity 
          style={[
            styles.skipButton, 
            { 
              paddingHorizontal: getScaledSize(16),
              paddingVertical: getScaledSize(8),
              borderRadius: getScaledSize(20),
            }
          ]} 
          onPress={skipOnboarding}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.skipText, 
            { fontSize: getScaledSize(isSmallScreen ? 14 : 16) }
          ]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Slides Area */}
      <View style={styles.slidesContainer}>
        <FlatList
          data={onboardingSlides}
          renderItem={renderSlide}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
          getItemLayout={(data, index) => ({
            length: windowWidth,
            offset: windowWidth * index,
            index,
          })}
        />
      </View>

      {/* Pagination */}
      <Paginator />

      {/* Button Area */}
      <View style={[
        styles.buttonArea,
        { 
          paddingHorizontal: getScaledSize(40),
          paddingBottom: Platform.OS === 'ios' ? getScaledSize(30) : getScaledSize(40),
          paddingTop: getScaledSize(10),
        }
      ]}>
        <TouchableOpacity
          style={[
            styles.button, 
            { 
              backgroundColor: onboardingSlides[currentIndex].color,
              paddingVertical: getScaledSize(isSmallScreen ? 14 : 16),
              borderRadius: getScaledSize(14),
            }
          ]}
          onPress={scrollTo}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.buttonText,
            { fontSize: getScaledSize(isSmallScreen ? 16 : 18) }
          ]}>
            {currentIndex === onboardingSlides.length - 1 ? 'Get Started 🚀' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerSpacer: {
    flex: 1,
  },
  skipButton: {
    backgroundColor: 'rgba(46, 58, 89, 0.1)',
  },
  skipText: {
    color: '#2E3A59',
    fontWeight: '500',
  },
  slidesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  slideContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    color: '#666',
    textAlign: 'center',
  },
  exampleContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#404a4c',
    marginBottom: 10,
    textAlign: 'center',
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
    width: '100%',
  },
  exampleLabelInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    color: '#404a4c',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  exampleAmountInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    borderRadius: 6,
    color: '#404a4c',
  },
  exampleNote: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 5,
  },
  featureList: {
    marginTop: 20,
    width: '100%',
    alignItems: 'flex-start',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    color: '#2E3A59',
    fontWeight: '500',
  },
  paginatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    backgroundColor: '#00C2CB',
  },
  buttonArea: {
    paddingHorizontal: 40,
  },
  button: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});