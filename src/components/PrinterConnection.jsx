import React, { useState } from 'react';
import printerService from '../services/printerService';

const PrinterConnection = ({ onConnectionChange }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    setStatusMessage('Searching for Bluetooth printers...');
    
    try {
      const result = await printerService.connectToPrinter();
      
      if (result.success) {
        setStatusMessage(result.message);
        onConnectionChange(true);
      } else {
        setError(result.error || 'Failed to connect');
        onConnectionChange(false);
      }
    } catch (err) {
      setError(err.message);
      onConnectionChange(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await printerService.disconnectPrinter();
      setStatusMessage('Disconnected from printer');
      onConnectionChange(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTestPrint = async () => {
    setStatusMessage('Printing test page...');
    try {
      await printerService.printTestPage();
      setStatusMessage('Test page printed successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="printer-card">
      <h2>Printer Connection</h2>
      
      <div className="status-indicator">
        <div className={`status-dot ${printerService.isConnected ? 'connected' : ''}`}></div>
        <span>{printerService.isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>

      {statusMessage && (
        <div className="success-message">
          {statusMessage}
        </div>
      )}

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          className="button"
          onClick={handleConnect}
          disabled={isConnecting || printerService.isConnected}
        >
          {isConnecting ? 'Connecting...' : 'Connect Printer'}
        </button>

        {printerService.isConnected && (
          <>
            <button 
              className="button secondary"
              onClick={handleTestPrint}
            >
              Print Test Page
            </button>
            
            <button 
              className="button danger"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          </>
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Note:</strong> This app requires:</p>
        <ul>
          <li>Chrome/Edge browser (desktop or Android)</li>
          <li>Bluetooth enabled</li>
          <li>Bluetooth thermal printer (ESC/POS compatible)</li>
          <li>Printer must be in pairing mode</li>
        </ul>
      </div>
    </div>
  );
};

export default PrinterConnection;