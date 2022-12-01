/* eslint-disable no-undef */

window.process = {
  env: {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
  },
  argv: process.argv,
  cwd: process.cwd,
};

// eslint-disable-next-line import/no-extraneous-dependencies
window.ipcRenderer = require('electron').ipcRenderer;

window.global = {};
