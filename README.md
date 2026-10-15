# 💊 PillFlow - Suivi Intelligent de Pilule & Rappels Échelonnés

**PillFlow** est une application web progressive (PWA) moderne conçue pour simplifier le suivi de la contraception orale, éliminer la charge mentale et sécuriser la prise quotidienne grâce à un système intelligent de rappels échelonnés.

---

## 🌟 Fonctionnalités Clés

- 🔐 **Comptes & Synchronisation Multi-Appareils (PC & Smartphone)** : Retrouvez exactement vos données, votre historique et vos réglages que vous soyez sur votre téléphone ou votre ordinateur.
- ⏰ **Rappels Échelonnés Intelligents** :
  - **Notification à l'heure H** programmée.
  - **Rappel automatique à H + 30 minutes** si le comprimé n'a pas encore été validé.
  - **Alerte renforcée à H + 1 heure** avec action directe.
- 📲 **Notifications Web Push avec action rapide** : Validez votre prise directement depuis la bannière de notification sans devoir ouvrir l'application.
- 🌸 **Vue Réaliste de la Plaquette Alvéolée** : Visualisation claire des comprimés actifs (21, 24, 28) et des périodes de pause / placebo avec indication du jour en cours.
- 📅 **Calendrier & Historique Visuel** : Suivi des prises régulières, retards, oublis, série de régularité (streak) et calcul du taux de ponctualité.
- 🛡️ **Guide Médical d'Urgence en cas d'Oubli** : Questionnaire pas-à-pas basé sur les recommandations officielles (Haute Autorité de Santé - HAS) pour savoir immédiatement la conduite à tenir (contraception d'urgence, préservatif 7 jours, enchaînement de plaquette).
- 📝 **Journal de Bord** : Enregistrement quotidien des humeurs, saignements (spotting) et effets secondaires (crampes, migraines, nausées...).

---

## 🚀 Synchronisation Multi-Appareils (Base de Données Supabase)

Pour que votre compte soit synchronisé en temps réel entre votre PC et votre smartphone :

### 1. Créer un projet Supabase gratuit
1. Rendez-vous sur [supabase.com](https://supabase.com) et créez un compte gratuit.
2. Créez un nouveau projet (ex: `pillflow`).
3. Dans le menu de gauche, ouvrez **SQL Editor**.
4. Copiez-collez l'intégralité du fichier [`supabase/schema.sql`](./supabase/schema.sql) et cliquez sur **Run**.
   *(Cela crée automatiquement les tables `profiles`, `pill_settings`, `pill_logs`, `symptom_logs`, `push_subscriptions`, ainsi que la sécurité Row Level Security)*.

### 2. Configurer vos clés d'environnement
Récupérez vos clés dans Supabase (**Project Settings > API**) et renseignez votre fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-id-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_publique
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_secrete

# Clés Web Push (déjà incluses et fonctionnelles)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BFnsdTT20sg5JT0kxUmb1enHhnMaB33cCBZ0A7Jl6SnoOscuwoYSELbVL5CLh35uZMmJKC72dBrVZJjoAkrm51g
VAPID_PRIVATE_KEY=f-DpCXBAJhuwhnCTPOz6J-Zh9LLjqxdQO7-HM_xU-es
VAPID_SUBJECT=mailto:contact@pillflow.app

CRON_SECRET=pillflow_secret_cron_token_2026
```

---

## 📱 Déploiement en ligne gratuit (Accessible sur mobile et PC)

La manière la plus simple pour y accéder depuis votre smartphone et votre PC est de déployer sur **Vercel** :

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous avec votre compte GitHub.
2. Cliquez sur **Add New > Project** et importez le dépôt **`GabinBonnier/pillflow`**.
3. Dans la section **Environment Variables**, ajoutez les variables listées ci-dessus.
4. Cliquez sur **Deploy**.
5. Ouvrez le lien généré sur Safari iOS ou Chrome Android et appuyez sur **« Ajouter à l'écran d'accueil »** pour installer l'application comme une app native !

---

## 🛠️ Démarrage Local

```bash
# Installation des dépendances
npm install

# Lancement du serveur de développement
npm run dev

# Construction de production
npm run build
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.
