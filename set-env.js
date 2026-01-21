const fs = require('fs');
const path = require('path');

// Load environment variables (fallback to current if needed, though usually populated by Netlify)
const apiUrl = process.env.API_URL || 'https://cms-api.aryanmishra.work/api/public';
const ogGeneratorUrl = process.env.OG_GENERATOR_URL || 'https://og-generator-fhkclcdyf-aryan-mishras-projects-b8f77aee.vercel.app';

const targetPath = path.join(__dirname, 'src/environments/environment.prod.ts');

const envConfigFile = `export const environment = {
    production: true,
    apiUrl: '${apiUrl}',
    ogGeneratorUrl: '${ogGeneratorUrl}'
};
`;

console.log(`The file ${targetPath} will be written with the following content:`);
console.log(envConfigFile);

fs.writeFile(targetPath, envConfigFile, function (err) {
    if (err) {
        throw console.error(err);
    } else {
        console.log(`Angular environment.prod.ts file generated correctly at ${targetPath} \n`);
    }
});
