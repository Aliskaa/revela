## Réflexion sur l’évolution de la plateforme de questionnaires

### 1. État actuel du projet

- **Stack actuelle**
  - Backend : `Flask` monolithique (`app.py`) + intégration Notion via API.
  - Frontend : templates HTML/CSS/JS (questionnaire, résultats) avec UX déjà soignée (dark mode, transitions, validation client).
  - Données : stockées dans des bases Notion différentes selon le questionnaire (B, F, S, C).
  - Admin : pages Flask protégées par Basic Auth pour consulter les résultats (via Notion).

- **Qualités actuelles**
  - Code lisible, architecture simple, logique métier déportée dans les modules `questionnaire_*`.
  - Front moderne en pur HTML/JS, suffisant pour un parcours questionnaire fluide.
  - Intégration Notion claire (création de page, récupération de page, requête de base).

- **Limites**
  - Forte dépendance à Notion (fiabilité, latence, contrôle limité sur les données).
  - Gestion d’erreurs Notion minimaliste (exceptions silencieuses, peu de visibilité).
  - Secret key et mot de passe admin avec valeurs par défaut dans le code.
  - Peu de validation côté serveur et pas encore de tests automatisés.

---

### 2. Migration Notion → MySQL

**Objectif** : remplacer Notion par une base MySQL pour mieux contrôler les données, renforcer la robustesse et faciliter le reporting.

- **Approche recommandée**
  - Utiliser **Flask + SQLAlchemy (ou SQLModel)** avec **MySQL** (par ex. via une RDS).
  - Introduire une **couche de services** pour le stockage (ne plus appeler directement Notion depuis les routes).

- **Équivalents fonctionnels**
  - `notion_create_page(db_id, properties)`  
    → `save_response(info, scores, qid)` qui crée une réponse en base.
  - `notion_get_page(page_id)`  
    → `get_response(response_id)` ou similaire.
  - `notion_query_db(db_id, ...)` + `extract_notion_results(...)`  
    → `list_responses_for_questionnaire(qid, limit, offset)` côté MySQL.

- **Bénéfices**
  - Contrôle complet sur le schéma, les requêtes et les agrégations.
  - Moins de dépendance externe (pas de quota API Notion, moins de points de panne).
  - Plus simple d’ajouter des filtres par entreprise, dates, etc. pour l’admin.

---

### 3. Nouvelle structure de code (séparation plus propre)

Passer d’un `app.py` monolithique à une structure modulaire :

- **Core Flask**
  - `app/__init__.py` : création de l’app, chargement de la config, init de la DB.
  - `app/config.py` : lecture des variables d’env (MySQL, secrets, mode debug, etc.).

- **Données & services**
  - `app/models.py` : modèles SQLAlchemy (`Company`, `Participant`, `QuestionnaireResponse`, `Score`, `InviteToken`).
  - `app/services/responses.py` : logique de haut niveau pour créer/lire des réponses et scores.
  - `app/services/invitations.py` : création/validation de tokens d’invitation.

- **Routes**
  - `app/blueprints/public.py` :
    - `/` (home), `/questionnaire/<qid>`, `/submit/<qid>`, `/results/<qid>/<response_id>` (ou token).
  - `app/blueprints/admin.py` :
    - `/admin`, `/admin/<qid>`, upload CSV, gestion des entreprises et participants.

- **Questionnaires**
  - Conserver le dossier `questionnaires/` pour les questions, calculs de scores et labels.
  - Éventuellement introduire une petite `dataclass` `QuestionnaireConfig` pour typer les entrées de `QUESTIONNAIRES`.

---

### 4. Frontend : HTML/JS vs React (Vite + TS + TanStack + MUI)

- **Option 1 : garder HTML/JS (état actuel)**
  - Avantages :
    - Simplicité de déploiement (un seul projet Flask).
    - Aucune chaîne de build front à gérer.
    - Suffisant pour un parcours “questionnaire → résultats” plutôt linéaire.
  - Inconvénients :
    - Moins confortable si on veut construire un gros back‑office interactif (tableaux dynamiques, filtres avancés, graphiques).

- **Option 2 : ajouter un front React dédié (Vite + TS + TanStack Query + MUI)**
  - Avantages :
    - Idéal pour un **dashboard admin riche** (listes filtrables de participants, stats, graphiques, navigation SPA).
    - Structuration claire du front à moyen/long terme.
  - Inconvénients :
    - Complexité supplémentaire : projet front séparé, API REST, CORS, build et hosting du front.
    - Probablement surdimensionné pour le simple formulaire déjà très soigné.

- **Recommandation actuelle**
  - Garder le questionnaire public en **HTML/JS pur** (déjà très correct).
  - Envisager un **front React léger uniquement pour l’admin** si (et quand) le besoin en back‑office devient plus avancé.

---

### 5. RGPD : points de vigilance

- **Nature des données**
  - Données personnelles : nom, email, organisation.
  - Données sur les ressentis / comportements → potentiellement sensibles (profil psychologique).

- **Implications RGPD**
  - Préciser clairement la **finalité** : accompagnement, coaching, diagnostics, etc.
  - Définir et communiquer la **base légale** :
    - Principalement le **consentement explicite** des personnes, ou exécution d’un contrat dans un contexte d’accompagnement individuel.
  - Appliquer les principes de :
    - **Minimisation** (ne collecter que ce qui est nécessaire).
    - **Limitation de durée de conservation** (ex. 2 ans après la fin de la relation).
    - **Sécurité** (accès restreint, HTTPS, mots de passe forts, pas de partage sauvage des résultats individuels).

- **Droits des personnes**
  - Pouvoir répondre à :
    - Droit d’accès aux données (fournir un export des réponses).
    - Droit à l’effacement (supprimer les données d’un participant sur demande).
    - Droit de rectification (corriger des infos de contact erronées).

- **Sécurité technique**
  - HTTPS obligatoire.
  - Limiter les accès admin (authentification robuste, pas de mot de passe codé en dur en prod).
  - Restreindre les droits du user MySQL (RDS) au minimum nécessaire.

---

### 6. Multi‑entreprises, participants et RGPD

Objectif : pouvoir gérer ~200 personnes réparties dans plusieurs entreprises, tout en contrôlant qui voit quoi.

- **Séparation des rôles**
  - Le cabinet / la personne qui administre le dispositif :
    - Accès aux résultats individuels (pour le coaching).
  - Les entreprises clientes :
    - Accès idéalement à des **données agrégées et anonymisées** (moyennes par dimension, par équipe, etc.), pas aux détails nominativement identifiables, sauf consentement explicite.

- **Modèle de données cible (simplifié)**
  - `companies` : entreprises (id, nom, contact…).
  - `participants` : personnes invitées (id, company_id, nom, email, rôle éventuel…).
  - `questionnaire_responses` : réponse à un questionnaire (id, participant_id, questionnaire_type, date, métadonnées).
  - `scores` : valeurs associées à une réponse (response_id, clé, valeur).
  - `invite_tokens` : liens d’invitation (token aléatoire, participant_id, questionnaire_type, dates de création/expiration, statut).

---

### 7. Invitations individuelles et liens uniques

**Problème** : comment partager le formulaire à chaque personne de manière simple, sécurisée et compatible RGPD ?

- **Stratégie recommandée**
  - Pour chaque participant, générer un **token d’invitation** (UUID ou token aléatoire long, non devinable).
  - Stocker ce token dans une table `invite_tokens` liée au participant et au questionnaire.

- **Flux d’invitation**
  1. L’admin importe un **CSV** (nom, prénom, email, entreprise, type de questionnaire…).
  2. Le backend crée/associe les `companies` et `participants`.
  3. Pour chaque participant, la plateforme génère un lien unique :
     - Exemple : `https://tonapp.com/invite/<token>`
  4. L’admin envoie les liens par email (manuellement au début, ou via un envoi automatisé plus tard).

- **Utilisation du lien côté participant**
  - La route `/invite/<token>` :
    - Valide le token (non expiré, non déjà utilisé si tu veux une seule réponse).
    - Identifie le participant et le questionnaire.
    - Pré-remplit (ou verrouille) les infos identité (nom, email, organisation).
    - Enregistre la réponse en liant `questionnaire_response` au `participant`.

- **Avantages**
  - Pas besoin de comptes/mots de passe pour les participants.
  - Tu maîtrises précisément qui répond à quoi.
  - Tu peux invalider un lien à tout moment (RGPD / sécurité).

---

### 8. Pages d’admin & CSV

- **Import CSV**
  - Page d’admin permettant de charger un CSV :
    - Colonnes types : `company_name; first_name; last_name; email; questionnaire_type`.
  - Le backend :
    - Crée les entreprises si besoin.
    - Crée ou met à jour les participants.
    - Génère les tokens d’invitation correspondants.

- **Interface d’admin**
  - Liste des participants par entreprise.
  - Statut de l’invitation : “invité”, “a répondu”, “en attente”, etc.
  - Possibilité d’exporter :
    - Un CSV anonymisé pour l’entreprise.
    - Un CSV complet pour ton usage interne (si conforme à ce qui est annoncé aux personnes).

---

### 9. Choix de framework : Flask vs Django

- **Flask**
  - Léger, flexible, idéal pour l’architecture actuelle.
  - Facile à enrichir graduellement (SQLAlchemy, authentification, services, etc.).
  - Tu es déjà sur Flask, ce qui réduit l’effort de migration.

- **Django**
  - Offre un admin, un ORM, un système d’authentification complet dès le départ.
  - Plus adapté à de très gros projets structurés ou lorsque l’on veut beaucoup de fonctionnalités prêtes à l’emploi.
  - Impliquerait quasiment une réécriture du projet actuel.

- **Conclusion**
  - Pour la taille et la nature du projet actuel, **Flask** reste le meilleur compromis :
    - Migration plus simple,
    - Contrôle fin sur les briques que tu ajoutes,
    - Suffisant pour API + admin personnalisée.

---

### 10. Infra envisagée : RDS + EC2 (et compléments possibles)

- **Idée de base**
  - **AWS RDS (MySQL)** : base de données managée (sauvegardes, mises à jour automatiques).
  - **EC2** : VM pour héberger l’application Flask (ou via un container Docker).

- **Compléments possibles**
  - **Load balancer (ALB)** si tu as besoin de haute dispo ou d’évoluer à plus de trafic.
  - **ACM + HTTPS** : certificat SSL géré par AWS (ou autre fournisseur) pour sécuriser les échanges.
  - **S3** pour stocker d’éventuels exports (PDF, CSV) si tu veux les partager de manière sécurisée.
  - **CloudWatch** pour surveiller logs et métriques (erreurs, latence, etc.).

---

### 11. Estimation temps, coût financier et facturation (pour une amie)

**Hypothèse** : projet tel que décrit ci‑dessus, sans sur‑complexifier, pour ~200 utilisateurs et quelques entreprises.

- **Temps de travail (ordre de grandeur)**
  - Modélisation DB + mise en place SQLAlchemy + migration des flux Notion → MySQL : ~2 à 4 jours.
  - Refonte du code Flask en modules/blueprints + services : ~2 jours.
  - Pages d’admin (liste, détail, import CSV, génération de liens) : ~3 à 5 jours.
  - Mise en place de l’infra (RDS, EC2, déploiement, HTTPS, paramétrage de base) : ~1 à 2 jours.
  - Ajustements RGPD (texte de consentement, exports/suppressions simples, tests de bout en bout) : ~1 à 2 jours.
  - **Total indicatif** : autour de **9 à 15 jours de travail** selon le niveau de finition, de test et d’automatisation.

- **Coût infra AWS (approximation mensuelle, petite échelle)**
  - RDS MySQL petite instance (db.t3.micro ou équivalent) : de l’ordre de **15–30 €/mois** selon stockage et région.
  - EC2 petite instance (t3.micro/t3.small) + EBS : de l’ordre de **10–25 €/mois**.
  - Stockage S3 / trafic sortant : faible au début (quelques euros).
  - **Total mensuel typique** : ordre de grandeur **30–60 €/mois**, tant que le trafic reste modeste.

- **Facturation (pour une amie)**
  - Valeur réelle d’un tel projet (9–15 jours) à un TJM de 400–600 €/jour serait normalement dans une fourchette **3 600–9 000 €** HT.
  - Comme c’est pour une amie, pistes :
    - Soit **facturer le strict minimum** pour couvrir ton temps à un tarif “amical” (ex. 250–300 €/jour → 2 250–4 500 €).
    - Soit convenir d’un **forfait réduit** (ex. 2 000–3 000 €) ciblant une V1 raisonnable (DB + invitations + admin simple), en expliquant bien que c’est une grosse ristourne par rapport à un prix marché.
    - Possibilité aussi de **répartir** : elle paye l’infra mensuelle, et tu “offres” une partie de ton temps de dev si tu veux faire un geste encore plus fort.

Ces ordres de grandeur sont à ajuster selon ton niveau d’expérience, ton TJM habituel et ce que tu souhaites faire pour elle, mais ils donnent un cadre réaliste pour le temps et le coût global du projet.

