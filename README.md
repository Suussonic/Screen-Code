# Screen Code

> Inspectez et capturez n'importe quel élément d'une page web en un clic, puis exportez-le en PNG.

---

## Fonctionnement

1. Cliquez sur l'icône de l'extension pour ouvrir la popup.
2. Appuyez sur **Capture**.
3. Survolez les éléments de la page
4. Cliquez sur l'élément voulu.
5. Un overlay apparaît avec l'aperçu cropé de l'élément.
6. Cliquez sur **Exporter en PNG** pour télécharger l'image.
7. Appuyez sur **Échap** ou cliquez en dehors de l'overlay pour annuler.

---

## Structure des fichiers

```
Screen-Code/
│
├── manifest.json               Configuration de l'extension (Manifest V3)
│
├── icons/
│   ├── icon16.png              Icône 16×16 (barre d'outils Chrome)
│   ├── icon48.png              Icône 48×48 (page extensions)
│   └── icon128.png             Icône 128×128 (Chrome Web Store)
│
├── popup/
│   ├── popup.html              Interface de la popup
│   ├── popup.css               Styles de la popup (thème sombre)
│   └── popup.js                Logique de la popup
│
├── background/
│   └── background.js           Service worker (arrière-plan)
│
└── content/
    ├── highlight.js            Module SCHighlight — encadré + label
    ├── overlay.js              Module SCOverlay — aperçu + export PNG
    └── inspector.js            Point d'entrée — orchestration générale
```

---

## Description détaillée de chaque fichier

### `manifest.json`
Fichier de configuration requis par Chrome (Manifest V3).  
Déclare :
- Le nom, la version et la description de l'extension
- La popup par défaut (`popup/popup.html`)
- Les icônes
- Les permissions : `activeTab` (accès à l'onglet actif) et `scripting` (injection de scripts)
- Le service worker (`background/background.js`)

---

### `popup/popup.html`
Structure HTML de la popup (320px de large).  
Contient :
- Un **header** avec le logo `[{}]`, le titre et un bouton engrenage ⚙
- Un bouton **Capture** avec l'icône `CameraOutlined` (Ant Design)

---

### `popup/popup.css`
Styles de la popup.  
Thème sombre (`#0f0f13`), couleur d'accent bleue (`#64c8ff`).  
Gère le layout du header, le bouton Capture (dégradé bleu) et le bouton engrenage.

---

### `popup/popup.js`
Logique de la popup. Deux actions :

| Élément | Action |
|---|---|
| Bouton **Capture** | Injecte les 3 content scripts dans l'onglet actif dans l'ordre (`highlight.js` → `overlay.js` → `inspector.js`), puis envoie le message `activateInspector` et ferme la popup |
| Bouton **Engrenage** | Ouvre `chrome://extensions/shortcuts` pour configurer un raccourci clavier |

> L'injection à la demande (via `chrome.scripting.executeScript`) permet à l'extension de fonctionner même sur des onglets déjà ouverts avant l'installation.

---

### `background/background.js`
Service worker (arrière-plan persistant).  
Écoute le message `captureTab` envoyé par `inspector.js` et répond avec un screenshot complet de l'onglet via `chrome.tabs.captureVisibleTab`.

---

### `content/highlight.js` — `window.SCHighlight`
Gère l'**encadré bleu** et le **label de tag** qui suivent la souris lors de l'inspection (comme le DevTools de Chrome).

| Méthode | Description |
|---|---|
| `SCHighlight.mount()` | Insère l'encadré et le label dans le DOM |
| `SCHighlight.moveTo(el)` | Déplace l'encadré sur l'élément `el` et met à jour le label (`<div#id.classe>`) |
| `SCHighlight.hide()` | Cache l'encadré et le label |
| `SCHighlight.remove()` | Retire les éléments du DOM |
| `SCHighlight.isOwnElement(el)` | Retourne `true` si `el` fait partie de l'UI interne (pour éviter la détection de ses propres éléments) |

---

### `content/overlay.js` — `window.SCOverlay`
Gère l'**overlay** affiché après la sélection d'un élément.

| Méthode | Description |
|---|---|
| `SCOverlay.show(imgDataUrl, rect)` | Affiche l'overlay avec le screenshot cropé sur `rect`, le bouton **Exporter en PNG** et le bouton **Fermer** |

Le crop est réalisé via un `<canvas>` en tenant compte du `devicePixelRatio` pour les écrans Retina.

---

### `content/inspector.js`
Point d'entrée et chef d'orchestre des content scripts.  
Utilise `SCHighlight` et `SCOverlay`.

**Flux d'exécution :**
```
activateInspector (message)
       │
       ▼
   activate()
       │
       ├─ SCHighlight.mount()
       ├─ écoute mousemove → SCHighlight.moveTo(el)
       ├─ écoute click     → capture rect + deactivate() + sendMessage(captureTab)
       └─ écoute keydown   → Échap → deactivate()
                                          │
                              background.js répond avec dataUrl
                                          │
                                  SCOverlay.show(dataUrl, rect)
```

Contient un **guard anti-double-injection** (`window.__screenCodeInjected`) : si le script est injecté une seconde fois, il réactive l'inspecteur directement via `window.__screenCodeActivate()` sans recréer les listeners.

---

## Permissions utilisées

| Permission | Raison |
|---|---|
| `activeTab` | Accéder à l'onglet en cours pour envoyer des messages |
| `scripting` | Injecter les content scripts à la demande |

---

## Installation en mode développeur

1. Ouvrir `chrome://extensions`
2. Activer le **Mode développeur** (interrupteur en haut à droite)
3. Cliquer **Charger l'extension non empaquetée**
4. Sélectionner le dossier `Screen-Code`
5. Pour recharger après modification : cliquer l'icône **↺** sur la carte de l'extension
