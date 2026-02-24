import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sprites = [
    { url: 'https://play.pokemonshowdown.com/sprites/trainers/red.png', filename: 'trainer_red.png' },
    { url: 'https://play.pokemonshowdown.com/sprites/trainers/blue.png', filename: 'trainer_blue.png' }
];

const publicDir = path.join(__dirname, '../public');

sprites.forEach(sprite => {
    const dest = path.join(publicDir, sprite.filename);
    const file = fs.createWriteStream(dest);

    https.get(sprite.url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Successfully downloaded ${sprite.filename}`);
        });
    }).on('error', (err) => {
        fs.unlink(dest, () => { });
        console.error(`Error downloading ${sprite.filename}: ${err.message}`);
    });
});
