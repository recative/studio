/* eslint-disable no-undef */

window.process = {
  env: {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
  },
  argv: process.argv,
  cwd: process.cwd,
};

window.global = {};
