const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logFile = path.join(__dirname, '..', 'upload-debug.log');
    this.log('='.repeat(80));
    this.log('Logger initialized at ' + new Date().toISOString());
    this.log('='.repeat(80));
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    // Log to console
    console.log(logMessage);
    if (data) {
      console.log(data);
    }
    
    // Log to file
    try {
      fs.appendFileSync(this.logFile, logMessage + '\n');
      if (data) {
        fs.appendFileSync(this.logFile, JSON.stringify(data, null, 2) + '\n');
      }
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  error(message, error = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ❌ ERROR: ${message}`;
    
    // Log to console
    console.error(logMessage);
    if (error) {
      console.error(error);
    }
    
    // Log to file
    try {
      fs.appendFileSync(this.logFile, logMessage + '\n');
      if (error) {
        fs.appendFileSync(this.logFile, error.stack || error.toString() + '\n');
      }
    } catch (err) {
      console.error('Failed to write error to log file:', err);
    }
  }

  separator() {
    const line = '-'.repeat(80);
    console.log(line);
    try {
      fs.appendFileSync(this.logFile, line + '\n');
    } catch (err) {
      console.error('Failed to write separator to log file:', err);
    }
  }
}

module.exports = new Logger();
