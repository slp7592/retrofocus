# Configuration des en-têtes HTTP de sécurité

## ⚠️ Important

Certaines protections de sécurité ne peuvent pas être configurées via des balises `<meta>` et nécessitent des **en-têtes HTTP** envoyés par le serveur web.

## 🔒 En-têtes recommandés

### 1. X-Frame-Options

Protège contre le clickjacking en empêchant l'application d'être chargée dans une iframe.

```
X-Frame-Options: DENY
```

### 2. Content-Security-Policy (frame-ancestors)

Alternative moderne à X-Frame-Options (plus flexible).

```
Content-Security-Policy: frame-ancestors 'none'
```

### 3. X-Content-Type-Options

Empêche le navigateur de deviner le type MIME.

```
X-Content-Type-Options: nosniff
```

### 4. Referrer-Policy

Contrôle les informations de référence envoyées.

```
Referrer-Policy: strict-origin-when-cross-origin
```

### 5. Permissions-Policy

Désactive les fonctionnalités du navigateur non utilisées.

```
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## 🌐 Configuration par serveur

### Apache (.htaccess)

Créez un fichier `.htaccess` à la racine du projet :

```apache
<IfModule mod_headers.c>
    # Protection clickjacking
    Header always set X-Frame-Options "DENY"

    # Content Security Policy complète
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://firebasestorage.googleapis.com; style-src 'self' 'unsafe-inline'; connect-src https://*.firebaseio.com https://*.firebasedatabase.app https://*.googleapis.com https://www.gstatic.com wss://*.firebaseio.com wss://*.firebasedatabase.app; img-src 'self' data: https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; frame-src https://*.firebasedatabase.app; upgrade-insecure-requests;"

    # Autres en-têtes de sécurité
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
</IfModule>
```

### Nginx

Ajoutez dans votre bloc `server` ou `location` :

```nginx
server {
    # ... autres configurations ...

    # Protection clickjacking
    add_header X-Frame-Options "DENY" always;

    # Content Security Policy complète
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://firebasestorage.googleapis.com; style-src 'self' 'unsafe-inline'; connect-src https://*.firebaseio.com https://*.firebasedatabase.app https://*.googleapis.com https://www.gstatic.com wss://*.firebaseio.com wss://*.firebasedatabase.app; img-src 'self' data: https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; frame-src https://*.firebasedatabase.app; upgrade-insecure-requests;" always;

    # Autres en-têtes de sécurité
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
}
```

### Netlify

Créez un fichier `_headers` à la racine du projet :

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://firebasestorage.googleapis.com; style-src 'self' 'unsafe-inline'; connect-src https://*.firebaseio.com https://*.firebasedatabase.app https://*.googleapis.com https://www.gstatic.com wss://*.firebaseio.com wss://*.firebasedatabase.app; img-src 'self' data: https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; frame-src https://*.firebasedatabase.app; upgrade-insecure-requests;
```

### Vercel

Créez un fichier `vercel.json` à la racine du projet :

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://firebasestorage.googleapis.com; style-src 'self' 'unsafe-inline'; connect-src https://*.firebaseio.com https://*.firebasedatabase.app https://*.googleapis.com https://www.gstatic.com wss://*.firebaseio.com wss://*.firebasedatabase.app; img-src 'self' data: https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; frame-src https://*.firebasedatabase.app; upgrade-insecure-requests;"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        }
      ]
    }
  ]
}
```

### GitHub Pages

GitHub Pages ne permet pas de configurer des en-têtes HTTP personnalisés. Solutions alternatives :

1. **Utiliser Cloudflare** devant GitHub Pages (gratuit)
2. **Utiliser Netlify** ou **Vercel** à la place (gratuit)
3. **Accepter la limitation** (protection partielle via meta CSP uniquement)

### Firebase Hosting

Créez un fichier `firebase.json` à la racine du projet :

```json
{
  "hosting": {
    "public": ".",
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://firebasestorage.googleapis.com; style-src 'self' 'unsafe-inline'; connect-src https://*.firebaseio.com https://*.firebasedatabase.app https://*.googleapis.com https://www.gstatic.com wss://*.firebaseio.com wss://*.firebasedatabase.app; img-src 'self' data: https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; frame-src https://*.firebasedatabase.app; upgrade-insecure-requests;"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Permissions-Policy",
            "value": "geolocation=(), microphone=(), camera=()"
          }
        ]
      }
    ]
  }
}
```

## 🧪 Tester vos en-têtes

Une fois configurés, testez vos en-têtes avec :

1. **Outils en ligne** :
   - https://securityheaders.com
   - https://observatory.mozilla.org

2. **Console navigateur** (onglet Network) :
   - Rechargez la page
   - Cliquez sur la requête HTML
   - Vérifiez l'onglet "Headers" → "Response Headers"

3. **Ligne de commande** :
   ```bash
   curl -I https://votre-domaine.com
   ```

## 📝 Notes importantes

### Limitations des balises meta

Les directives suivantes **ne fonctionnent PAS** via `<meta>` :
- ❌ `X-Frame-Options`
- ❌ `frame-ancestors` (dans CSP)
- ❌ `X-Content-Type-Options`
- ❌ `Referrer-Policy`
- ❌ `Permissions-Policy`

Elles **nécessitent** des en-têtes HTTP.

### Protection partielle

Sans serveur web configuré, l'application bénéficie quand même de :
- ✅ CSP partiel via meta (sans frame-ancestors)
- ✅ Validation stricte Firebase
- ✅ Sanitization des inputs
- ✅ Session IDs cryptographiques

### Mode développement local

Si vous développez en local avec `file://` ou un serveur basique :
- Les en-têtes HTTP ne sont pas nécessaires pour tester l'application
- La protection clickjacking n'est pas critique en développement
- Configurez les en-têtes uniquement en **production**

## 🎯 Recommandations

**Pour un déploiement sécurisé :**
1. ✅ Utilisez un hébergement qui supporte les en-têtes HTTP (Netlify, Vercel, Firebase Hosting)
2. ✅ Configurez tous les en-têtes listés ci-dessus
3. ✅ Testez avec securityheaders.com
4. ✅ Gardez les règles Firebase strictes

**Si impossible de configurer les en-têtes :**
- La balise meta CSP fournit déjà une bonne protection
- Les validations Firebase bloquent les injections
- Documentez cette limitation pour les utilisateurs
