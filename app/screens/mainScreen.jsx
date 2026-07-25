import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Stack } from 'expo-router';

const IncomeExpenseCalculator = () => {
  const [incomes, setIncomes] = useState([{ label: '', value: '' }]);
  const [expenses, setExpenses] = useState([{ label: '', value: '' }]);
  const [balance, setBalance] = useState(0);
  const [showIncomeDeletes, setShowIncomeDeletes] = useState(false);
  const [showExpenseDeletes, setShowExpenseDeletes] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(true); // New state for toggling buttons

  const router = useRouter();

  const safeEval = (expression) => {
    try {
      return Function(`return (${expression})`)();
    } catch {
      return 0;
    }
  };

  const calculateTotals = () => {
    const totalIncome = incomes.reduce((sum, item) => sum + safeEval(item.value), 0);
    const totalExpense = expenses.reduce((sum, item) => sum + safeEval(item.value), 0);
    return { totalIncome, totalExpense };
  };

  // ✅ Load saved data on mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedIncomes = await AsyncStorage.getItem('incomes');
        const storedExpenses = await AsyncStorage.getItem('expenses');
        if (storedIncomes) setIncomes(JSON.parse(storedIncomes));
        if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
      } catch (e) {
        console.error('Failed to load from storage:', e);
      }
    };
    loadStoredData();
  }, []);

  // ✅ Save data whenever incomes/expenses change
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('incomes', JSON.stringify(incomes));
        await AsyncStorage.setItem('expenses', JSON.stringify(expenses));
      } catch (e) {
        console.error('Failed to save to storage:', e);
      }
    };
    saveData();

    const { totalIncome, totalExpense } = calculateTotals();
    setBalance(totalIncome - totalExpense);
  }, [incomes, expenses]);

  const updateIncome = (index, field, val) => {
    const updated = [...incomes];
    updated[index][field] = val;
    setIncomes(updated);
  };

  const updateExpense = (index, field, val) => {
    const updated = [...expenses];
    updated[index][field] = val;
    setExpenses(updated);
  };

  const addField = (type) => {
    if (type === 'income') {
      setIncomes([...incomes, { label: ' ', value: '0' }]);
    } else {
      setExpenses([...expenses, { label: ' ', value: '0' }]);
    }
  };

  const removeSpecificRow = (index, type) => {
    if (type === 'income') {
      const updated = incomes.filter((_, i) => i !== index);
      setIncomes(updated.length ? updated : [{ label: '', value: '' }]);
    } else {
      const updated = expenses.filter((_, i) => i !== index);
      setExpenses(updated.length ? updated : [{ label: '', value: '' }]);
    }
  };

 const clearAll = () => {
  // Only show confirmation if there is any content to clear
  const hasData =
    incomes.some(item => item.label.trim() || item.value.trim() && item.value !== '0') ||
    expenses.some(item => item.label.trim() || item.value.trim() && item.value !== '0');

  const doClear = async () => {
    setIncomes([{ label: '', value: '' }]);
    setExpenses([{ label: '', value: '' }]);
    setShowExpenseDeletes(false);
    setShowIncomeDeletes(false);
    try {
      await AsyncStorage.removeItem('incomes');
      await AsyncStorage.removeItem('expenses');
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
  };

  if (hasData) {
    Alert.alert(
      'Clear All',
      'Are you sure you want to delete all income and expense entries?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: doClear },
      ]
    );
  } else {
    doClear(); // nothing to confirm, just reset
  }
};

const { totalIncome, totalExpense } = calculateTotals();

const getMessage = () => {
  // Nothing to show when no data
  if (totalIncome === 0 && totalExpense === 0) return '';

  const initialBalance = totalIncome; 

  // Helper to pick a random message by weight
  const pickRandom = (options) => {
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    let random = Math.random() * totalWeight;
    for (const option of options) {
      if (random < option.weight) return option.msg;
      random -= option.weight;
    }
    return options[0].msg; // fallback
  };

  // ---------- BALANCE > 0 ----------
  if (balance > 0) {
    // > 2000
    
    if (balance > initialBalance * 0.17) {
      return pickRandom([
        { msg: 'Looking good boss — keep it that way 😎', weight: 90 },
        { msg: 'Sana all, treat yourself, deserve mo ’yan 🎉', weight: 5 },
        { msg: 'Woww, check out mo na yang nasa cart mo 🛒', weight: 5 },
      ]);
    }
    // > 1000
    if (balance > initialBalance * 0.07) {
      return pickRandom([
        { msg: 'Funds not crying yet — good job 💸', weight: 90 },
        { msg: 'May pang Starbucks pa! ☕', weight: 5 },
        { msg: 'Noicee, may pambili pa ng Epic Skin 🎮', weight: 5 },
      ]);
    }
    // > 0 (up to 1000)
    return pickRandom([
      { msg: 'Kaya pa 💪', weight: 45 },
      { msg: 'At least may pang milk tea pa 🧋', weight: 20 },
      { msg: 'Petsa de peligro na naman, naku! 😩', weight: 29 },
      { msg: 'Pancit canton at itlog na naman tayo beh 🍜🍳', weight: 3 },
      { msg: 'Kaka-Deeserb mo ’yan eh 😂', weight: 3 },


    ]);
  }

  // ---------- BALANCE < 0 ----------
  if (balance < 0) {
    // Worse than -2000
    if (balance < -initialBalance * 0.3) {
      return pickRandom([
        { msg: 'Yari tayo dyan 😬', weight: 60 },
        { msg: 'Pancit canton at itlog na naman tayo beh 🍜🍳', weight: 5 },
        { msg: 'Parang need na naman nating mag Gloan? 🤔💳', weight: 15 },
        { msg: 'Kaka-Deeserb mo ’yan eh 😂', weight: 15 },
        { msg: 'Petsa de peligro na naman, naku! 😩', weight: 5 },
      ]);
    }
    // Between -2000 and 0 (exclusive)
    return pickRandom([
      { msg: 'Negative na, monitor spending closely.. 📉', weight: 50 },
      { msg: 'Pancit canton at itlog na naman tayo beh 🍜🍳', weight: 15 },
      { msg: 'Parang need na naman nating mag Gloan? 🤔💳', weight: 9 },
      { msg: 'Kaka-Deeserb mo ’yan eh 😂', weight: 8 },
      { msg: 'Petsa de peligro na naman, naku! 😩', weight: 20 },
    ]);
  }

  // ---------- BALANCE === 0 ----------
  return 'Perfectly balanced, still safe ✅';
};



  return (
    <SafeAreaView style={styles.wrapper}>

      <StatusBar backgroundColor="#F5F7FA" barStyle="dark-content" />
           <Stack.Screen
              options={{
                headerStyle: { backgroundColor: '#00C2CB' },
                headerShadowVisible: false,
                headerLeft: () => <Text> </Text>,
                headerTitle: 'Magkano na lang natira?',
                headerTitleStyle: {
                  color: '#fff',
                  fontSize: 21,
                  fontStyle: 'italic',   
                  fontWeight: 'normal',
                  letterSpacing: 0.5,
                },
                headerRight: () => (
                  <TouchableOpacity
                    onPress={() => router.push('./More/moreScreen')}
                    style={{ paddingRight: -10 }}
                  >
                    <Text style={{ color: '#fff', fontSize: 22 }}>☰</Text>
                  </TouchableOpacity>
                ),
              }}
            />






      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Income</Text>
        {incomes.map((item, i) => (
            <View key={i} style={styles.row}>
              <TextInput
                style={styles.labelInput}
                placeholder="Category"
                placeholderTextColor="#999" // Add this
                value={item.label}
                onChangeText={(text) => updateIncome(i, 'label', text)}
              />
              <TextInput
                style={styles.amountInput}
                placeholder="140 + (25 * 3 * 15)"
                placeholderTextColor="#999" // Add this
                value={item.value}
                onChangeText={(text) => updateIncome(i, 'value', text)}
                keyboardType="default"
              />
              {showIncomeDeletes && (
                <TouchableOpacity onPress={() => removeSpecificRow(i, 'income')}>
                  <Text style={styles.removeText}>❌</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        
        {/* Conditionally render Income action buttons */}
        {showActionButtons && (
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => addField('income')} style={styles.button}>
              <Text style={styles.buttonText}>Add Row</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowIncomeDeletes(!showIncomeDeletes)}
              style={[styles.button, { backgroundColor: showIncomeDeletes ? '#FF3B30' : '#FF9500' }]}
            >
              <Text style={styles.buttonText}>
                {showIncomeDeletes ? 'Done Removing' : 'Remove'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Expenses</Text>
      {expenses.map((item, i) => (
          <View key={i} style={styles.row}>
            <TextInput
              style={styles.labelInput}
              placeholder="Category"
              placeholderTextColor="#999" // Add this
              value={item.label}
              onChangeText={(text) => updateExpense(i, 'label', text)}
            />
            <TextInput
              style={styles.amountInput}
              placeholder="Amount"
              placeholderTextColor="#999" // Add this
              value={item.value}
              onChangeText={(text) => updateExpense(i, 'value', text)}
              keyboardType="default"
            />
            {showExpenseDeletes && (
              <TouchableOpacity onPress={() => removeSpecificRow(i, 'expense')}>
                <Text style={styles.removeText}>❌</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        
        {/* Conditionally render Expense action buttons */}
        {showActionButtons && (
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => addField('expense')} style={styles.button}>
              <Text style={styles.buttonText}>Add Row</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowExpenseDeletes(!showExpenseDeletes)}
              style={[styles.button, { backgroundColor: showExpenseDeletes ? '#FF3B30' : '#FF9500' }]}
            >
              <Text style={styles.buttonText}>
                {showExpenseDeletes ? 'Done Removing' : 'Remove'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.clearContainer}>
          <TouchableOpacity onPress={clearAll} style={[styles.button, styles.clearButton]}>
            <Text style={styles.buttonText}>  Clear All</Text>
          </TouchableOpacity>
          
          {/* New Toggle Button */}
          <TouchableOpacity 
            onPress={() => setShowActionButtons(!showActionButtons)}
            style={[styles.button, styles.toggleButton]}
          >
            <Text style={styles.toggleButtonText}>
              {showActionButtons ? 'Hide Buttons' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>



  <View style={styles.footer}>
 

  <Text
    style={{
      color:
        balance < 0
          ? '#A9A9A9' // gray if balance negative
          : '#C8FA5F', // green otherwise
      fontSize: 16,
      textAlign: 'center',
      fontWeight: '600',
      marginTop: 4,
    }}
  >
    Total Income: ₱{totalIncome.toFixed(2)}
  </Text>

  <Text
    style={{
      color:
        balance < 0
          ? '#A9A9A9' // gray if balance negative
          : '#C8FA5F', // green otherwise
      fontSize: 16,
      textAlign: 'center',
      fontWeight: '600',
      marginTop: 2,
    }}
  >
    Total Expense: ₱{totalExpense.toFixed(2)}
  </Text>
     <Text
    style={{
      color:
        balance < 0
          ? '#E43F5A' // red if balance negative
          : balance / (totalIncome || 1) < 0.1
          ? '#A9A9A9' // gray if balance very low
          : '#C8FA5F', // green otherwise
      fontSize: 16,
      textAlign: 'center',
      fontWeight: '600',
    }}
  >
    Balance: ₱{balance.toFixed(2)} {balance >= 0 ? '✅' : '😱'}
  </Text>
  <Text style={styles.quote}>{getMessage()}</Text>
</View>


    </SafeAreaView>
  );
};

export default IncomeExpenseCalculator;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F7FA', // light modern bg
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 220,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E3A59', // secondary dark slate
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#00C2CB',
    paddingLeft: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  labelInput: {
    flex: 0.7,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    padding: 8,
    color: '#2B2D42',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  amountInput: {
    flex: 1.3,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    color: '#2B2D42',
  },
  removeText: {
    fontSize: 18,
    marginLeft: 4,
    color: '#E43F5A', // danger red
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00C2CB', // primary digital teal
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 3,
    marginRight: '10%',
  },
  clearButton: {
    backgroundColor: '#2E3A59', // slate navy for "clear"
    marginTop: 10,
    marginRight: 10,
    minWidth: 100, // Added for consistent sizing
  },
  toggleButton: {
    backgroundColor: '#FFFFFF', // white background
    borderWidth: 1,
    borderColor: '#2E3A59',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    elevation: 3,
    minWidth: 50, // Smaller width than clear button
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  toggleButtonText: {
    color: '#2E3A59', // dark text for contrast on white
    fontSize: 14, // Slightly larger for the eye icon
    fontWeight: 'bold',
    textAlign: 'center',
  },
  clearContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    backgroundColor: '#2E3A59', // strong contrast
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
  },
  result: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    color: '#C8FA5F', // neon lime for result visibility
  },
  quote: {
    marginTop: 8,
    fontSize: 14,
    fontStyle: 'italic',
    color: '#F5F7FA', // soft white on dark
    textAlign: 'center',
  },
});