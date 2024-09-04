const express = require('express');
const { exec } = require('child_process');
const app = express();
const PORT = 3000;

app.use(express.static('public'));

// Objet pour stocker les conteneurs de chaque utilisateur
let userContainers = {}; // Structure: { userId: [containerName1, containerName2, ...] }

// Fonction utilitaire pour exécuter des commandes de manière plus fiable
function execPromise(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error || stderr) {
                reject({ error, stderr });
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

// Lancer le terminal pour un utilisateur
app.get('/launch-terminal', async (req, res) => {
    const userId = req.query.userId; // ID utilisateur, passé comme paramètre de requête
    const port = Math.floor(Math.random() * 20) + 7681; // Port aléatoire entre 7681 et 7700
    const containerName = `okalobeShell-${userId}-${port}`; // Nom unique basé sur userId et port

    try {
        // Vérifier et supprimer tout conteneur existant avec le même nom
        const existingContainerId = await execPromise(`docker ps -a -q --filter "name=${containerName}"`);

        if (existingContainerId) {
            // Supprimer les conteneurs existants avec le même nom
            await execPromise(`docker rm -f ${containerName}`);
            console.log(`Conteneur existant ${containerName} supprimé.`);
        }

        // Lancer un nouveau conteneur ttyd
        const containerId = await execPromise(`docker run -d -p 0.0.0.0:${port}:7681 --name ${containerName} alexos242/ttyd`);
        console.log(`Conteneur lancé pour l'utilisateur ${userId} avec ID: ${containerId}`);

        // Ajouter le conteneur à la liste de l'utilisateur
        if (!userContainers[userId]) {
            userContainers[userId] = [];
        }
        userContainers[userId].push(containerName);

        // Utiliser un nom de conteneur unique pour le conteneur de temporisation
        const timeoutContainerName = `timeout-container-${userId}-${Date.now()}`; // Nom unique pour éviter les conflits

        // Supprimer le conteneur après 2 heures
        await execPromise(`docker run -d --rm --name ${timeoutContainerName} alpine sh -c "sleep 7200 && docker rm -f ${containerName}"`);
        console.log(`Configuration de la suppression automatique pour ${containerName}`);

        res.json({ url: `http://localhost:${port}` });
    } catch (err) {
        console.error(`Erreur: ${err.error || err.stderr}`);
        res.status(500).send('Erreur lors du lancement du conteneur');
    }
});

// Quitter le lab et supprimer les conteneurs d'un utilisateur
app.get('/exit-lab', async (req, res) => {
    const userId = req.query.userId; // ID utilisateur

    if (userContainers[userId] && userContainers[userId].length) {
        try {
            for (const containerName of userContainers[userId]) {
                try {
                    // Vérifier si le conteneur existe avant de le supprimer
                    const containerExists = await execPromise(`docker ps -a -q --filter "name=${containerName}"`);
                    if (containerExists) {
                        await execPromise(`docker rm -f ${containerName}`);
                        console.log(`Conteneur ${containerName} supprimé pour l'utilisateur ${userId}`);
                    } else {
                        console.log(`Conteneur ${containerName} n'existe pas`);
                    }
                } catch (err) {
                    console.error(`Erreur lors de la suppression du conteneur ${containerName}: ${err.error || err.stderr}`);
                }
            }
            delete userContainers[userId]; // Supprimer les conteneurs de cet utilisateur de la liste
            res.send({ message: 'Lab terminé et conteneurs supprimés pour cet utilisateur.' });
        } catch (err) {
            console.error(`Erreur lors de la suppression des conteneurs: ${err.error || err.stderr}`);
            res.status(500).send('Erreur lors de la suppression des conteneurs');
        }
    } else {
        res.send({ message: 'Aucun conteneur à supprimer pour cet utilisateur.' });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
