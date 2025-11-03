# 🌍 NearbyMe — Angular + RxJS

**NearbyMe** est une application Angular interactive permettant de **découvrir les utilisateurs vivant dans la même ville** (ou le même pays) à partir de l’API publique [randomuser.me](https://randomuser.me/).  
L’objectif est de **manipuler les Observables RxJS** pour filtrer, combiner et transformer les données en temps réel, tout en affichant les utilisateurs proches selon leur **distance géographique calculée via la formule de Haversine**.

---

## 🚀 Objectifs pédagogiques

- Manipuler des **Observables** avec **RxJS** (combineLatest, map, tap, debounceTime, etc.)
- Comprendre et utiliser la **programmation réactive** dans Angular
- Gérer des **formulaires réactifs** avec `ReactiveFormsModule`
- Consommer une **API REST** via le service Angular `HttpClient`
- Implémenter un **filtrage dynamique et temps réel**
- Calculer des **distances géographiques** à partir de coordonnées GPS

---

## 🧠 Aperçu du concept

L’application :
1. Charge **100 utilisateurs aléatoires** depuis l’API `randomuser.me` (résultats fixes grâce à un `seed`).
2. Permet à l’utilisateur de saisir un **nom d’utilisateur (@username)**.
3. Recherche cet utilisateur dans la liste.
4. Si trouvé, récupère sa localisation et **calcule la distance** entre lui et les autres utilisateurs du même pays.
5. Filtre et affiche les **personnes à proximité**, selon une **distance maximale (km)** configurable.


---

## ⚙️ Fonctionnalités principales

| Fonctionnalité | Description |
|----------------|-------------|
| 🔍 Recherche par username | Recherche un utilisateur par son pseudo (champ `login.username`). |
| 📡 Chargement API | Récupère les données depuis [randomuser.me](https://randomuser.me/api). |
| 🧮 Calcul de distance | Utilise la formule **Haversine** pour estimer la distance en km. |
| 🧭 Filtrage géographique | Affiche uniquement les utilisateurs du même pays. |
| 📏 Filtre dynamique | L’utilisateur peut ajuster la **distance maximale (km)**. |
| ⚡ Programmation réactive | Combine les flux (`combineLatest`) pour mise à jour en temps réel. |
| 💬 Interface fluide | Affichage animé et clair des résultats. |

---

## 🧩 Technologies utilisées

| Outil / Librairie | Rôle |
|--------------------|------|
| **Angular** | Framework front-end principal |
| **RxJS** | Programmation réactive et gestion des flux de données |
| **ReactiveFormsModule** | Gestion des formulaires réactifs |
| **HttpClientModule** | Communication avec l’API REST |
| **HTML / CSS (Tailwind-like)** | Interface propre et responsive |

---

## 🧮 Calcul de la distance — Formule de Haversine

```ts
calculateDistance(lat1, lon1, lat2, lon2): number {
  const R = 6371; // rayon de la Terre (km)
  const dLat = this.deg2rad(lat2 - lat1);
  const dLon = this.deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(this.deg2rad(lat1)) *
    Math.cos(this.deg2rad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // distance en km
}
``` 

---
## 📦 Installation et démarrage

1. Cloner le dépôt :
   ```bash
   git clone 
   ```
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Lancer l’application :
   ```bash
   ng serve
   ```
4. Accéder à l’application dans le navigateur à l’adresse `http://localhost:4200/`.
```
---
## 📄 Licence

Ce projet est sous licence MIT. 

---

Merci d’avoir parcouru ce README ! N’hésitez pas à explorer le code et à me contacter si vous avez des questions ou des suggestions.

