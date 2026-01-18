# B Rimon Management — Frontend-only SPA

Livraison: application frontend-only prête pour hébergement statique (Hostinger).

Principales caractéristiques :
- SPA en ES modules (modules JS natifs)
- LocalStorage comme pseudo-DB
- Auth client-side avec PBKDF2 (SubtleCrypto) + salt
- Rôles: super_admin, admin, mini_admin, employee, orders_manager
- Gestion de projets, tâches, time logs détaillés
- Workflow commandes (orders)
- Multilingue (he/en), RTL support
- Exports CSV + PDF (basique)
- Responsive, styles premium, animations légères

Démarrage rapide :
1. Déployer tous les fichiers sur ton hébergement statique.
2. Ouvrir `index.html`.
3. Comptes initiaux seedés : `avri, daniel, sasha, mathy, morine, noumi, yair, itamar`
   - Mot de passe par défaut (seed) : `Password!2026`
   - Avri est `admin` (Director). Tu peux créer `super_admin` via UI si besoin.
4. Depuis l'UI Super Admin / Admin tu peux modifier utilisateurs, mots de passe, projets, tâches.
5. Pour changer le logo, remplace `assets/logo.svg`.

Remarques de sécurité :
- Le stockage est côté client ; ne pas utiliser pour données sensibles en production.
- PBKDF2 côté client améliore la résistance mais pour production un backend est requis.
