# Copie de travail — site EDDA

Environnement local pour proposer des améliorations au site
<https://worksite.be/edda/> **sans jamais toucher au site en ligne**.

## Contenu

| Chemin | Rôle |
|---|---|
| `site/` | La copie du site (17 pages HTML, 8 CSS, 6 JS, images) |
| `serve.sh` | Lance un serveur local sur <http://localhost:8080> |
| `tools/mirror.py` | Re-télécharge le site depuis worksite.be (pour resynchroniser) |
| `export-propositions.sh` | Prépare un patch + les fichiers modifiés pour le développeur |

## Démarrer

```bash
./serve.sh            # puis ouvrir http://localhost:8080/index.html
./serve.sh 3000       # autre port si 8080 est pris
```

Le serveur ne lit que le dossier `site/`, en local (127.0.0.1) : il n'est pas
accessible depuis l'extérieur.

## Travailler

Modifiez librement les fichiers dans `site/` : textes dans les `.html`, styles
dans `site/css/`, images dans `site/img/`. Rafraîchissez le navigateur pour voir
le résultat (`Cmd+Shift+R` si le CSS semble ne pas bouger — cache).

Pour remplacer une image, écrasez le fichier dans `site/img/` en gardant le même
nom : aucun HTML à modifier.

## Suivre et transmettre vos modifications

Deux branches git :

- `original` — le miroir intact, tel que téléchargé le 2026-08-18. **Ne rien y committer.**
- `propositions` — votre branche de travail (branche active par défaut).

```bash
git status                       # ce que vous avez changé
git diff                         # le détail des changements
git add -A && git commit -m "Nouvelle photo équipe + titre page d'accueil"
./export-propositions.sh         # génère ./export/ à envoyer au développeur
```

Pour repartir de zéro sur un fichier : `git checkout original -- site/index.html`

## Resynchroniser si le site en ligne évolue

```bash
git checkout original
python3 tools/mirror.py --dest site
git add -A && git commit -m "Resynchronisation du miroir"
git checkout propositions && git rebase original
```

## Bon à savoir

- **Connexion requise** pour l'affichage complet : la police Inter (Google
  Fonts), les images de démo `picsum.photos` et quelques logos technos
  (Wikimedia) sont chargés depuis Internet. Le reste fonctionne hors ligne.
- **Le formulaire de contact** (`Contact.html`) ne peut pas envoyer d'e-mail en
  local — c'est normal, il n'y a pas de backend.
- Les bandeaux `img/*-band.png` pèsent 9–10 Mo chacun (~78 Mo au total) :
  c'est une piste d'amélioration évidente à proposer (conversion WebP/AVIF et
  redimensionnement feraient gagner un facteur ~20 sur le temps de chargement).
