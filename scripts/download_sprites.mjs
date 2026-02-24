import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IDS = [624, 625, 411, 475, 65, 282, 199, 306, 647, 576, 31, 34];

const publicDir = path.join(__dirname, '..', 'public');
const animatedDir = path.join(publicDir, 'sprites', 'animated');
const animatedShinyDir = path.join(publicDir, 'sprites', 'animated', 'shiny');
const staticDir = path.join(publicDir, 'sprites', 'static');
const staticShinyDir = path.join(publicDir, 'sprites', 'static', 'shiny');

// Ensure directories exist
[animatedDir, animatedShinyDir, staticDir, staticShinyDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(dest)) {
            console.log(`Already exists: ${dest}`);
            return resolve();
        }
        console.log(`Downloading: ${url} -> ${dest}`);
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                fs.unlink(dest, () => { });
                console.error(`Status ${response.statusCode} for ${url}`);
                resolve(); // resolve anyway to continue
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
};

async function downloadAll() {
    for (const id of IDS) {
        // Animated
        await downloadFile(
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`,
            path.join(animatedDir, `${id}.gif`)
        );
        await downloadFile(
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/${id}.gif`,
            path.join(animatedShinyDir, `${id}.gif`)
        );

        // Static
        await downloadFile(
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
            path.join(staticDir, `${id}.png`)
        );
        await downloadFile(
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`,
            path.join(staticShinyDir, `${id}.png`)
        );
    }
    console.log("Done downloading sprites!");
}

downloadAll();
