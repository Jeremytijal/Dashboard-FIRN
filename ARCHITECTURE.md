# 🏗️ Architecture du Dashboard FIRN

## 📁 Structure du projet

```
Dashboard-FIRN/
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── Layout.tsx       # Layout principal (header, navigation)
│   │   ├── StatCard.tsx     # Carte d'affichage des statistiques
│   │   └── ClientList.tsx   # Liste des clients à relancer
│   │
│   ├── pages/
│   │   └── Dashboard.tsx    # Page principale du dashboard
│   │
│   ├── hooks/
│   │   └── useAirtable.ts   # Hook principal - orchestre toutes les données
│   │
│   ├── services/
│   │   ├── shopify.ts       # Service API Shopify (CA, PM, UPT, Repeat)
│   │   └── airtable.ts      # Service API Airtable (Clients, Objectifs)
│   │
│   ├── data/
│   │   └── mockData.ts      # Types et données mock (SalesData, Client)
│   │
│   └── lib/
│       └── utils.ts         # Fonctions utilitaires
│
├── netlify/
│   └── functions/
│       └── shopify-orders.ts  # Proxy Netlify pour contourner CORS Shopify
│
└── Configuration
    ├── netlify.toml         # Config Netlify (build, functions)
    ├── vite.config.ts       # Config Vite
    ├── tailwind.config.js   # Config Tailwind CSS v4
    └── .env                 # Variables d'environnement (non commit)
```

---

## 🔄 Flux de données

```
┌─────────────────────────────────────────────────────────────────┐
│                         Dashboard.tsx                            │
│                    (Page principale React)                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      useAirtable.ts                              │
│               (Hook - Orchestrateur central)                     │
│                                                                  │
│  • Gère le state : salesData, boutiqueStats, clients, vendors   │
│  • Gère selectedVendor pour filtrer par collaborateur           │
│  • Récupère objectifDuJour depuis Airtable                      │
│  • Fetch en parallèle toutes les données                        │
└───────────┬─────────────────────────────────┬───────────────────┘
            │                                 │
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────────────┐
│    shopify.ts         │         │       airtable.ts             │
│   (Service Shopify)   │         │    (Service Airtable)         │
│                       │         │                               │
│ • getShopifyStats()   │         │ • getClientsToContact()       │
│ • getShopifyVendors() │         │   (vue "POS + 30j")           │
│ • getCustomerOrderCounts()      │ • getObjectifDuJour()         │
│ • calculateRepeatFromOrders()   │   (vue "Objectifs du jour")   │
└───────────┬───────────┘         └───────────────────────────────┘
            │                                 │
            ▼                                 │
┌───────────────────────┐                     │
│ Netlify Function      │                     │
│ shopify-orders.ts     │                     │
│ (Proxy API)           │                     │
└───────────┬───────────┘                     │
            │                                 │
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────────────┐
│   Shopify Admin API   │         │      Airtable API             │
│   (firn-fr.myshopify) │         │   (Base: app2frF4RzVUnuyCU)   │
└───────────────────────┘         └───────────────────────────────┘
```

---

## 📊 Sources de données

### Shopify (via Netlify Function)
| Donnée | Fonction | Calcul |
|--------|----------|--------|
| **CA du jour/mois** | `getShopifyStats()` | Somme de `current_total_price` des commandes POS |
| **PM (Panier Moyen)** | `calculateStats()` | CA / Nb commandes |
| **UPT (Unité Par Transaction)** | `calculateStats()` | Nb articles / Nb commandes |
| **Repeat** | `calculateRepeatFromOrders()` | % clients avec >1 commande ce mois |
| **Vendeurs** | `getShopifyVendors()` | Extraits de `user_id` + map hardcodée |

### Airtable
| Table | Donnée | Vue utilisée |
|-------|--------|--------------|
| **Clients** | Clients à relancer | `POS + 30j` (filtre automatique) |
| **Objectifs** | Objectif du jour | `Objectifs du jour` |
| **Stats** | Historique (non utilisé actuellement) | - |
| **NPS** | Scores NPS (non implémenté) | - |

---

## 🔑 Variables d'environnement

```bash
# .env (ne pas commit !)
VITE_AIRTABLE_API_KEY=patXXXXXXXXXXXXXX.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Dans Netlify (Settings > Environment Variables)
SHOPIFY_ADMIN_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 👥 Map des vendeurs Shopify

```typescript
// Dans shopify.ts et airtable.ts
const vendorNames = {
    '129862140283': 'Jérémy',
    '129870954875': 'Habib',
    '129338540411': 'Sacha',
    '130146435451': 'Maelle Peiffer',
    '130146468219': 'Fiona Couteau',
    '130156593531': 'Kelly Barou Dagues',
};
```

---

## 🎯 Fonctionnalités principales

### 1. Sélection vendeur
- Dropdown en haut du dashboard
- Change les stats affichées (CA, PM, UPT, Repeat)
- `boutiqueStats` reste TOUJOURS global (pour l'objectif)

### 2. Objectif du jour
- Barre de progression vers l'objectif
- Objectif entré dans Airtable (table Objectifs)
- Toujours basé sur les stats globales boutique

### 3. Clients à relancer
- Filtrés via vue Airtable "POS + 30j" (achat en boutique > 30 jours)
- Affiche : nom, produit, montant, vendeur, NPS (coloré), badge Repeat
- Lien WhatsApp pré-rempli

### 4. Repeat
- **Boutique** : % de clients uniques ayant commandé >1 fois ce mois (POS)
- **Vendeur** : idem mais filtré par `user_id` du vendeur

---

## 🔧 Points techniques importants

### Proxy Netlify (CORS)
Shopify Admin API n'autorise pas les appels depuis le navigateur → Netlify Function `shopify-orders.ts` fait le proxy.

### Pagination Shopify
- Utilise `page_info` pour la pagination curseur
- ⚠️ Quand `page_info` est présent, aucun autre paramètre n'est permis !
- Limite de sécurité : 1000 commandes max

### Filtrage POS
- Toutes les stats sont filtrées sur `source_name === 'pos'`
- Exclut les commandes web (`source_name === 'web'`)

### Calcul du CA
- Utilise `current_total_price` (= Ventes totales TTC Shopify)
- Correspond exactement aux chiffres Shopify quand filtré POS

---

## 🚀 Commandes utiles

```bash
# Développement local
npm run dev

# Build production
npm run build

# Déployer (auto via GitHub → Netlify)
git add . && git commit -m "message" && git push
```

---

## 📝 À implémenter / améliorer

- [ ] NPS depuis Airtable (actuellement à 0)
- [ ] Prime vendeur (formule à définir)
- [ ] Repeat sur 6 mois (problème de pagination actuel)
- [ ] Cache côté client pour éviter trop d'appels API
- [ ] Refresh automatique toutes les X minutes

