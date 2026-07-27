# 🎨 Color Game

**¿Qué tan buena es tu memoria para los colores?**

Un juego de memoria cromática: te enseñamos un color durante unos segundos, desaparece, y tienes que **recrearlo desde cero** moviendo los deslizadores de Tono, Saturación y Brillo. Cuanto más te acerques, más puntos ganas.

Simple. Cruel. Adictivo.

🕹️ **Juega ahora:** [colormemory.vercel.app](https://colormemory.vercel.app/)

---

## 🎮 Cómo se juega

1. Aparece un color en pantalla. **Memorízalo.**
2. El color desaparece.
3. Usas los deslizadores (Tono / Saturación / Brillo) para **recrearlo de memoria**.
4. Comparamos tu color con el original y te damos una nota del **0 al 10**.

Cuanto más rápido y más preciso, mejor: hay **bonus de velocidad** y **combos** por encadenar rondas buenas.

---

## ✨ Modos de juego

| Modo | Descripción |
|------|-------------|
| 🎯 **Clásico** | 5 rondas. Tu media final es tu puntuación. |
| 📅 **Desafío Diario** | Todo el mundo juega los **mismos colores** cada día (misma semilla) y compite en la clasificación global. |
| ☠️ **Supervivencia** | Muerte súbita: falla y pierdes vidas. ¿Hasta qué ronda aguantas? |
| ⏱️ **Contrarreloj** | ¿Cuántos colores aciertas en **60 segundos**? |
| 🧘 **Zen** | Sin tiempo, sin presión. Solo tú y el color. |
| 🔄 **Inverso** | Te damos el nombre del color, tú tienes que crearlo. |
| ⚔️ **Duelos / Retos** | Comparte un enlace con tus colores y tu puntuación: tus amigos juegan lo mismo e intentan ganarte. |

---

## 🏆 Qué más hay

- **Dificultades:** Fácil (3s), Difícil (2s), Brutal (1s) y **A ciegas** (sin previsualización).
- **Progresión:** niveles, experiencia (XP) y **Gotas de Tinta** como moneda del juego.
- **Tienda:** mejoras (pistas extra, más tiempo, segunda oportunidad, multiplicadores) y objetos cosméticos (temas, skins de interfaz, marcos, cursores).
- **Logros:** más de 30 medallas por desbloquear.
- **Temporadas / Pase de batalla:** cada 30 días, con recompensas y un tema exclusivo al completarlo.
- **Clasificación global** del Desafío Diario (respaldada por Vercel KV).
- **Tarjeta para compartir:** genera una imagen con tu resultado.
- **PWA instalable** en el móvil, con recordatorio del desafío diario.
- Efectos: partículas, confeti, fondo aurora animado, sonidos generados en el navegador y **calidad gráfica automática según los FPS** de tu dispositivo.

---

## 🛠️ Tecnología

- **Frontend:** JavaScript puro (Vanilla JS) + [Vite](https://vitejs.dev/)
- **Animaciones:** [GSAP](https://gsap.com/)
- **Backend:** Vercel Serverless Functions (`/api`) + **Vercel KV** (Redis) para la clasificación
- **Analítica:** Vercel Analytics
- **App móvil:** [Capacitor](https://capacitorjs.com/) (Android)
- **Sin frameworks pesados:** todo el juego vive en `src/main.js` y `src/style.css`.

---

## 🚀 Desarrollo local

Necesitas [Node.js](https://nodejs.org/).

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (recarga en caliente)
npm run dev

# Compilar para producción
npm run build

# Previsualizar la build de producción
npm run preview
```

Se despliega automáticamente en **Vercel** al hacer push a `main`.

> La clasificación global necesita una integración de **Vercel KV** configurada. Sin ella, el juego funciona igual pero la tabla de clasificación aparece como no disponible.

---

## 📁 Estructura del proyecto

```
Color-Game/
├── api/
│   └── leaderboard.js      # Clasificación del Desafío Diario (Vercel KV)
├── public/
│   ├── manifest.json       # Configuración PWA
│   ├── sw.js               # Service Worker (offline / instalable)
│   └── favicon.png
├── src/
│   ├── main.js             # Toda la lógica del juego
│   └── style.css           # Todos los estilos
├── index.html
├── capacitor.config.json   # Configuración de la app Android
└── package.json
```

---

## 📄 Licencia

Proyecto personal. Todos los derechos reservados.

---

_Hecho con ❤️ y muchos colores._
