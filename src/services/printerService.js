// ESC/POS commands for thermal printers
const ESC = '\x1B';
const GS = '\x1D';
const LF = '\x0A';

class PrinterService {
  constructor() {
    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;
    this.isConnected = false;
  }

  // Initialize ESC/POS commands
  initPrinter() {
    let cmd = '';
    // Initialize printer
    cmd += ESC + '@';
    // Set alignment to left
    cmd += ESC + 'a' + '\x00';
    return cmd;
  }

  // Text formatting
  text(text) {
    return text;
  }

  bold(text) {
    return ESC + 'E' + '\x01' + text + ESC + 'E' + '\x00';
  }

  large(text) {
    return ESC + '!' + '\x30' + text + ESC + '!' + '\x00';
  }

  center(text) {
    return ESC + 'a' + '\x01' + text + ESC + 'a' + '\x00';
  }

  right(text) {
    return ESC + 'a' + '\x02' + text + ESC + 'a' + '\x00';
  }

  underline(text) {
    return ESC + '-' + '\x01' + text + ESC + '-' + '\x00';
  }

  // Line spacing and feeds
  lineFeed(lines = 1) {
    return ESC + 'd' + String.fromCharCode(lines);
  }

  // Cut paper (partial cut)
  cut() {
    return GS + 'V' + '\x41' + '\x00';
  }

  // Full cut
  cutFull() {
    return GS + 'V' + '\x41' + '\x03';
  }

  // Barcode
  barcode(data, type = 'CODE128') {
    let cmd = '';
    // Set barcode height
    cmd += GS + 'h' + '\x64';
    // Set barcode width
    cmd += GS + 'w' + '\x02';
    // Print barcode
    cmd += GS + 'k' + '\x49' + String.fromCharCode(data.length) + data;
    return cmd;
  }

  // QR Code
  qrCode(data, size = 6) {
    let cmd = '';
    // QR Code: Select model
    cmd += ESC + 'Z' + '\x00\x31\x50\x00';
    // Set size
    cmd += ESC + 'Z' + '\x01' + String.fromCharCode(size);
    // Set error correction
    cmd += ESC + 'Z' + '\x02\x00';
    // Store data
    cmd += ESC + 'Z' + '\x03' + String.fromCharCode(data.length) + data;
    // Print QR
    cmd += ESC + 'Z' + '\x04';
    return cmd;
  }

  // Connect to Bluetooth printer
  async connectToPrinter() {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API not supported. Use Chrome/Edge on desktop or Android.');
      }

      // Request Bluetooth device with serial port service
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: [
          '00001800-0000-1000-8000-00805f9b34fb',
          '00001801-0000-1000-8000-00805f9b34fb'
        ]
      });

      // Connect to GATT server
      this.server = await this.device.gatt.connect();
      
      // Get the serial port service
      this.service = await this.server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      
      // Get the characteristic for writing data
      this.characteristic = await this.service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
      
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
      // Convert string to Uint8Array
      const encoder = new TextEncoder();
      const dataArray = encoder.encode(data);
      
      // Send data in chunks (some printers have MTU limitations)
      const chunkSize = 512;
      for (let i = 0; i < dataArray.length; i += chunkSize) {
        const chunk = dataArray.slice(i, i + chunkSize);
        await this.characteristic.writeValue(chunk);
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      return { success: true };
    } catch (error) {
      throw new Error(`Print failed: ${error.message}`);
    }
  }

  // Print a receipt
  async printReceipt(receiptData) {
    if (!this.isConnected) {
      throw new Error('Please connect to printer first');
    }

    let printData = this.initPrinter();
    
    // Store header
    printData += this.center(this.large(this.bold(receiptData.storeName || 'MY STORE'))) + LF;
    printData += this.center(receiptData.storeAddress || '') + LF;
    printData += this.center(receiptData.storePhone || '') + LF;
    printData += this.center('='.repeat(32)) + LF;
    
    // Order info
    printData += this.left('Date: ' + new Date().toLocaleDateString()) + LF;
    printData += this.left('Time: ' + new Date().toLocaleTimeString()) + LF;
    printData += this.left('Order: ' + receiptData.orderId) + LF;
    printData += this.left('Cashier: ' + receiptData.cashier) + LF;
    printData += this.center('-'.repeat(32)) + LF;
    
    // Items header
    printData += this.left(this.bold('ITEM                QTY   AMOUNT')) + LF;
    printData += this.center('-'.repeat(32)) + LF;
    
    // Items
    let total = 0;
    receiptData.items.forEach(item => {
      const name = item.name.substring(0, 18);
      const qty = item.quantity.toString().padStart(3, ' ');
      const price = (item.price * item.quantity).toFixed(2).padStart(8, ' ');
      printData += this.left(`${name}${' '.repeat(20 - name.length)}${qty}${price}`) + LF;
      total += item.price * item.quantity;
    });
    
    printData += this.center('='.repeat(32)) + LF;
    
    // Totals
    printData += this.left(this.bold('TOTAL:')) + this.right(this.bold('$' + total.toFixed(2))) + LF;
    
    // Tax
    const tax = total * 0.08;
    printData += this.left('TAX (8%):') + this.right('$' + tax.toFixed(2)) + LF;
    
    // Grand total
    printData += this.left(this.bold('GRAND TOTAL:')) + this.right(this.bold('$' + (total + tax).toFixed(2))) + LF;
    printData += this.center('='.repeat(32)) + LF;
    
    // Payment info
    printData += this.left('Payment: ' + receiptData.paymentMethod) + LF;
    printData += this.left('Change: $' + receiptData.change.toFixed(2)) + LF;
    printData += this.center('-'.repeat(32)) + LF;
    
    // Footer
    printData += this.center('THANK YOU FOR SHOPPING WITH US!') + LF;
    printData += this.center('Please visit again') + LF;
    printData += this.center('-'.repeat(32)) + LF;
    printData += this.center(this.qrCode(receiptData.orderId || 'https://example.com')) + LF;
    printData += this.lineFeed(3);
    
    // Cut paper
    printData += this.cut();
    
    // Send to printer
    return await this.sendData(printData);
  }

  // Print test page
  async printTestPage() {
    let printData = this.initPrinter();
    
    printData += this.center(this.large(this.bold('TEST PAGE'))) + LF;
    printData += this.center('='.repeat(32)) + LF + LF;
    
    printData += this.left('Normal text') + LF;
    printData += this.bold('Bold text') + LF;
    printData += this.underline('Underlined text') + LF;
    printData += this.large('Large text') + LF + LF;
    
    printData += this.center('Centered text') + LF;
    printData += this.right('Right aligned') + LF + LF;
    
    printData += this.center('-'.repeat(32)) + LF;
    printData += this.center('ABCDEFGHIJKLMNOPQRSTUVWXYZ') + LF;
    printData += this.center('abcdefghijklmnopqrstuvwxyz') + LF;
    printData += this.center('1234567890!@#$%^&*()') + LF;
    printData += this.center('-'.repeat(32)) + LF + LF;
    
    printData += this.center('Barcode Test:');
    printData += this.barcode('123456789012') + LF + LF;
    
    printData += this.center('QR Code Test:');
    printData += this.qrCode('https://example.com') + LF;
    
    printData += this.lineFeed(3);
    printData += this.cut();
    
    return await this.sendData(printData);
  }
}

export default new PrinterService();