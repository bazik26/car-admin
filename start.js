const { exec } = require('child_process');
const path = require('path');

const port = process.env.PORT || 3000;
const servePath = path.join(__dirname, 'dist', 'car-admin', 'browser');

console.log(`Starting serve on port ${port} with path: ${servePath}`);

const serve = exec(`npx serve -s "${servePath}" -l ${port} --single`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
  }
  console.log(`Stdout: ${stdout}`);
});

serve.stdout.on('data', (data) => {
  console.log(data.toString());
});

serve.stderr.on('data', (data) => {
  console.error(data.toString());
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  serve.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  serve.kill();
  process.exit(0);
});





















