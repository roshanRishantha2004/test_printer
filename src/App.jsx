import React, { useState } from 'react';
import PrinterConnection from './components/PrinterConnection';
import ReceiptDesigner from './components/ReceiptDesigner';
import PrintPreview from './components/PrintPreview';
import printerService from './services/printerService';
import './index.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState('');
  const [printError, setPrintError] = useState('');
  const [currentReceipt, setCurrentReceipt] = useState(null);

  const handleConnectionChange = (connected) => {
    setIsConnected(connected);
  };

  const handlePrintReceipt = async (receiptData) => {
    if (!isConnected) {
      setPrintError('Please connect to printer first');
      return;
    }

    setIsPrinting(true);
    setPrintStatus('Printing receipt...');
    setPrintError('');
    setCurrentReceipt(receiptData);

    try {
      await printerService.printReceipt(receiptData);
      setPrintStatus('Receipt printed successfully!');
      setTimeout(() => setPrintStatus(''), 3000);
    } catch (error) {
      setPrintError(error.message);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="app-container">
      <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '30px' }}>
        Bluetooth Thermal Printer
      </h1>

      <PrinterConnection onConnectionChange={handleConnectionChange} />

      {isPrinting && (
        <div className="printing-status">
          <div className="loader"></div>
          <span>{printStatus}</span>
        </div>
      )}

      {printStatus && !isPrinting && (
        <div className="success-message">
          {printStatus}
        </div>
      )}

      {printError && (
        <div className="error-message">
          {printError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        <ReceiptDesigner onPrint={handlePrintReceipt} />
        <PrintPreview receiptData={currentReceipt} />
      </div>

      <div className="printer-card">
        <h2>How to Use</h2>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Make sure your Bluetooth thermal printer is turned on and in pairing mode</li>
          <li>Click "Connect Printer" and select your printer from the Bluetooth devices list</li>
          <li>Design your receipt using the form on the left</li>
          <li>Preview your receipt on the right</li>
          <li>Click "Print Receipt" to send to the connected printer</li>
          <li>Use "Print Test Page" to verify printer functionality</li>
        </ol>
        
        <h3 style={{ marginTop: '20px' }}>Supported Printers</h3>
        <p>Most ESC/POS compatible Bluetooth thermal printers should work, including:</p>
        <ul>
          <li>Zjiang, Xprinter, Bixolon thermal printers</li>
          <li>POS-58, POS-80 series printers</li>
          <li>Most 58mm/80mm thermal receipt printers</li>
        </ul>
      </div>
    </div>
  );
}

export default App;