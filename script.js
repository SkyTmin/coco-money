// Import Supabase library
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = 'https://vflflxppglrgdcxeszzu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbGZseHBwZ2xyZ2RjeGVzenp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MjI4MzMsImV4cCI6MjA2MTA5ODgzM30.oFsEJ21xU05QyXZxfSXv0WKW4P8ps3HcB4Ot7kK7DDQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// DOM Elements
const listsContainer = document.getElementById('lists-container');
const createListBtn = document.getElementById('create-list-btn');
const incomeListNameInput = document.getElementById('income-list-name');
const incomeAmountInput = document.getElementById('income-amount');
const incomeDateInput = document.getElementById('income-date');

// Fetch and render lists from Supabase
async function fetchLists() {
  const { data, error } = await supabase.from('cocomoney').select('*');
  if (error) {
    console.error('Ошибка при получении данных:', error);
    return;
  }
  renderLists(data);
}

// Render lists
function renderLists(lists) {
  listsContainer.innerHTML = '';
  lists.forEach(list => {
    const listElement = document.createElement('div');
    listElement.classList.add('list');

    listElement.innerHTML = `
      <div class="list-header">
        <h2>${list.name}</h2>
        <button onclick="deleteList('${list.id}')">Удалить</button>
      </div>
      <div>
        <p>Дата поступления: <span>${list.date}</span></p>
        <p>Общий доход: <span>${list.income}</span></p>
        <p>Остаток: <span>${list.remaining}</span></p>
      </div>
      <div class="expenses">
        ${list.expenses.length > 0 ? list.expenses.map(expense => `
          <div class="expense-item">
            <span>${expense.name}</span>
            <span>${expense.amount}</span>
            <button onclick="deleteExpense('${list.id}', '${expense.id}')">Удалить</button>
          </div>
        `).join('') : '<p>Нет расходов</p>'}
      </div>
      <div class="add-expense">
        <input type="text" placeholder="Название расхода" id="expense-name-${list.id}">
        <input type="number" placeholder="Сумма" id="expense-amount-${list.id}">
        <button onclick="addExpense('${list.id}')">Добавить расход</button>
      </div>
    `;
    listsContainer.appendChild(listElement);
  });
}

// Add a new list
createListBtn.addEventListener('click', async () => {
  const listName = incomeListNameInput.value.trim();
  const incomeAmount = parseFloat(incomeAmountInput.value);
  const incomeDate = incomeDateInput.value;

  if (!listName || isNaN(incomeAmount) || incomeAmount <= 0 || !incomeDate) {
    alert('Введите корректные данные для листа поступлений!');
    return;
  }

  const newList = {
    name: listName,
    income: incomeAmount,
    date: incomeDate,
    remaining: incomeAmount,
    expenses: [], // Initially, no expenses
  };

  const { error } = await supabase.from('cocomoney').insert([newList]);
  if (error) {
    console.error('Ошибка при добавлении данных:', error);
    return;
  }

  fetchLists(); // Refresh the lists
  incomeListNameInput.value = '';
  incomeAmountInput.value = '';
  incomeDateInput.value = '';
});

// Delete a list
window.deleteList = async (listId) => {
  const confirmDelete = confirm('Вы уверены, что хотите удалить этот лист поступлений?');
  if (!confirmDelete) return;

  const { error } = await supabase.from('cocomoney').delete().eq('id', listId);
  if (error) {
    console.error('Ошибка при удалении данных:', error);
    return;
  }

  fetchLists(); // Refresh the lists
};

// Add an expense to a list
window.addExpense = async (listId) => {
  const expenseNameInput = document.getElementById(`expense-name-${listId}`);
  const expenseAmountInput = document.getElementById(`expense-amount-${listId}`);

  const expenseName = expenseNameInput.value.trim();
  const expenseAmount = parseFloat(expenseAmountInput.value);

  if (!expenseName || isNaN(expenseAmount) || expenseAmount <= 0) {
    alert('Введите корректные данные для расхода!');
    return;
  }

  const { data, error } = await supabase.from('cocomoney').select('expenses, remaining').eq('id', listId).single();
  if (error) {
    console.error('Ошибка при получении данных списка:', error);
    return;
  }

  const updatedExpenses = [...data.expenses, { id: Date.now().toString(), name: expenseName, amount: expenseAmount }];
  const updatedRemaining = data.remaining - expenseAmount;

  const { error: updateError } = await supabase.from('cocomoney').update({
    expenses: updatedExpenses,
    remaining: updatedRemaining,
  }).eq('id', listId);

  if (updateError) {
    console.error('Ошибка при обновлении данных:', updateError);
    return;
  }

  fetchLists(); // Refresh the lists
  expenseNameInput.value = '';
  expenseAmountInput.value = '';
};

// Fetch lists on page load
fetchLists();