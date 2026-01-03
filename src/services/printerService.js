// Use the esc-pos-encoder library for proper ESC/POS commands
import EscPosEncoder from 'esc-pos-encoder';

class PrinterService {
  constructor() {
    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;
    this.isConnected = false;
    this.encoder = new EscPosEncoder();
  }

  // Create a new encoder instance
  createEncoder() {
    return new EscPosEncoder();
  }

  // Connect to Bluetooth printer
  async connectToPrinter() {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API not supported. Use Chrome/Edge on desktop or Android.');
      }

      // Request Bluetooth device with serial port service
      // Try different service UUIDs for different printers
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'BT' }, // For printers starting with BT
          { namePrefix: 'Printer' }, // For printers starting with Printer
          { namePrefix: 'POS' }, // For POS printers
          { namePrefix: 'XP' }, // For Xprinter
          { namePrefix: 'ZJ' }, // For Zjiang
        ],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Common thermal printer service
          '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Some printers use this
        ]
      });

      // Connect to GATT server
      this.server = await this.device.gatt.connect();
      
      let serviceFound = false;
      
      // Try different service UUIDs
      const serviceUUIDs = [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '00001101-0000-1000-8000-00805f9b34fb',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'
      ];
      
      for (const serviceUUID of serviceUUIDs) {
        try {
          this.service = await this.server.getPrimaryService(serviceUUID);
          serviceFound = true;
          
          // Get the characteristic for writing data
          // Try different characteristic UUIDs
          const characteristicUUIDs = [
            '00002af1-0000-1000-8000-00805f9b34fb',
            '00002af0-0000-1000-8000-00805f9b34fb',
            '49535343-8841-43f4-a8d4-ecbe34729bb3'
          ];
          
          for (const charUUID of characteristicUUIDs) {
            try {
              this.characteristic = await this.service.getCharacteristic(charUUID);
              break; // Found working characteristic
            } catch (err) {
              continue; // Try next UUID
            }
          }
          
          break; // Found working service
        } catch (err) {
          continue; // Try next service UUID
        }
      }
      
      if (!serviceFound || !this.characteristic) {
        throw new Error('Could not find printer service or characteristic. Please try manual selection.');
      }
      
      this.isConnected = true;
      
      // Add disconnect listener
      this.device.addEventListener('gattserverdisconnected', () => {
        this.isConnected = false;
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
      });

      return {
        success: true,
        deviceName: this.device.name || 'Unknown Device',
        message: `Connected to ${this.device.name}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Manual connection with specific UUIDs
  async connectManual(uuid) {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API not supported');
      }

      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      this.server = await this.device.gatt.connect();
      this.service = await this.server.getPrimaryService(uuid);
      this.characteristic = await this.service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
      
      this.isConnected = true;
      
      return {
        success: true,
        deviceName: this.device.name || 'Unknown Device'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Disconnect printer
  async disconnectPrinter() {
    if (this.device && this.device.gatt.connected) {
      await this.device.gatt.disconnect();
    }
    this.isConnected = false;
    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;
  }

  // Send data to printer
  async sendData(data) {
    if (!this.isConnected || !this.characteristic) {
      throw new Error('Printer not connected');
    }

    try {
      // Convert Uint8Array to ArrayBuffer if needed
      let buffer;
      if (data instanceof Uint8Array) {
        buffer = data.buffer;
      } else if (ArrayBuffer.isView(data)) {
        buffer = data.buffer;
      } else {
        throw new Error('Invalid data format');
      }
      
      // Send data in chunks (some printers have MTU limitations)
      const chunkSize = 512;
      const dataView = new Uint8Array(buffer);
      
      for (let i = 0; i < dataView.length; i += chunkSize) {
        const chunk = dataView.slice(i, i + chunkSize);
        await this.characteristic.writeValue(chunk);
        // Small delay between chunks for stability
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      return { success: true };
    } catch (error) {
      console.error('Send data error:', error);
      throw new Error(`Print failed: ${error.message}`);
    }
  }

  // Generate test page
  generateTestPage() {
    const encoder = new EscPosEncoder();
    
    encoder
      .initialize()
      .align('center')
      .bold(true)
      .size('double')
      .line('TEST PAGE')
      .bold(false)
      .size('normal')
      .line('='.repeat(32))
      .newline()
      .align('left')
      .line('Normal text')
      .bold(true)
      .line('Bold text')
      .bold(false)
      .underline(true)
      .line('Underlined text')
      .underline(false)
      .size('double')
      .line('Large text')
      .size('normal')
      .newline()
      .align('center')
      .line('Centered text')
      .align('right')
      .line('Right aligned')
      .align('left')
      .newline()
      .line('-'.repeat(32))
      .align('center')
      .line('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
      .line('abcdefghijklmnopqrstuvwxyz')
      .line('1234567890!@#$%^&*()')
      .line('-'.repeat(32))
      .newline()
      .align('center')
      .line('Barcode Test:')
      .barcode('123456789012', 'ean13')
      .newline()
      .line('QR Code Test:')
      .qrcode('https://example.com')
      .newline()
      .newline()
      .newline()
      .cut();
    
    return encoder.encode();
  }

  // Generate receipt
  generateReceipt(receiptData) {
    const encoder = new EscPosEncoder();
    
    // Store header
    encoder
      .initialize()
      .align('center')
      .bold(true)
      .size('double')
      .line(receiptData.storeName || 'MY STORE')
      .bold(false)
      .size('normal')
      .line(receiptData.storeAddress || '')
      .line(receiptData.storePhone || '')
      .line('='.repeat(32));
    
    // Order info
    encoder
      .align('left')
      .line(`Date: ${new Date().toLocaleDateString()}`)
      .line(`Time: ${new Date().toLocaleTimeString()}`)
      .line(`Order: ${receiptData.orderId}`)
      .line(`Cashier: ${receiptData.cashier}`)
      .line('-'.repeat(32));
    
    // Items header
    encoder
      .bold(true)
      .line('ITEM                QTY   AMOUNT')
      .bold(false)
      .line('-'.repeat(32));
    
    // Items
    let total = 0;
    receiptData.items.forEach(item => {
      const name = item.name.substring(0, 18);
      const qty = item.quantity.toString().padStart(3, ' ');
      const price = (item.price * item.quantity).toFixed(2);
      const line = `${name.padEnd(20)}${qty}$${price.padStart(8)}`;
      encoder.line(line);
      total += item.price * item.quantity;
    });
    
    encoder
      .line('='.repeat(32));
    
    // Totals
    const tax = total * 0.08;
    const grandTotal = total + tax;
    
    encoder
      .bold(true)
      .inline('TOTAL:')
      .align('right')
      .line(`$${total.toFixed(2)}`)
      .align('left')
      .bold(false)
      .inline('TAX (8%):')
      .align('right')
      .line(`$${tax.toFixed(2)}`)
      .align('left')
      .bold(true)
      .inline('GRAND TOTAL:')
      .align('right')
      .line(`$${grandTotal.toFixed(2)}`)
      .bold(false)
      .align('left')
      .line('='.repeat(32));
    
    // Payment info
    encoder
      .line(`Payment: ${receiptData.paymentMethod}`)
      .line(`Change: $${receiptData.change.toFixed(2)}`)
      .line('-'.repeat(32));
    
    // Footer
    encoder
      .align('center')
      .line('THANK YOU FOR SHOPPING WITH US!')
      .line('Please visit again')
      .line('-'.repeat(32))
      .qrcode(receiptData.orderId || 'https://example.com')
      .newline()
      .newline()
      .newline()
      .cut();
    
    return encoder.encode();
  }

  // Print test page
  async printTestPage() {
    if (!this.isConnected) {
      throw new Error('Please connect to printer first');
    }

    try {
      const testData = this.generateTestPage();
      await this.sendData(testData);
      return { success: true };
    } catch (error) {
      throw new Error(`Test print failed: ${error.message}`);
    }
  }

  // Print a receipt
  async printReceipt(receiptData) {
    if (!this.isConnected) {
      throw new Error('Please connect to printer first');
    }

    try {
      const receipt = this.generateReceipt(receiptData);
      await this.sendData(receipt);
      return { success: true };
    } catch (error) {
      throw new Error(`Receipt print failed: ${error.message}`);
    }
  }

  // Print raw text
  async printText(text) {
    if (!this.isConnected) {
      throw new Error('Please connect to printer first');
    }

    try {
      const encoder = new EscPosEncoder();
      encoder
        .initialize()
        .align('left')
        .line(text)
        .cut();
      
      const data = encoder.encode();
      await this.sendData(data);
      return { success: true };
    } catch (error) {
      throw new Error(`Print text failed: ${error.message}`);
    }
  }
}

export default new PrinterService();
