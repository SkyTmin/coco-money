import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://vflflxppglrgdcxeszzu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbGZseHBwZ2xyZ2RjeGVzenp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MjI4MzMsImV4cCI6MjA2MTA5ODgzM30.oFsEJ21xU05QyXZxfSXv0WKW4P8ps3HcB4Ot7kK7DDQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// DOM
const listsContainer = document.getElementById('lists-container');
const createListBtn = document.getElementById('create-list-btn');
const incomeListNameInput = document.getElementById('income-list-name');
const incomeAmountInput = document.getElementById('income-amount');
const incomeDateInput = document.getElementById('income-date');

// Отрисовать списки
async function fetchLists() {
  const { data, error } = await supabase.from('cocomoney').select('*');
  if (error) {
    console.error('Ошибка загрузки данных:', error);
    return;
  }
  renderLists(data);
}

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
        ${list.expenses && list.expenses.length > 0 ? list.expenses.map(expense => `
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

// Создание нового листа
createListBtn.addEventListener('click', async () => {
  const name = incomeListNameInput.value.trim();
  const income = parseFloat(incomeAmountInput.value);
  const date = incomeDateInput.value;

  if (!name || isNaN(income) || income <= 0 || !date) {
    alert('Проверьте корректность введённых данных.');
    return;
  }

  const { error } = await supabase.from('cocomoney').insert([{
    name,
    income,
    date,
    remaining: income,
    expenses: []
  }]);

  if (error) {
    console.error('Ошибка добавления данных:', error);
    return;
  }

  incomeListNameInput.value = '';
  incomeAmountInput.value = '';
  incomeDateInput.value = '';

  fetchLists();
});

// Удаление листа
window.deleteList = async (id) => {
  if (!confirm('Удалить этот лист?')) return;

  const { error } = await supabase.from('cocomoney').delete().eq('id', id);
  if (error) {
    console.error('Ошибка удаления:', error);
    return;
  }

  fetchLists();
};

// Добавление расхода
window.addExpense = async (listId) => {
  const nameInput = document.getElementById(`expense-name-${listId}`);
  const amountInput = document.getElementById(`expense-amount-${listId}`);

  const name = nameInput.value.trim();
  const amount = parseFloat(amountInput.value);

  if (!name || isNaN(amount) || amount <= 0) {
    alert('Введите корректные данные для расхода!');
    return;
  }

  const { data, error } = await supabase.from('cocomoney').select('expenses, remaining').eq('id', listId).single();
  if (error) {
    console.error('Ошибка при получении текущих данных:', error);
    return;
  }

  const newExpense = { id: Date.now().toString(), name, amount };
  const updatedExpenses = [...(data.expenses || []), newExpense];
  const updatedRemaining = data.remaining - amount;

  const { error: updateError } = await supabase.from('cocomoney').update({
    expenses: updatedExpenses,
    remaining: updatedRemaining
  }).eq('id', listId);

  if (updateError) {
    console.error('Ошибка при обновлении расходов:', updateError);
    return;
  }

  fetchLists();
};

window.deleteExpense = async (listId, expenseId) => {
  const { data, error } = await supabase.from('cocomoney').select('expenses, remaining').eq('id', listId).single();
  if (error) {
    console.error('Ошибка загрузки данных:', error);
    return;
  }

  const expenseToRemove = data.expenses.find(e => e.id === expenseId);
  const updatedExpenses = data.expenses.filter(e => e.id !== expenseId);
  const updatedRemaining = data.remaining + (expenseToRemove?.amount || 0);

  const { error: updateError } = await supabase.from('cocomoney').update({
    expenses: updatedExpenses,
    remaining: updatedRemaining
  }).eq('id', listId);

  if (updateError) {
    console.error('Ошибка удаления расхода:', updateError);
    return;
  }

  fetchLists();
};

// Загрузка при старте
fetchLists();
