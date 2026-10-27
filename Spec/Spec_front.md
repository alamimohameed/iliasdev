# 📋 Spécifications Techniques & Fonctionnelles : App Todo & Organisation

## 1. Vue d'ensemble du Projet

L'objectif est de développer une application web d'organisation et de gestion de tâches avec suivi calendaire, système de typologie des tâches, **suivi des tâches terminées (par jour et par semaine)** et gamification/récompense hebdomadaire.

### Tech Stack

* **Frontend** : React (Vite, Tailwind CSS, TypeScript)
* **Backend** : FastAPI (Python 3.10+)
* **Base de données** : PostgreSQL avec SQLAlchemy (ORM) et Alembic (Migrations)

---

## 2. Architecture des Données (Modèles SQLAlchemy / PostgreSQL)

### 2.1. Énumération des Types de Tâches

* `urgent` : Tâche urgente (à traiter en priorité, échéance immédiate).
* `mandatory` : Tâche obligatoire (impact fort sur l'organisation).
* `optional` : Tâche optionnelle / bonus (réalisée si le temps le permet).
* `fixed` : Tâche fixe / événement ancré dans le temps (ex: réunion, pause, rendez-vous).

### 2.2. Table `tasks` (Tâches)

| Champ | Type | Contraintes / Description |
| --- | --- | --- |
| `id` | Integer / UUID | Clé primaire |
| `title` | String(255) | Nom de la tâche (Requis) |
| `description` | Text | Description optionnelle |
| `date` | Date | Date d'exécution (YYYY-MM-DD) |
| `start_time` | Time | Heure de début (ex: 09:00, obligatoire ou recommandé pour les *fixes*) |
| `end_time` | Time | Heure de fin (ex: 10:00, optionnel/recommandé) |
| `task_type` | Enum / String | Type de tâche : `urgent`, `mandatory`, `optional`, `fixed` |
| `weight` | Integer | Poids / Points de la tâche (par défaut : `1`) |
| `is_done` | Boolean | Statut de réalisation (par défaut : `false`) |
| `completed_at` | DateTime | Horodatage du passage à `is_done = true` (`null` sinon). Sert au suivi des tâches terminées. |
| `created_at` | DateTime | Timestamp de création |
| `updated_at` | DateTime | Timestamp de mise à jour |

### 2.3. Table `weekly_rewards` (Objectifs et Récompenses Hebdomadaires)

| Champ | Type | Contraintes / Description |
| --- | --- | --- |
| `id` | Integer / UUID | Clé primaire |
| `year` | Integer | Année (ex: 2026) |
| `week_number` | Integer | Numéro de semaine ISO (1 à 53) |
| `reward_title` | String(255) | Nom de la récompense (ex: "Un resto ce weekend") |
| `is_claimed` | Boolean | Indique si la récompense est réclamée (`false` par défaut) |

> Le quota de points n'est plus saisi manuellement : il est **calculé** (voir 2.4).

### 2.4. Règle de calcul de l'objectif hebdomadaire

* **Points planifiés** de la semaine = somme des `weight` de **toutes** les tâches de la semaine ISO (tous types confondus, terminées ou non).
* **Points cibles** (`target_points`) = `ceil(0,80 × points planifiés)`.
* **Points validés** (`current_points`) = somme des `weight` des tâches de la semaine avec `is_done = true`.
* La récompense est **débloquée** lorsque `current_points >= target_points` (et `target_points > 0`).
* Le ratio `0,80` est une constante de configuration backend (`REWARD_TARGET_RATIO`).
* L'objectif est **dynamique** : ajouter, modifier ou supprimer une tâche de la semaine recalcule les points cibles.

---

## 3. Endpoints API (FastAPI)

### 3.1. Gestion des Tâches (`/api/v1/tasks`)

* `GET /api/v1/tasks?start_date={date}&end_date={date}`
* Récupère la liste des tâches sur un intervalle donné (filtrage par date pour les vues jour, semaine, mois).


* `POST /api/v1/tasks`
* Crée une nouvelle tâche (en incluant `task_type` et `weight`).


* `PUT /api/v1/tasks/{task_id}`
* Modifie une tâche existante (date, type, horaires, etc.).


* `PATCH /api/v1/tasks/{task_id}/status`
* Bascule le statut `is_done` (`true`/`false`) et met à jour `completed_at` (horodatage courant ou `null`).


* `DELETE /api/v1/tasks/{task_id}`
* Supprime une tâche.



### 3.2. Système de Récompenses (`/api/v1/rewards`)

* `GET /api/v1/rewards/weekly?year={year}&week={week}`
* Récupère la récompense de la semaine et les valeurs calculées selon la règle 2.4 : `planned_points`, `target_points` (80 % des points planifiés), `current_points`, `is_unlocked`.


* `POST /api/v1/rewards/weekly`
* Définir ou modifier la récompense (`reward_title`) d'une semaine donnée et la marquer réclamée (`is_claimed`). Le quota n'est pas envoyé : il est calculé côté serveur.



### 3.3. Suivi des Tâches Terminées (`/api/v1/stats`)

* `GET /api/v1/stats/daily?start_date={date}&end_date={date}`
* Retourne, **pour chaque jour** de l'intervalle : `date`, `tasks_total`, `tasks_done`, `completion_rate` (%), `points_planned`, `points_done`, et la répartition `by_type` (`urgent`, `mandatory`, `optional`, `fixed` → `{ total, done }`).


* `GET /api/v1/stats/weekly?start_year={year}&start_week={week}&end_year={year}&end_week={week}`
* Retourne, **pour chaque semaine** de l'intervalle : `year`, `week_number`, `tasks_total`, `tasks_done`, `completion_rate` (%), `points_planned`, `target_points`, `points_done`, `points_rate` (% des points planifiés déjà accumulés, arrondi à l'inférieur), `reward_unlocked`, `reward_claimed`, et la répartition `by_type`.



---

## 4. Fonctionnalités & Maquette UI (React)

### 4.1. Header / En-tête Principal

* **Affichage de la date courante** : format lisible (ex: *Mardi 27 Octobre 2026*).
* **Bouton principal `+ Ajouter une tâche**` :
* Ouvre une modale/formulaire complet.
* **Champs du formulaire** :
* Nom de la tâche (*input text*).
* Date cible (*datepicker*, modifiable pour n'importe quelle date passée ou future).
* **Type de tâche** (*Sélecteur / Radio buttons*) :
* 🟠 **Urgente**
* 🔴 **Obligatoire**
* 🔵 **Optionnelle**
* 🟣 **Fixe**


* Créneau horaire (*inputs time* : heure début / heure fin - très recommandé pour les tâches *Fixes*).
* Poids de la tâche (*input number*, ex: 1, 2, 5 points pour le calcul des récompenses).





### 4.2. Vues Calendrier (Navigation)

Intégration d'un composant de calendrier avec 3 modes de vue :

1. **Vue Journalière** : Timeline heure par heure mettant en avant les tâches *Fixes*, *Urgentes* et *Obligatoires/Optionnelles* de la journée sélectionnée.
2. **Vue Hebdomadaire** : Grille sur 7 jours (Lundi à Dimanche) avec un aperçu structuré des tâches par jour.
3. **Vue Mensuelle** : Grille du mois entier où chaque case de jour contient des **badges/aperçus** des tâches (titre abrégé, indicateur de statut ✅ terminée / ⏳ à faire, et code couleur selon le type de tâche).

> **Ordre d'affichage** : dans une même journée, les tâches *Urgentes* sont mises en avant (en tête des listes sans horaire, badge « Urgent » visible).
>
> **Actions Globales** :
> * **Checkbox** sur chaque tâche pour faire basculer instantanément son statut en `Done`.
> * Possibilité d'**ajouter, modifier ou supprimer** des tâches pour **n'importe quelle date** (navigation libre dans le calendrier).
> 
> 

### 4.3. Module de Gamification & Récompenses (Hebdomadaire)

* **Widget Hebdomadaire** :
* Affiche la semaine en cours (ex: *Semaine 44*).
* **Barre de progression dynamique** : `[Points validés / Points planifiés]` — la barre pleine (100 %) correspond à **la totalité des points planifiés** de la semaine.
* **Repère à 80 %** : un trait vertical sur la barre (libellé « 80 % ») matérialise le seuil de déblocage de la récompense (règle 2.4).
* **Couleur** : la barre est neutre (sombre) tant que le seuil n'est pas atteint, puis passe **au vert** dès que la progression atteint ou dépasse 80 %.
* Affichage du détail : *« Objectif : 34 pts (80 % de 42 pts planifiés) »*.
* **Intitulé de la récompense** configuré pour la semaine (seul le titre est saisi par l'utilisateur).
* Animation de succès lorsque l'objectif de points est atteint.



### 4.4. Suivi des Tâches Terminées (Jour & Semaine)

* **Suivi journalier** :
* Dans chaque vue calendrier, chaque jour affiche un compteur `tâches terminées / tâches prévues` (ex: *3/5*) et une mini-jauge de complétion.
* Panneau « Bilan du jour » : tâches terminées, taux de complétion (%), points validés, répartition par type (Urgente / Obligatoire / Optionnelle / Fixe).
* **Suivi hebdomadaire** :
* Graphique en barres des **7 jours de la semaine** : tâches terminées vs prévues par jour.
* Récapitulatif de la semaine : total des tâches terminées, taux de complétion, points accumulés, nombre de tâches urgentes terminées.
* **Affichage des points dans le suivi** : on affiche les **points accumulés / points totaux planifiés** (ex: *12 / 51 pts*), et non les points cibles. Juste à côté, la **progression en % comparée au seuil de 80 %** (ex: *23 % / 80 %*). L'indicateur passe au vert lorsque le seuil est atteint (récompense débloquée).
* **Historique** des dernières semaines (ex: 8 semaines) : taux de complétion par semaine, points accumulés / points totaux avec la progression `% / 80 %`, et indication de la récompense débloquée/réclamée.
* Accès via un onglet / une page **« Suivi »** à côté des vues Jour / Semaine / Mois.



---

## 5. Structure du Projet Recommandée

```text
todo-planner/
├── backend/
│   ├── app/
│   │   ├── api/          # Routeurs FastAPI (tasks.py, rewards.py, stats.py)
│   │   ├── core/         # Config (REWARD_TARGET_RATIO = 0.8), DB session setup
│   │   ├── models/       # Modèles SQLAlchemy (Task avec TaskTypeEnum, WeeklyReward)
│   │   ├── schemas/      # Pydantic Schemas (Request/Response, DailyStats, WeeklyStats)
│   │   ├── services/     # Logique métier (calcul objectif 80 %, agrégations de suivi)
│   │   └── main.py       # Point d'entrée FastAPI
│   ├── alembic/          # Migrations DB
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/   # CalendarView (Jour/Hebdo/Mois), TaskModal, RewardWidget, TaskItem, TrackingView (suivi jour/semaine)
    │   ├── hooks/        # React Query / custom hooks API (useTasks, useRewards, useStats)
    │   ├── services/     # Services Axios / Fetch API
    │   ├── types/        # Definitions TypeScript (Task, TaskType, Reward, DailyStats, WeeklyStats)
    │   └── App.tsx
    ├── package.json
    └── tailwind.config.js

```
