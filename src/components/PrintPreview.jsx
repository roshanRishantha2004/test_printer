
import React from 'react';

const PrintPreview = ({ receiptData }) => {
  if (!receiptData) {
    return (
      <div className="printer-card">
        <h2>Print Preview</h2>
        <p>Design a receipt to see preview</p>
      </div>
    );
  }

  const calculateTotals = () => {
    const subtotal = receiptData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const totals = calculateTotals();

  return (
    <div className="printer-card">
      <h2>Print Preview</h2>
      
      <div className="receipt-preview">
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
          {receiptData.storeName}
        </div>
        <div style={{ textAlign: 'center', fontSize: '12px' }}>
          {receiptData.storeAddress}
        </div>
        <div style={{ textAlign: 'center', fontSize: '12px' }}>
          {receiptData.storePhone}
        </div>
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          {Array(32).fill('=').join('')}
        </div>
        
        <div>
          Date: {new Date().toLocaleDateString()}<br />
          Time: {new Date().toLocaleTimeString()}<br />
          Order: {receiptData.orderId}<br />
          Cashier: {receiptData.cashier}<br />
        </div>
        
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          {Array(32).fill('-').join('')}
        </div>
        
        <div style={{ fontWeight: 'bold' }}>
          ITEM                QTY   AMOUNT
        </div>
        
        <div style={{ textAlign: 'center', margin: '5px 0' }}>
          {Array(32).fill('-').join('')}
        </div>
        
        {receiptData.items.map((item, index) => (
          <div key={index} style={{ marginBottom: '3px' }}>
            {item.name.substring(0, 18).padEnd(20)} 
            {item.quantity.toString().padStart(3)} 
            ${(item.price * item.quantity).toFixed(2).padStart(8)}
          </div>
        ))}
        
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          {Array(32).fill('=').join('')}
        </div>
        
        <div>
          <span style={{ fontWeight: 'bold' }}>TOTAL:</span>
          <span style={{ float: 'right', fontWeight: 'bold' }}>
            ${totals.subtotal.toFixed(2)}
          </span>
        </div>
        
        <div>
          TAX (8%):
          <span style={{ float: 'right' }}>
            ${totals.tax.toFixed(2)}
          </span>
        </div>
        
        <div>
          <span style={{ fontWeight: 'bold' }}>GRAND TOTAL:</span>
          <span style={{ float: 'right', fontWeight: 'bold' }}>
            ${totals.total.toFixed(2)}
          </span>
        </div>
        
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          {Array(32).fill('=').join('')}
        </div>
        
        <div>
          Payment: {receiptData.paymentMethod}<br />
          Change: ${parseFloat(receiptData.change || 0).toFixed(2)}
        </div>
        
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          {Array(32).fill('-').join('')}
        </div>
        
        <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
          THANK YOU FOR SHOPPING WITH US!
        </div>
        <div style={{ textAlign: 'center' }}>
          Please visit again
        </div>
        
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          {Array(32).fill('-').join('')}
        </div>
        
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          [QR Code: {receiptData.orderId}]
        </div>
        
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
          --- End of receipt ---
        </div>
      </div>
    </div>
  );
};

export default PrintPreview;