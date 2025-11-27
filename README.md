# Mur de pixels

Une fresque collaborative : chacun rejoint la session, choisit un avatar, sélectionne une couleur et pose des pixels sur la carte du monde. Chaque pixel apparaît instantanément chez tous les participants, ce qui transforme la page en atelier créatif en temps réel.

## Fonctionnalités

- Rejoindre la fresque avec un pseudo et un avatar.
- Voir en direct qui est connecté et, pour les admins, modérer les participations.
- Choisir une couleur via un sélecteur ou des raccourcis rapides et suivre le compteur de pixels déjà posés.
- Cliquer sur la carte pour déposer un pixel exactement à l’endroit souhaité et découvrir qui a posé les pixels existants.

## Démarrer le projet en local

1. Installer les dépendances :
	 ```bash
	 npm install
	 ```
2. Démarrer l'application :
	 ```bash
	 npm run dev
	 ```

## Version en ligne

- Lien vers l'application déployée : [https://collaborative-pixel-wall-app.onrender.com/](https://collaborative-pixel-wall-app.onrender.com/)

## Technologies principales

- **Nuxt 4 + Vue 3** : socle applicatif, pages et composants.
- **Nitro / WebSocket H3** : diffusion temps réel côté serveur.
- **Leaflet** : carte interactive qui sert de support visuel à la fresque.
- **TypeScript + CSS scoped** : typings partagés client/serveur et styles encapsulés.

## Auteur

- Alexis FRANGUL
