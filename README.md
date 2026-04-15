# Questionnaire Platform — AOR Conseil

Plateforme de questionnaires psychométriques (FIRO-B et dérivés).

## Structure du monorepo

```
questionnaire-platform/
├── backend/          # API Flask + SQLAlchemy + MySQL
├── frontend/         # Vite + TypeScript + TanStack + MUI  (à venir)
├── archives/         # Ancienne version Flask monolithique (Notion)
├── docker-compose.yml
└── .env.example
```

## Démarrage rapide

### 1. Variables d'environnement

```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

### 2. Lancement avec Docker

```bash
docker compose up --build
```

### 3. Initialiser la base de données

```bash
docker compose exec backend flask db upgrade
```

### 4. Lancer les tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

## Backend — API REST

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/questionnaires` | Liste des questionnaires |
| GET | `/api/questionnaires/<qid>` | Config + questions |
| POST | `/api/questionnaires/<qid>/submit` | Soumettre des réponses |
| GET | `/api/responses/<id>` | Résultats d'une réponse |
| GET | `/api/invite/<token>` | Valider un token d'invitation |
| POST | `/api/invite/<token>/submit` | Soumettre via invitation |
| POST | `/api/admin/auth/login` | Authentification admin (→ JWT) |
| GET | `/api/admin/dashboard` | KPIs globaux |
| GET | `/api/admin/responses` | Liste des réponses (paginée) |
| GET | `/api/admin/participants` | Liste des participants |
| POST | `/api/admin/participants/import` | Import CSV |
| POST | `/api/admin/participants/<id>/invite` | Générer un lien d'invitation |
| GET | `/api/admin/companies` | Liste des entreprises |
| GET | `/api/admin/export/responses?qid=B` | Export CSV |

## Format du CSV d'import participants

```
company_name;first_name;last_name;email;questionnaire_type
AOR Conseil;Jean;Dupont;jean.dupont@example.com;B
```
