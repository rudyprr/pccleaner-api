// "/clean/clipboard" route

const express = require('express');
const { exec } = require('child_process');

const router = express.Router();


// DELETE /clean/clipboard
router.delete('/', async (req, res) => {
    const clearCurrentCommand = 'powershell.exe -Command "Set-Clipboard $null"';
    
    const clearHistoryCommand = 'powershell.exe -Command "[Windows.ApplicationModel.DataTransfer.Clipboard, Windows, ContentType=WindowsRuntime]::ClearHistory()"';

    exec(clearCurrentCommand, (err) => {});

    exec(clearHistoryCommand, (error, stdout, stderr) => {
        res.status(200).json({
            code: 200,
            message: 'Historique du presse-papiers supprimé (à vérifier: Win+V).',
        });
    });
    
});

module.exports = router;