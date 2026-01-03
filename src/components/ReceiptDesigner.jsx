import React, { useState } from 'react';

const ReceiptDesigner = ({ onPrint }) => {
  const [formData, setFormData] = useState({
    storeName: 'MY STORE',
    storeAddress: '123 Main Street, City',
    storePhone: '(123) 456-7890',
    orderId: 'ORD' + Math.random().toString().slice(2, 8),
    cashier: 'John Doe',
    paymentMethod: 'CASH',
    change: 0,
    items: [
      { name: 'Product 1', quantity: 2, price: 10.50 },
      { name: 'Product 2', quantity: 1, price: 5.75 },
      { name: 'Product 3', quantity: 3, price: 2.99 }
    ]
  });

  const [newItem, setNewItem] = useState({ name: '', quantity: 1, price: 0 });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = field === 'name' ? value : parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    if (newItem.name.trim()) {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { ...newItem }]
      }));
      setNewItem({ name: '', quantity: 1, price: 0 });
    }
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handlePrint = () => {
    const totals = calculateTotals();
    onPrint({
      ...formData,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total
    });
  };

  const totals = calculateTotals();

  return (
    <div className="printer-card">
      <h2>Receipt Designer</h2>
      
      <div className="form-group">
        <label>Store Name</label>
        <input
          type="text"
          name="storeName"
          value={formData.storeName}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label>Store Address</label>
        <input
          type="text"
          name="storeAddress"
          value={formData.storeAddress}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label>Store Phone</label>
        <input
          type="text"
          name="storePhone"
          value={formData.storePhone}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label>Order ID</label>
        <input
          type="text"
          name="orderId"
          value={formData.orderId}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label>Cashier Name</label>
        <input
          type="text"
          name="cashier"
          value={formData.cashier}
          onChange={handleInputChange}
        />
      </div>

      <h3>Items</h3>
      <div className="items-list">
        {formData.items.map((item, index) => (
          <div key={index} className="item-row">
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
              placeholder="Item name"
            />
            <input
              type="number"
              className="quantity"
              value={item.quantity}
              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
              placeholder="Qty"
              min="1"
            />
            <input
              type="number"
              className="price"
              value={item.price}
              onChange={(e) => handleItemChange(index, 'price', e.target.value)}
              placeholder="Price"
              step="0.01"
              min="0"
            />
            <button 
              className="button danger"
              onClick={() => removeItem(index)}
              style={{ padding: '8px 12px', fontSize: '14px' }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="form-group">
        <h4>Add New Item</h4>
        <div className="item-row">
          <input
            type="text"
            value={newItem.name}
            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
            placeholder="Item name"
          />
          <input
            type="number"
            className="quantity"
            value={newItem.quantity}
            onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
            placeholder="Qty"
            min="1"
          />
          <input
            type="number"
            className="price"
            value={newItem.price}
            onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
            placeholder="Price"
            step="0.01"
            min="0"
          />
          <button 
            className="button"
            onClick={addItem}
            style={{ padding: '8px 12px', fontSize: '14px' }}
          >
            Add Item
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Payment Method</label>
        <select
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
        >
          <option value="CASH">Cash</option>
          <option value="CARD">Card</option>
          <option value="MOBILE">Mobile Payment</option>
        </select>
      </div>

      <div className="form-group">
        <label>Change Given</label>
        <input
          type="number"
          name="change"
          value={formData.change}
          onChange={handleInputChange}
          step="0.01"
          min="0"
        />
      </div>

      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Totals</h3>
        <p>Subtotal: ${totals.subtotal.toFixed(2)}</p>
        <p>Tax (8%): ${totals.tax.toFixed(2)}</p>
        <p style={{ fontWeight: 'bold', fontSize: '18px' }}>Total: ${totals.total.toFixed(2)}</p>
      </div>

      <button 
        className="button"
        onClick={handlePrint}
        style={{ width: '100%', padding: '15px', fontSize: '18px' }}
      >
        Print Receipt
      </button>
    </div>
  );
};

export default ReceiptDesigner;