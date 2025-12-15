// "/clean/specific-files" route

const { log } = require('console');
const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const router = express.Router();


// Read the configuration file each time (instead of the cached require command).
function getConfigPath() {
    if (process.pkg) {
        // In packaged mode
        return path.join(path.dirname(process.execPath), 'config', 'config.json');
    } else {
        // In development mode
        return path.join(__dirname, '../config/config.json');
    }
}

function getConfig() {
    const configPath = getConfigPath();
    const configData = fsSync.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
}


async function pathExists(targetPath) {
    try {
        await fs.access(targetPath, fs.constants.F_OK);
        return true;
    } catch (error) {
        return false;
    }
}

function parseOlderThan(olderThan) {
    if (!olderThan) return null;
    
    const regex = /^(\d+)([dmhsy])$/;
    const match = olderThan.match(regex);
    
    if (!match) {
        throw new Error(`Format older_than invalide: "${olderThan}". Utilisez le format: nombre + unité (d=jours, h=heures, m=minutes, s=secondes, y=années). Ex: "30d", "2h", "45m"`);
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000,
        'y': 365 * 24 * 60 * 60 * 1000
    };
    
    return value * multipliers[unit];
}


function getDatesToDelete(dateDepth, referenceDate) {
    if (!dateDepth) return null;

    const regex = /^(\d+)([dmy])$/;
    const match = dateDepth.match(regex);
    
    if (!match) {
        throw new Error(`Format date_depth invalide: "${dateDepth}". Uniquement jours (d), mois (m), années (y) sont supportés. Ex: "5d", "1m"`);
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];

    const dates = [];
    let currentDate = new Date(referenceDate);
    currentDate.setHours(0, 0, 0, 0);

    console.log(`INFO : Date depth (${dateDepth}) activée avec date de référence: ${currentDate.toLocaleDateString('fr-FR')}`);

    for (let i = 0; i < value; i++) {
        const dateToAdd = new Date(currentDate);
        dates.push(dateToAdd);

        if (unit === 'd') {
            currentDate.setDate(currentDate.getDate() - 1);
        } else if (unit === 'm') {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else if (unit === 'y') {
            currentDate.setFullYear(currentDate.getFullYear() - 1);
        }
    }

    return dates;
}

function parseDateFormat(format) {
    const formatMap = {
        '%d': '(\\d{2})',
        '%m': '(\\d{2})',
        '%Y': '(\\d{4})',
        '%y': '(\\d{2})'
    };
    
    let regexPattern = format;
    const order = [];
    
    for (const [token, pattern] of Object.entries(formatMap)) {
        if (regexPattern.includes(token)) {
            order.push(token);
            regexPattern = regexPattern.replace(token, pattern);
        }
    }
    
    regexPattern = regexPattern.replace(/[\/\-_\.]/g, (match) => '\\' + match);
    return { regex: new RegExp(regexPattern, 'g'), order };
}

function extractDateFromFilename(filename, format) {
    const { regex, order } = parseDateFormat(format);
    const matches = [...filename.matchAll(regex)];
    
    if (matches.length === 0) return null;
    
    const match = matches[0];
    const dateParts = {};
    
    order.forEach((token, index) => {
        dateParts[token] = match[index + 1];
    });
    
    const year = dateParts['%Y'] || (dateParts['%y'] ? `20${dateParts['%y']}` : null);
    const month = dateParts['%m'];
    const day = dateParts['%d'];
    
    if (!year || !month || !day) return null;
    
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    if (isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    
    return date;
}

function parsePrefixDate(prefixDate, format) {
    const { order } = parseDateFormat(format);
    

    const parts = prefixDate.split(/[\/\-_\.]/); 
    
    const dateParts = {};
    order.forEach((token, index) => {
        dateParts[token] = parts[index];
    });
    
    const year = dateParts['%Y'] || (dateParts['%y'] ? `20${dateParts['%y']}` : null);
    const month = dateParts['%m'];
    const day = dateParts['%d'];
    
    
    if (!year || !month || !day) {
        throw new Error(`Impossible de parser la date "${prefixDate}" avec le format "${format}"`);
    }
    
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (isNaN(date.getTime())) {
        throw new Error(`Date invalide: "${prefixDate}"`);
    }
    
    date.setHours(0, 0, 0, 0);
        
    return date;
}


async function deleteFiles(targetPath, filters) {
    const { prefix_text, extensions, older_than, prefixDate, prefixDate_format, date_depth } = filters;
    const deletedFiles = [];
    const errors = [];
    
    let olderThanMs = null;
    let cutoffDate = null;
    if (older_than) {
        olderThanMs = parseOlderThan(older_than);
        cutoffDate = new Date(Date.now() - olderThanMs);
        console.log(`INFO : Suppression des fichiers plus anciens que ${older_than} (avant le ${cutoffDate.toLocaleString('fr-FR')})`);
    }
    
    let referencePrefixDate = null;
    let datesToDelete = null;

    if (date_depth && prefixDate_format) {
        if (!prefixDate) {
            throw new Error("Le paramètre 'prefixDate' est obligatoire si 'date_depth' est défini. Il sert de date de référence.");
        }
        

        referencePrefixDate = parsePrefixDate(prefixDate, prefixDate_format);
        

        datesToDelete = getDatesToDelete(date_depth, referencePrefixDate);
        
    } else if (prefixDate && prefixDate_format) {

        referencePrefixDate = parsePrefixDate(prefixDate, prefixDate_format); 
        console.log(`INFO : Suppression des fichiers contenant la date exacte ${prefixDate} (${referencePrefixDate.toLocaleDateString('fr-FR')})`);
        

        datesToDelete = [referencePrefixDate];
    }

    try {
        const files = await fs.readdir(targetPath);
        
        const filesToDelete = files.filter(fileName => {
            let matchPrefix = true;
            let matchExtension = true;
            let matchDateFilter = true;

            if (prefix_text) {
                matchPrefix = fileName.startsWith(prefix_text);
            }

            if (extensions && extensions.length > 0) {
                const fileExt = path.extname(fileName).toLowerCase();
                matchExtension = extensions.some(ext => {
                    const normalizedExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
                    return fileExt === normalizedExt;
                });
            }


            if (datesToDelete && prefixDate_format) {
                const dateInFilename = extractDateFromFilename(fileName, prefixDate_format);
                
                if (dateInFilename) {

                    const dateInFilenameMs = dateInFilename.getTime();
                    matchDateFilter = datesToDelete.some(d => d.getTime() === dateInFilenameMs);
                    
                    if (!matchDateFilter) {
                         console.log(`INFO : Date (${dateInFilename.toLocaleDateString('fr-FR')}) non matchée. Fichier ignoré - ${fileName}`);
                    }
                } else {

                    matchDateFilter = false; 
                    console.log(`INFO : Aucune date trouvée dans le nom, fichier ignoré pour le filtre de date - ${fileName}`);
                }
            } else if (prefixDate_format) {
                matchDateFilter = false;
            }


            return matchPrefix && matchExtension && matchDateFilter;
        });

        console.log(`INFO : ${filesToDelete.length} fichier(s) trouvé(s) correspondant aux critères de nom/extension/date.`);

        for (const fileName of filesToDelete) {
            const filePath = path.join(targetPath, fileName);
            
            try {
                const stats = await fs.stat(filePath);
                
                if (stats.isFile()) {
                    if (cutoffDate && stats.mtime > cutoffDate) {
                        console.log(`INFO : Fichier trop récent (mtime), ignoré - ${fileName} (modifié le ${stats.mtime.toLocaleString('fr-FR')})`);
                        continue;
                    }
                    
                    await fs.unlink(filePath);
                    deletedFiles.push({
                        name: fileName,
                        modified: stats.mtime.toLocaleString('fr-FR')
                    });
                    console.log(`SUCCESS : Fichier supprimé - ${fileName}`);
                } else {
                    console.log(`INFO : Ignoré (dossier) - ${fileName}`);
                }
            } catch (error) {
                console.error(`ERROR : Impossible de supprimer ${fileName} - ${error.message}`);
                errors.push({ file: fileName, error: error.message });
            }
        }

    } catch (error) {
        console.error("Erreur lors de la lecture du répertoire :", error.message);
        throw error;
    }

    return { deletedFiles, errors };
}


// Perform the deletion (using the config.json file)
// DELETE clean/specific-files
router.delete('/', async (req, res) => {
    try {
        const config = getConfig();
        const specificFilesConfig = config['specific-files'];
        
        if (!specificFilesConfig.params.target_path || !(await pathExists(specificFilesConfig.params.target_path))) {
            return res.status(400).json({
                success: false,
                message: "Le répertoire cible n'est pas défini ou incorrect."
            });
        }

        const TARGET_PATH = specificFilesConfig.params.target_path;
        const prefix_text = specificFilesConfig.params.prefix || null;
        const extensions = specificFilesConfig.params.extensions || null;
        const older_than = specificFilesConfig.params.older_than || null;
        const prefixDate = specificFilesConfig.params.prefixDate || null;
        const prefixDate_format = specificFilesConfig.params.prefixDate_format || null;
        const date_depth = specificFilesConfig.params.date_depth || null;


        if ((prefixDate || date_depth) && !prefixDate_format) {
            return res.status(400).json({
                success: false,
                message: "Le paramètre 'prefixDate_format' est obligatoire si 'prefixDate' ou 'date_depth' est défini."
            });
        }
        
        if (date_depth && !prefixDate) {
            return res.status(400).json({
                success: false,
                message: "Le paramètre 'prefixDate' est obligatoire si 'date_depth' est défini. Il sert de date de référence."
            });
        }

        if (!prefix_text && (!extensions || extensions.length === 0) && !older_than && !prefixDate && !date_depth) {
            return res.status(400).json({
                success: false,
                message: "Aucun filtre défini. Veuillez spécifier au moins un prefix, des extensions, older_than, prefixDate ou date_depth."
            });
        }

        const result = await deleteFiles(TARGET_PATH, { prefix_text, extensions, older_than, prefixDate, prefixDate_format, date_depth });

        res.json({
            success: true,
            message: `${result.deletedFiles.length} fichier(s) supprimé(s)`,
            target_path: TARGET_PATH,
            filters_applied: {
                prefix_text: prefix_text || 'non défini',
                extensions: extensions || 'non défini',
                older_than: older_than || 'non défini',
                prefixDate: prefixDate || 'non défini',
                prefixDate_format: prefixDate_format || 'non défini',
                date_depth: date_depth || 'non défini',
            },
            deleted_files: result.deletedFiles,
            errors: result.errors.length > 0 ? result.errors : undefined
        });

    } catch (error) {
        console.error("Erreur dans la route DELETE :", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la suppression des fichiers",
            error: error.message
        });
    }
});

// Get the contents of the configuration file
// GET clean/specific-files/config
router.get('/config', (req, res) => {
    const config = getConfig();
    res.json(config);
});


// Edit the configuration file
// PATCH clean/specific-files/config/target_path=:target_path
router.patch('/config/target_path=:target_path', (req, res) => {
    try {
        const target_path = req.params.target_path;
        const prefix_date = req.query.prefix_date;
        const prefix_date_format = req.query.prefix_date_format;
        const prefix = req.query.prefix;
        const extensions = req.query.extensions;
        const older_than = req.query.older_than;
        const date_depth = req.query.date_depth;

        const configPath = getConfigPath();
        const configData = JSON.parse(fsSync.readFileSync(configPath, 'utf8'));

        const updates = {
            target_path: target_path
        };

        if (prefix_date !== undefined) updates.prefixDate = prefix_date;
        if (prefix_date_format !== undefined) updates.prefixDate_format = prefix_date_format;
        if (prefix !== undefined) updates.prefix = prefix;
        if (extensions !== undefined) updates.extensions = extensions.split(',');
        if (older_than !== undefined) updates.older_than = older_than;
        if (date_depth !== undefined) updates.date_depth = date_depth;

        
        configData['specific-files'].params = updates;

        fsSync.writeFileSync(configPath, JSON.stringify(configData, null, 4), 'utf8');

        res.json({
            message: 'Configuration mise à jour avec succès',
            updatedParams: configData['specific-files'].params
        });

    } catch (error) {
        res.status(500).json({
            error: 'Erreur lors de la mise à jour de la configuration',
            details: error.message
        });
    }
});


module.exports = router;