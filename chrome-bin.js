// chrome-bin.js
// This file provides the path to the Chrome/Chromium executable for use in Node.js tools (e.g., Puppeteer, Angular e2e, CI environments).

const os = require('os');
const path = require('path');

function getChromePath() {
  const platform = os.platform();
  if (platform === 'win32') {
    // Windows default install locations
    const winPaths = [
      process.env['CHROME_BIN'],
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      'C:/Program Files/Chromium/Application/chrome.exe',
      'C:/Program Files (x86)/Chromium/Application/chrome.exe'
    ];
    for (const p of winPaths) {
      if (p && require('fs').existsSync(p)) return p;
    }
  } else if (platform === 'darwin') {
    // macOS
    const macPaths = [
      process.env['CHROME_BIN'],
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    ];
    for (const p of macPaths) {
      if (p && require('fs').existsSync(p)) return p;
    }
  } else {
    // Linux
    const linuxPaths = [
      process.env['CHROME_BIN'],
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];
    for (const p of linuxPaths) {
      if (p && require('fs').existsSync(p)) return p;
    }
  }
  throw new Error('Chrome/Chromium executable not found. Set CHROME_BIN env variable.');
}

module.exports = getChromePath();
