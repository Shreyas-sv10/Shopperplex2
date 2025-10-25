document.addEventListener('DOMContentLoaded', () => {
  // Data store for items and purchase history
  const storeData = {
    items: [], // { id, name, priceKg, priceManual, imageSrc }
    purchaseHistory: {} // customerName: [{ itemName, qty, price, date }]
  };

  // Dom references
  const adminSection = document.getElementById('admin-section');
  const customerSection = document.getElementById('customer-section');
  const historySection = document.getElementById('history-section');
  const adminBillOutput = document.getElementById('admin-bill-output');
  const customerBillOutput = document.getElementById('customer-bill-output');
  const historyResults = document.getElementById('history-results');

  // Login forms
  const adminLoginForm = document.getElementById('admin-login-form');
  const customerLoginForm = document.getElementById('customer-login-form');

  // Admin forms
  const addItemForm = document.getElementById('add-item-form');
  const editItemForm = document.getElementById('edit-item-form');
  const selectItemEdit = document.getElementById('select-item-edit');
  const adminBillForm = document.getElementById('admin-bill-form');
  const adminItemsList = document.getElementById('admin-items-list');

  // Customer forms
  const customerBillForm = document.getElementById('customer-bill-form');
  const customerItemsList = document.getElementById('customer-items-list');

  // History form
  const customerHistoryForm = document.getElementById('customer-history-form');
  const searchCustomerNameInput = document.getElementById('search-customer-name');

  let currentUser = null; // 'admin' or customer name

  // Helper to show/hide sections
  function showSection(section) {
    adminSection.style.display = 'none';
    customerSection.style.display = 'none';
    historySection.style.display = 'none';

    section.style.display = 'block';
  }

  // Display items in select dropdown for editing
  function refreshEditItemDropdown() {
    selectItemEdit.innerHTML = `<option value="" disabled selected>Select an item</option>`;
    storeData.items.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.name;
      selectItemEdit.appendChild(option);
    });
  }

  // Display items for billing list (checkbox + qty inputs)
  function displayItemsForBilling() {
    // Clear both admin and customer lists
    adminItemsList.innerHTML = '';
    customerItemsList.innerHTML = '';

    storeData.items.forEach(item => {
      // Admin markup
      const adminDiv = document.createElement('div');
      adminDiv.classList.add('item-card');
      adminDiv.innerHTML = `
        <img src="${item.imageSrc || 'https://via.placeholder.com/100?text=No+Image'}" alt="${item.name}" />
        <label>
          <input type="checkbox" name="admin-item" value="${item.id}" />
          ${item.name} - ₹${item.priceManual || `${item.priceKg} / kg`}
        </label>
        <input 
          type="number" name="admin-qty-${item.id}" 
          min="0" step="0.01" placeholder="Qty in kg or units" disabled class="item-qty-input" 
        />
      `;
      // Enable quantity input if checkbox checked
      adminDiv.querySelector('input[type="checkbox"]').addEventListener('change', e => {
        adminDiv.querySelector(`input[name='admin-qty-${item.id}']`).disabled = !e.target.checked;
        if (!e.target.checked) {
          adminDiv.querySelector(`input[name='admin-qty-${item.id}']`).value = '';
        }
      });
      adminItemsList.appendChild(adminDiv);

      // Customer markup
      const custDiv = document.createElement('div');
      custDiv.classList.add('item-card');
      custDiv.innerHTML = `
        <img src="${item.imageSrc || 'https://via.placeholder.com/100?text=No+Image'}" alt="${item.name}" />
        <label>
          <input type="checkbox" name="cust-item" value="${item.id}" />
          ${item.name} - ₹${item.priceManual || `${item.priceKg} / kg`}
        </label>
        <input 
          type="number" name="cust-qty-${item.id}" 
          min="0" step="0.01" placeholder="Qty in kg or units" disabled class="item-qty-input" 
        />
      `;
      custDiv.querySelector('input[type="checkbox"]').addEventListener('change', e => {
        custDiv.querySelector(`input[name='cust-qty-${item.id}']`).disabled = !e.target.checked;
        if (!e.target.checked) {
          custDiv.querySelector(`input[name='cust-qty-${item.id}']`).value = '';
        }
      });
      customerItemsList.appendChild(custDiv);
    });
  }

  // Generate bill table HTML
  function generateBillTable(itemsBought, discount = 0) {
    if (itemsBought.length === 0) return '<p>No items selected.</p>';

    let total = 0;
    let tableHTML = `<table class="bill-table">
      <thead>
        <tr><th>Item</th><th>Quantity</th><th>Price per unit (₹)</th><th>Amount (₹)</th></tr>
      </thead>
      <tbody>`;

    itemsBought.forEach(({ item, qty, price }) => {
      const amount = qty * price;
      total += amount;
      tableHTML += `<tr>
        <td>${item.name}</td>
        <td>${qty}</td>
        <td>${price.toFixed(2)}</td>
        <td>${amount.toFixed(2)}</td>
      </tr>`;
    });

    tableHTML += `</tbody><tfoot>
      <tr>
        <th colspan="3" style="text-align:right">Total</th>
        <th>₹${total.toFixed(2)}</th>
      </tr>`;

    if (discount > 0) {
      const discountedTotal = total - discount;
      tableHTML += `
      <tr>
        <th colspan="3" style="text-align:right">Discount</th>
        <th>-₹${discount.toFixed(2)}</th>
      </tr>
      <tr>
        <th colspan="3" style="text-align:right">Final Total</th>
        <th>₹${discountedTotal.toFixed(2)}</th>
      </tr>`;
      total = discountedTotal;
    }

    tableHTML += '</tfoot></table>';

    return { tableHTML, total };
  }

  // Save purchase to history
  function savePurchaseHistory(customerName, itemsBought) {
    if (!storeData.purchaseHistory[customerName]) {
      storeData.purchaseHistory[customerName] = [];
    }
    const date = new Date().toLocaleString();
    itemsBought.forEach(({ item, qty, price }) => {
      storeData.purchaseHistory[customerName].push({
        itemName: item.name,
        qty,
        price,
        date
      });
    });

    // Persist to localStorage
    localStorage.setItem('keeranaStoreData', JSON.stringify(storeData));
  }

  // Load data from localStorage if available
  function loadData() {
    const saved = localStorage.getItem('keeranaStoreData');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.items) storeData.items = parsed.items;
      if (parsed.purchaseHistory) storeData.purchaseHistory = parsed.purchaseHistory;
    }
  }

  // Generate unique ID for items
  function generateId() {
    return '_' + Math.random().toString(36).slice(2, 9);
  }

  // Admin login handler
  adminLoginForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = adminLoginForm['admin-username'].value.trim();
    const password = adminLoginForm['admin-password'].value.trim();

    // Simple hardcoded admin check for demo
    if (username === 'admin' && password === 'password') {
      currentUser = 'admin';
      alert('Admin login successful');
      showSection(adminSection);
      refreshEditItemDropdown();
      displayItemsForBilling();
      adminLoginForm.reset();
      customerLoginForm.reset();
    } else {
      alert('Invalid admin credentials. Try username: admin and password: password');
    }
  });

  // Customer login handler
  customerLoginForm.addEventListener('submit', e => {
    e.preventDefault();
    const custName = customerLoginForm['customer-name'].value.trim();
    if (custName === '') {
      alert('Please enter your name to login');
      return;
    }
    currentUser = custName;
    alert(`Welcome, ${custName}`);
    showSection(customerSection);
    displayItemsForBilling();
    customerLoginForm.reset();
    adminLoginForm.reset();
  });

  // Add new item handler
  addItemForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = addItemForm['item-name'].value.trim();
    const priceKg = parseFloat(addItemForm['item-price-kg'].value);
    const priceManual = parseFloat(addItemForm['item-price-manual'].value);
    const imageFile = addItemForm['item-image'].files[0];

    if (name === '') {
      alert('Item name is required.');
      return;
    }

    if (
      (isNaN(priceKg) || priceKg <= 0) &&
      (isNaN(priceManual) || priceManual <= 0)
    ) {
      alert('Enter a valid price per kg or manual price.');
      return;
    }

    // Read image as data URL if selected
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = function (event) {
        storeData.items.push({
          id: generateId(),
          name,
          priceKg: isNaN(priceKg) ? null : priceKg,
          priceManual: isNaN(priceManual) ? null : priceManual,
          imageSrc: event.target.result
        });
        alert('Item added successfully!');
        addItemForm.reset();
        refreshEditItemDropdown();
        displayItemsForBilling();
        // Save updated data
        localStorage.setItem('keeranaStoreData', JSON.stringify(storeData));
      };
      reader.readAsDataURL(imageFile);
    } else {
      storeData.items.push({
        id: generateId(),
        name,
        priceKg: isNaN(priceKg) ? null : priceKg,
        priceManual: isNaN(priceManual) ? null : priceManual,
        imageSrc: null
      });
      alert('Item added successfully!');
      addItemForm.reset();
      refreshEditItemDropdown();
      displayItemsForBilling();
      localStorage.setItem('keeranaStoreData', JSON.stringify(storeData));
    }
  });

  // Edit item price handler
  editItemForm.addEventListener('submit', e => {
    e.preventDefault();
    const itemId = selectItemEdit.value;
    if (!itemId) {
      alert('Select an item to update price');
      return;
    }
    const newPriceKg = parseFloat(editItemForm['new-price-kg'].value);
    const newPriceManual = parseFloat(editItemForm['new-price-manual'].value);

    if (
      (isNaN(newPriceKg) || newPriceKg <= 0) &&
      (isNaN(newPriceManual) || newPriceManual <= 0)
    ) {
      alert('Please enter a valid new price per kg or manual price');
      return;
    }

    const item = storeData.items.find(i => i.id === itemId);
    if (!item) {
      alert('Item not found');
      return;
    }

    item.priceKg = isNaN(newPriceKg) ? null : newPriceKg;
    item.priceManual = isNaN(newPriceManual) ? null : newPriceManual;

    alert('Price updated successfully!');
    editItemForm.reset();
    refreshEditItemDropdown();
    displayItemsForBilling();
    localStorage.setItem('keeranaStoreData', JSON.stringify(storeData));
  });

  // Generate Admin bill
  adminBillForm.addEventListener('submit', e => {
    e.preventDefault();
    const custName = adminBillForm['admin-customer-name'].value.trim();
    if (custName === '') {
      alert('Enter customer name');
      return;
    }
    const discount = parseFloat(adminBillForm['admin-discount'].value) || 0;

    const selectedItems = [];

    storeData.items.forEach(item => {
      const checkbox = adminBillForm.querySelector(`input[name='admin-item'][value='${item.id}']`);
      const qtyInput = adminBillForm.querySelector(`input[name='admin-qty-${item.id}']`);
      if (checkbox.checked) {
        const qty = parseFloat(qtyInput.value);
        if (isNaN(qty) || qty <= 0) {
          alert(`Enter valid quantity for ${item.name}`);
          return;
        }
        const price = item.priceManual || item.priceKg;
        selectedItems.push({ item, qty, price });
      }
    });

    if (selectedItems.length === 0) {
      alert('Select at least one item');
      return;
    }

    // Save purchase history
    savePurchaseHistory(custName, selectedItems);

    const { tableHTML, total } = generateBillTable(selectedItems, discount);
    adminBillOutput.innerHTML = `<h4>Bill for ${custName}</h4>${tableHTML}`;

    adminBillForm.reset();
  });

  // Generate Customer bill
  customerBillForm.addEventListener('submit', e => {
    e.preventDefault();
    const custItems = [];

    storeData.items.forEach(item => {
      const checkbox = customerBillForm.querySelector(`input[name='cust-item'][value='${item.id}']`);
      const qtyInput = customerBillForm.querySelector(`input[name='cust-qty-${item.id}']`);
      if (checkbox.checked) {
        const qty = parseFloat(qtyInput.value);
        if (isNaN(qty) || qty <= 0) {
          alert(`Enter valid quantity for ${item.name}`);
          return;
        }
        const price = item.priceManual || item.priceKg;
        custItems.push({ item, qty, price });
      }
    });

    if (custItems.length === 0) {
      alert('Select at least one item');
      return;
    }

    if (!currentUser || currentUser === 'admin') {
      alert('Please login as customer to check bill');
      return;
    }

    // Save purchase history under customer's name
    savePurchaseHistory(currentUser, custItems);

    const { tableHTML } = generateBillTable(custItems, 0);
    customerBillOutput.innerHTML = `<h4>Bill for ${currentUser}</h4>${tableHTML}`;
    customerBillForm.reset();
  });

  // Customer history search
  customerHistoryForm.addEventListener('submit', e => {
    e.preventDefault();
    const custName = searchCustomerNameInput.value.trim();
    if (!custName) {
      alert('Enter a customer name to search history');
      return;
    }
    const history = storeData.purchaseHistory[custName];
    if (!history || history.length === 0) {
      historyResults.innerHTML = `<p>No purchase history found for "${custName}".</p>`;
      return;
    }

    let html = `<h4>Purchase History for "${custName}"</h4>`;
    html += `<table class="bill-table">
      <thead>
        <tr><th>Date</th><th>Item</th><th>Quantity</th><th>Price per unit (₹)</th></tr>
      </thead><tbody>`;

    history.forEach(entry => {
      html += `<tr>
          <td>${entry.date}</td>
          <td>${entry.itemName}</td>
          <td>${entry.qty}</td>
          <td>${entry.price.toFixed(2)}</td>
        </tr>`;
    });

    html += '</tbody></table>';
    historyResults.innerHTML = html;
  });

  // On start load data and show login page
  loadData();
  showSection(document.getElementById('login-section'));
});
