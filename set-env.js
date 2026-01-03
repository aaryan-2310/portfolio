const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/environments/environment.prod.ts');

// Load API_URL from environment or fallback to static string
const apiUrl = process.env.API_URL || 'https://cms-api.aryanmishra.work/api/public';

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}'
};
`;

console.log(`Generating environment.prod.ts with API_URL: ${apiUrl}`);

fs.writeFileSync(targetPath, envConfigFile);
