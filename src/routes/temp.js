// "/clean/temp route"

const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');

const router = express.Router();
const tempDir = os.tmpdir();

// Function to delete files in a directory, ignoring locked files
function clearDirectory(directoryPath) {
    const files = fs.readdirSync(directoryPath);

    for (const file of files) {
        const filePath = path.join(directoryPath, file);

        try {
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                clearDirectory(filePath);
                try {
                    fs.rmdirSync(filePath); 
                } catch (err) {
                    if (err.code !== 'EBUSY' && err.code !== 'EPERM') {
                        throw err;
                    }
                }

            } else {
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    if (err.code !== 'EBUSY' && err.code !== 'EPERM') {
                        throw err;
                    }
                }
            }

        } catch (err) {
            // console.warn(`Impossible de supprimer : ${filePath} (${err.code})`);
        }
    }
}


// DELETE /clean/temp
router.delete('/', (req, res) => {
    try {
        clearDirectory(tempDir);
        
        res.status(200).json({
            code: res.statusCode,
            message: `Répertoire temporaire effacé (sauf les fichiers verrouillés): ${tempDir}`,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            code: res.statusCode,
            error: 'Échec de l\'effacement du répertoire temporaire',
        });
    }
});


module.exports = router;