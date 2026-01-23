function addField(type, label = '', value = '') {
  const container = document.getElementById(`${type}-container`);

  const group = document.createElement("div");
  group.className = "input-group";

  const labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.placeholder = `Label (e.g., ${type === 'income' ? 'Sahud? Bonus?' : 'Utang? Rent?'})`;
  labelInput.className = `${type}-label label-input`;
  labelInput.value = label;

  const valueInput = document.createElement("input");
  valueInput.type = "text";
  valueInput.placeholder = `Enter expression (e.g., 2*100)`;
  valueInput.className = `${type} value-input`;
  valueInput.value = value;

  // Add event listener to update totals when value changes
  valueInput.addEventListener("input", updateRunningTotal);

  group.appendChild(labelInput);
  group.appendChild(valueInput);
  container.appendChild(group);
}

function removeField(type) {
  const container = document.getElementById(`${type}-container`);
  if (container.children.length > 0) {
    container.removeChild(container.lastElementChild);
  }
}

function safeEval(expression) {
  try {
    return Function(`return (${expression})`)();
  } catch {
    return 0;
  }
}

function calculateBalance() {
  let totalIncome = 0;
  let totalExpense = 0;

  document.querySelectorAll(".income").forEach(input => {
    totalIncome += safeEval(input.value);
  });

  document.querySelectorAll(".expense").forEach(input => {
    totalExpense += safeEval(input.value);
  });

  const balance = totalIncome - totalExpense;
  const resultEl = document.getElementById("result");

  resultEl.textContent = `Balance: \u20b1${balance.toFixed(2)} (${balance >= 0 ? 'Surplus' : 'Deficit'})`;
  resultEl.style.color = balance >= 0 ? "green" : "red";

  // Update total income and total expense displays
  document.getElementById("total-income").textContent = `Total Income: \u20b1${totalIncome.toFixed(2)}`;
  document.getElementById("total-expense").textContent = `Total Expense: \u20b1${totalExpense.toFixed(2)}`;
}

// Function to update the running total of income and expenses
function updateRunningTotal() {
  let totalIncome = 0;
  let totalExpense = 0;

  // Recalculate totals whenever any input is modified
  document.querySelectorAll(".income").forEach(input => {
    totalIncome += safeEval(input.value);
  });

  document.querySelectorAll(".expense").forEach(input => {
    totalExpense += safeEval(input.value);
  });

  // Update balance display in real time
  const resultEl = document.getElementById("result");
  const balance = totalIncome - totalExpense;
  resultEl.textContent = `Balance: \u20b1${balance.toFixed(2)} (${balance >= 0 ? 'Surplus' : 'Deficit'})`;
  resultEl.style.color = balance >= 0 ? "green" : "red";

  // Update total income and total expense displays
  document.getElementById("total-income").textContent = `Total Income: \u20b1${totalIncome.toFixed(2)}`;
  document.getElementById("total-expense").textContent = `Total Expense: \u20b1${totalExpense.toFixed(2)}`;
}

function generateLink() {
  const incomes = Array.from(document.querySelectorAll(".income")).map((input, i) => ({
    label: document.querySelectorAll(".income-label")[i].value,
    amount: input.value
  }));

  const expenses = Array.from(document.querySelectorAll(".expense")).map((input, i) => ({
    label: document.querySelectorAll(".expense-label")[i].value,
    amount: input.value
  }));

  const userData = { incomes, expenses };
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(userData));
  const shareUrl = `${location.origin}${location.pathname}#data=${compressed}`;
  document.getElementById("share-link").innerText = shareUrl;

  // Auto-copy to clipboard
  navigator.clipboard.writeText(shareUrl)
    .then(() => alert("Link copied to clipboard!"))
    .catch(err => alert("Failed to copy link: " + err));
}

window.onload = () => {
  const hash = window.location.hash;
  if (hash.startsWith('#data=')) {
    try {
      const encodedData = hash.slice(6);
      const data = JSON.parse(LZString.decompressFromEncodedURIComponent(encodedData));
      data.incomes.forEach(i => addField('income', i.label, i.amount));
      data.expenses.forEach(e => addField('expense', e.label, e.amount));
    } catch {
      addField('income');
      addField('expense');
    }
  } else {
    addField('income');
    addField('expense');
  }
};
