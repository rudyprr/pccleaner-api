// "/clean/bin" route

const express = require('express');
const { exec } = require('child_process');

const router = express.Router();

// DELETE /clean/bin
router.delete('/', async (req, res) => {
    const command = 'powershell.exe -Command "Clear-RecycleBin -Force"';

    exec(command, (error, stdout, stderr) => {
        res.status(200).json({
            code: 200,
            message: 'Corbeille vidée avec succès',
        });
    });
});


module.exports = router;