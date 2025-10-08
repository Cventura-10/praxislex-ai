# Fase 9: PWA Completa y Offline Support

## 🎯 Objetivos
Convertir PraxisLex en una PWA completa con capacidades offline, sincronización en segundo plano y experiencia nativa.

## ✅ Implementaciones

### 1. Service Worker Avanzado
- **Cache strategies** inteligentes por tipo de recurso
- **Offline fallback** para todas las rutas
- **Background sync** para operaciones pendientes
- **Update notifications** cuando hay nueva versión
- **Precaching** de assets críticos

### 2. Manifest Mejorado
- **Iconos** en múltiples tamaños
- **Screenshots** para app stores
- **Shortcuts** de acceso rápido
- **Share target** para compartir contenido
- **Display mode** standalone

### 3. Offline Data Management
- **IndexedDB** para almacenamiento local
- **Queue system** para operaciones pendientes
- **Sync indicator** de estado de conexión
- **Conflict resolution** automática

### 4. Push Notifications
- **Push API** infrastructure
- **Notification permissions** management
- **Background notifications** support
- **Action handlers** integrados

### 5. Install Experience
- **Custom install prompt** mejorado
- **Install instructions** por plataforma
- **Update prompt** cuando hay nueva versión
- **Standalone detection** automática

## 📱 Características PWA

### Service Worker Strategies

#### HTML/Documents
```javascript
// Network first, fallback to cache
registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: 'documents-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
      }),
    ],
  })
);
```

#### Static Assets (JS, CSS)
```javascript
// Cache first for faster loading
registerRoute(
  ({ request }) => 
    request.destination === 'script' || 
    request.destination === 'style',
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);
```

#### Images
```javascript
// Cache first with image optimization
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);
```

#### API Calls
```javascript
// Network first, cache as backup
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);
```

### Offline Queue

```typescript
interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineQueue {
  private queue: QueuedOperation[] = [];
  
  async add(operation: QueuedOperation) {
    this.queue.push(operation);
    await this.persistQueue();
    
    if (navigator.onLine) {
      await this.processQueue();
    }
  }
  
  async processQueue() {
    for (const op of this.queue) {
      try {
        await this.executeOperation(op);
        this.removeFromQueue(op.id);
      } catch (error) {
        op.retries++;
        if (op.retries >= 3) {
          this.removeFromQueue(op.id);
        }
      }
    }
  }
}
```

### Background Sync

```javascript
// Register background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-operations') {
    event.waitUntil(syncPendingOperations());
  }
});

async function syncPendingOperations() {
  const queue = await getOfflineQueue();
  
  for (const operation of queue) {
    try {
      await executeOperation(operation);
      await removeFromQueue(operation.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}
```

## 🔔 Push Notifications Setup

### Request Permission
```typescript
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'not-supported';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
}
```

### Subscribe to Push
```typescript
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
  
  // Send subscription to server
  await supabase.from('push_subscriptions').insert({
    user_id: userId,
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}
```

### Handle Push Events
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url,
      action: data.action,
    },
    actions: [
      {
        action: 'open',
        title: 'Ver',
      },
      {
        action: 'dismiss',
        title: 'Descartar',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
```

## 📦 App Manifest

```json
{
  "name": "PraxisLex - Plataforma Jurídica",
  "short_name": "PraxisLex",
  "description": "Gestión jurídica integral con IA para abogados",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e40af",
  "orientation": "portrait-primary",
  "categories": ["business", "productivity"],
  "icons": [
    {
      "src": "/icon-72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot-mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshot-desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "shortcuts": [
    {
      "name": "Nuevo Caso",
      "short_name": "Caso",
      "description": "Crear un nuevo caso",
      "url": "/casos?action=new",
      "icons": [{ "src": "/icon-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Buscar Cliente",
      "short_name": "Clientes",
      "url": "/clientes",
      "icons": [{ "src": "/icon-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Redacción IA",
      "short_name": "Redactar",
      "url": "/redaccion-ia",
      "icons": [{ "src": "/icon-96.png", "sizes": "96x96" }]
    }
  ],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "file",
          "accept": ["application/pdf", "image/*"]
        }
      ]
    }
  }
}
```

## 🔄 Update Detection

```typescript
function registerUpdateCheck() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      // Check for updates every hour
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && 
              navigator.serviceWorker.controller) {
            // New version available
            showUpdateNotification();
          }
        });
      });
    });
  }
}

function showUpdateNotification() {
  toast({
    title: "Actualización disponible",
    description: "Hay una nueva versión. Recarga para actualizar.",
    action: (
      <Button onClick={() => window.location.reload()}>
        Actualizar
      </Button>
    ),
    duration: Infinity,
  });
}
```

## 📊 Connection Status

```typescript
function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      if (wasOffline) {
        toast.success('Conexión restaurada');
        // Trigger background sync
        if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
          navigator.serviceWorker.ready.then((registration) => {
            return registration.sync.register('sync-operations');
          });
        }
        setWasOffline(false);
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.warning('Sin conexión - trabajando offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);
  
  return isOnline;
}
```

## 🎨 Offline UI Indicator

```tsx
export function ConnectionIndicator() {
  const isOnline = useConnectionStatus();
  
  if (isOnline) return null;
  
  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-white shadow-lg">
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">Modo offline</span>
    </div>
  );
}
```

## 📋 Implementaciones Completadas

### Componentes
1. ✅ `src/components/pwa/OfflineIndicator.tsx` - Indicador de conexión
2. ✅ `src/components/pwa/UpdatePrompt.tsx` - Prompt de actualización
3. ✅ `src/components/pwa/InstallButton.tsx` - Botón de instalación mejorado
4. ✅ `src/hooks/useOnlineStatus.tsx` - Hook de estado de conexión
5. ✅ `src/hooks/usePWA.tsx` - Hook principal PWA
6. ✅ `src/lib/offlineQueue.ts` - Sistema de cola offline
7. ✅ `public/sw.js` - Service Worker avanzado

### Base de Datos
1. ✅ `push_subscriptions` table - Subscripciones push
2. ✅ `offline_operations` table - Operaciones pendientes

### Manifest
1. ✅ `public/manifest.json` - Manifest mejorado
2. ✅ Iconos en múltiples tamaños
3. ✅ Screenshots para stores
4. ✅ Shortcuts de acceso rápido

## 🚀 Funcionalidades

### 1. Trabajo Offline Completo
- Navegación sin conexión
- Formularios funcionan offline
- Datos se sincronizan al reconectar
- Queue de operaciones pendientes

### 2. Instalación Nativa
- Prompt personalizado
- Instrucciones por plataforma
- Detección de instalación
- Modo standalone

### 3. Actualizaciones Automáticas
- Detección de nuevas versiones
- Prompt de actualización
- Update en background
- Rollback si falla

### 4. Push Notifications
- Notificaciones nativas
- Background sync
- Action handlers
- Badge updates

### 5. Performance
- Precaching de assets
- Cache strategies optimizadas
- Lazy loading avanzado
- Resource prioritization

## 📈 Métricas PWA

### Lighthouse Score Objetivo
- **Performance**: 95+
- **Accessibility**: 100
- **Best Practices**: 100
- **SEO**: 100
- **PWA**: 100

### Install Metrics
- **Time to Install**: < 3s
- **Bundle Size**: < 500KB initial
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s

## 🔄 Próximas Mejoras

1. **Advanced Caching**
   - Predictive prefetching
   - ML-based cache decisions
   - Smart cache invalidation

2. **Offline AI**
   - Local ML models
   - Offline document processing
   - Voice recognition offline

3. **Sync Strategies**
   - Conflict resolution UI
   - Manual sync triggers
   - Selective sync

4. **Native Features**
   - File system access
   - Contact picker
   - Share API integration

## 📝 Notas de Implementación

### Service Worker
- Registrado en `main.tsx`
- Update check cada hora
- Cache versioning automático
- Cleanup de caches antiguos

### IndexedDB
- Dexie.js para abstracción
- Schema versioning
- Migration support
- Transaction handling

### Push Notifications
- VAPID keys requeridos
- Backend endpoint necesario
- Permission flow implementado
- Fallback para no-soporte

---

**Fase Completada:** ✅  
**Fecha:** 2025-10-08  
**Impacto:** Alto - Experiencia móvil nativa y trabajo offline
