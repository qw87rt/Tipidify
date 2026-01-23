document.addEventListener('DOMContentLoaded', function() {
  // State
  let incomes = [{ label: '', value: '' }];
  let expenses = [{ label: '', value: '' }];
  let balance = 0;
  let showIncomeDeletes = false;
  let showExpenseDeletes = false;
  let isDarkMode = false;

  // DOM Elements
  const incomeContainer = document.getElementById('income-container');
  const expenseContainer = document.getElementById('expense-container');
  const totalIncomeEl = document.getElementById('total-income');
  const totalExpenseEl = document.getElementById('total-expense');
  const balanceEl = document.getElementById('balance');
  const balanceEmojiEl = document.getElementById('balance-emoji');
  const messageEl = document.getElementById('message');
  const shareLinkEl = document.getElementById('share-link');
  const footerEl = document.getElementById('footer');
  
  // Buttons
  const addIncomeBtn = document.getElementById('addIncomeBtn');
  const addExpenseBtn = document.getElementById('addExpenseBtn');
  const removeIncomeBtn = document.getElementById('removeIncomeBtn');
  const removeExpenseBtn = document.getElementById('removeExpenseBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const shareBtn = document.getElementById('shareBtn');
  const moreBtn = document.getElementById('moreBtn');
  const closeMoreBtn = document.getElementById('closeMoreBtn');
  const moreScreen = document.getElementById('moreScreen');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const darkModeBtn = document.getElementById('darkModeBtn');
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeModal = document.querySelector('.close-modal');

  // Safe expression evaluation
  function safeEval(expression) {
    if (!expression) return 0;
    
    // Clean the expression - only allow numbers, basic operators, and parentheses
    const cleanExpr = expression.replace(/[^0-9+\-*/().\s]/g, '');
    
    try {
      // Using Function constructor but with limited scope
      return Function(`"use strict"; return (${cleanExpr})`)();
    } catch (error) {
      console.error('Invalid expression:', expression, error);
      return 0;
    }
  }

  // Calculate totals
  function calculateTotals() {
    const totalIncome = incomes.reduce((sum, item) => sum + safeEval(item.value), 0);
    const totalExpense = expenses.reduce((sum, item) => sum + safeEval(item.value), 0);
    return { totalIncome, totalExpense };
  }

  // Update balance and UI
  function updateBalance() {
    const { totalIncome, totalExpense } = calculateTotals();
    balance = totalIncome - totalExpense;
    
    // Update UI
    totalIncomeEl.innerHTML = `<i class="fas fa-wallet"></i> Total Income: <span class="amount">₱${totalIncome.toFixed(2)}</span>`;
    totalExpenseEl.innerHTML = `<i class="fas fa-receipt"></i> Total Expense: <span class="amount">₱${totalExpense.toFixed(2)}</span>`;
    
    // Update balance with styling
    balanceEl.innerHTML = `<i class="fas fa-scale-balanced"></i> Balance: <span class="amount">₱${balance.toFixed(2)}</span>`;
    
    // Remove existing classes
    balanceEl.classList.remove('negative', 'low');
    
    if (balance < 0) {
      balanceEl.classList.add('negative');
      balanceEmojiEl.textContent = '😱';
    } else if (totalIncome > 0 && balance / totalIncome < 0.1) {
      balanceEl.classList.add('low');
      balanceEmojiEl.textContent = '⚠️';
    } else {
      balanceEmojiEl.textContent = '✅';
    }
    
    // Update message
    updateMessage(totalIncome, totalExpense, balance);
    
    // Save to localStorage
    saveData();
  }

  // Get motivational message
  function updateMessage(totalIncome, totalExpense, balance) {
    if (totalIncome === 0 && totalExpense === 0) {
      messageEl.textContent = 'Start adding your incomes and expenses!';
      return;
    }

    if (balance > 0) {
      if (balance > 2000) {
        messageEl.textContent = 'Looking good boss — keep it that way 😎';
      } else if (balance > 1000) {
        messageEl.textContent = 'Funds not crying yet — good job 💸';
      } else {
        messageEl.textContent = 'Kaya pa 💪';
      }
    } else if (balance < 0) {
      if (balance < -2000) {
        messageEl.textContent = 'Budget beast mode: ON 🔥';
      } else {
        messageEl.textContent = 'Negative na, monitor spending closely..';
      }
    } else {
      messageEl.textContent = 'Perfectly balanced, still safe ✅';
    }
  }

  // Load data from localStorage
  function loadData() {
    try {
      const savedIncomes = localStorage.getItem('budgetApp_incomes');
      const savedExpenses = localStorage.getItem('budgetApp_expenses');
      const savedDarkMode = localStorage.getItem('budgetApp_darkMode');
      
      if (savedIncomes) incomes = JSON.parse(savedIncomes);
      if (savedExpenses) expenses = JSON.parse(savedExpenses);
      if (savedDarkMode) {
        isDarkMode = JSON.parse(savedDarkMode);
        toggleDarkMode(isDarkMode);
      }
      
      renderAll();
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  }

  // Save data to localStorage
  function saveData() {
    try {
      localStorage.setItem('budgetApp_incomes', JSON.stringify(incomes));
      localStorage.setItem('budgetApp_expenses', JSON.stringify(expenses));
      localStorage.setItem('budgetApp_darkMode', JSON.stringify(isDarkMode));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }

  // Render income rows
  function renderIncomes() {
    incomeContainer.innerHTML = '';
    incomes.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = `input-row ${showIncomeDeletes ? 'deleting' : ''}`;
      row.innerHTML = `
        <input type="text" class="category-input" placeholder="Category (e.g., Salary)" 
               value="${item.label}" data-index="${index}" data-type="income" data-field="label">
        <input type="text" class="amount-input" placeholder="Amount (e.g., 145 * 8 * 20)" 
               value="${item.value}" data-index="${index}" data-type="income" data-field="value">
        <button class="delete-btn" data-index="${index}" data-type="income">
          <i class="fas fa-times"></i>
        </button>
      `;
      incomeContainer.appendChild(row);
    });
    
    // Update remove button text
    removeIncomeBtn.innerHTML = showIncomeDeletes 
      ? '<i class="fas fa-check"></i> Done Removing' 
      : '<i class="fas fa-trash"></i> Remove';
    removeIncomeBtn.classList.toggle('active', showIncomeDeletes);
  }

  // Render expense rows
  function renderExpenses() {
    expenseContainer.innerHTML = '';
    expenses.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = `input-row ${showExpenseDeletes ? 'deleting' : ''}`;
      row.innerHTML = `
        <input type="text" class="category-input" placeholder="Category (e.g., Rent)" 
               value="${item.label}" data-index="${index}" data-type="expense" data-field="label">
        <input type="text" class="amount-input" placeholder="Amount" 
               value="${item.value}" data-index="${index}" data-type="expense" data-field="value">
        <button class="delete-btn" data-index="${index}" data-type="expense">
          <i class="fas fa-times"></i>
        </button>
      `;
      expenseContainer.appendChild(row);
    });
    
    // Update remove button text
    removeExpenseBtn.innerHTML = showExpenseDeletes 
      ? '<i class="fas fa-check"></i> Done Removing' 
      : '<i class="fas fa-trash"></i> Remove';
    removeExpenseBtn.classList.toggle('active', showExpenseDeletes);
  }

  // Render everything
  function renderAll() {
    renderIncomes();
    renderExpenses();
    updateBalance();
  }

  // Add new row
  function addField(type) {
    if (type === 'income') {
      incomes.push({ label: '', value: '' });
    } else {
      expenses.push({ label: '', value: '' });
    }
    renderAll();
  }

  // Remove specific row
  function removeRow(index, type) {
    if (type === 'income') {
      incomes = incomes.filter((_, i) => i !== index);
      if (incomes.length === 0) incomes = [{ label: '', value: '' }];
    } else {
      expenses = expenses.filter((_, i) => i !== index);
      if (expenses.length === 0) expenses = [{ label: '', value: '' }];
    }
    renderAll();
  }

  // Toggle delete mode
  function toggleDeleteMode(type) {
    if (type === 'income') {
      showIncomeDeletes = !showIncomeDeletes;
    } else {
      showExpenseDeletes = !showExpenseDeletes;
    }
    renderAll();
  }

  // Clear all data
  function clearAll() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      incomes = [{ label: '', value: '' }];
      expenses = [{ label: '', value: '' }];
      showIncomeDeletes = false;
      showExpenseDeletes = false;
      
      renderAll();
      
      // Show confirmation
      messageEl.textContent = 'All data cleared! ✨';
      setTimeout(() => updateBalance(), 2000);
    }
  }

  // Generate shareable link
  function generateLink() {
    const data = {
      incomes,
      expenses,
      timestamp: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(data);
    const compressed = LZString.compressToEncodedURIComponent(jsonString);
    const url = `${window.location.origin}${window.location.pathname}?data=${compressed}`;
    
    shareLinkEl.textContent = url;
    shareLinkEl.classList.add('show');
    
    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      const originalText = shareBtn.innerHTML;
      shareBtn.innerHTML = '<i class="fas fa-check"></i> Copied to Clipboard!';
      setTimeout(() => {
        shareBtn.innerHTML = originalText;
      }, 2000);
    });
  }

  // Load data from URL
  function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    
    if (dataParam) {
      try {
        const jsonString = LZString.decompressFromEncodedURIComponent(dataParam);
        const data = JSON.parse(jsonString);
        
        if (data.incomes) incomes = data.incomes;
        if (data.expenses) expenses = data.expenses;
        
        renderAll();
        
        // Remove the query parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Show success message
        messageEl.textContent = 'Shared data loaded successfully! ✅';
      } catch (e) {
        console.error('Failed to load shared data:', e);
        messageEl.textContent = 'Failed to load shared data. Please check the link.';
      }
    }
  }

  // Export data as JSON file
  function exportData() {
    const data = {
      incomes,
      expenses,
      totals: calculateTotals(),
      balance,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Import data from JSON file
  function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const data = JSON.parse(e.target.result);
          
          if (data.incomes) incomes = data.incomes;
          if (data.expenses) expenses = data.expenses;
          
          renderAll();
          messageEl.textContent = 'Data imported successfully! ✅';
        } catch (error) {
          alert('Invalid file format. Please select a valid JSON file.');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }

  // Toggle dark mode
  function toggleDarkMode(enable) {
    isDarkMode = enable;
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    if (isDarkMode) {
      document.body.style.backgroundColor = '#1a1a2e';
      document.body.style.color = '#e6e6e6';
    } else {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    }
    
    saveData();
  }

  // Event Listeners
  addIncomeBtn.addEventListener('click', () => addField('income'));
  addExpenseBtn.addEventListener('click', () => addField('expense'));
  
  removeIncomeBtn.addEventListener('click', () => toggleDeleteMode('income'));
  removeExpenseBtn.addEventListener('click', () => toggleDeleteMode('expense'));
  
  clearAllBtn.addEventListener('click', clearAll);
  shareBtn.addEventListener('click', generateLink);
  
  moreBtn.addEventListener('click', () => {
    moreScreen.classList.add('show');
  });
  
  closeMoreBtn.addEventListener('click', () => {
    moreScreen.classList.remove('show');
  });
  
  exportBtn.addEventListener('click', exportData);
  importBtn.addEventListener('click', importData);
  
  darkModeBtn.addEventListener('click', () => {
    toggleDarkMode(!isDarkMode);
    moreScreen.classList.remove('show');
  });
  
  helpBtn.addEventListener('click', () => {
    moreScreen.classList.remove('show');
    helpModal.classList.add('show');
  });
  
  closeModal.addEventListener('click', () => {
    helpModal.classList.remove('show');
  });
  
  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === moreScreen) {
      moreScreen.classList.remove('show');
    }
    if (e.target === helpModal) {
      helpModal.classList.remove('show');
    }
  });

  // Delegate input changes
  document.addEventListener('input', (e) => {
    if (e.target.classList.contains('category-input') || e.target.classList.contains('amount-input')) {
      const index = parseInt(e.target.dataset.index);
      const type = e.target.dataset.type;
      const field = e.target.dataset.field;
      const value = e.target.value;
      
      if (type === 'income') {
        incomes[index][field] = value;
      } else {
        expenses[index][field] = value;
      }
      
      updateBalance();
    }
  });

  // Delegate delete button clicks
  document.addEventListener('click', (e) => {
    if (e.target.closest('.delete-btn')) {
      const btn = e.target.closest('.delete-btn');
      const index = parseInt(btn.dataset.index);
      const type = btn.dataset.type;
      removeRow(index, type);
    }
  });

  // Initialize
  loadData();
  loadFromURL();
  
  // Auto-save on input (with debounce)
  let saveTimeout;
  document.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(updateBalance, 1000);
  });
});
