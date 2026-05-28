# 🎮 TIE Fighter - Game Design & Feature Backlog

*Detta dokument är skapat av Design-agenten och är tänkt som en kravspecifikation och backlogg för Utvecklar-agenten.*

---

## 🛑 Aktuellt Problem med Spelet
Just nu är spelet ett "Time-Attack" mot statiska containrar. Spelaren kan byta hastighet och skjuta, men:
1. **Det finns inget hot:** TIE fightern kan in ta skada och förlorar aldrig.
2. **Känslan av hastighet / Star Wars-magi.** Saknar "juice" (ljuseffekter, kameraskak).

Här är de prioriterade uppgifterna för utvecklaren för att göra detta till ett riktigt spel.

---

## 🛠️ Fas 1: The Threat & The Juice (✅ KLAR)
*(Utvecklar-agenten har framgångsrikt implementerat Bloom, Kameraskak och Asteroider!)*

---

## 🛸 Fas 2: Levande Värld 

När Fas 1 är klar, blir nästa steg att sluta skjuta på papperskorgar.

- [ ] **1. Rörliga Mål**
  - *Designmål:* Containrarna ska inte vara helt stilla.
  - *Utvecklar-notering:* Lägg till en enkel drift (Vector3) på måltavlorna så de sakta rör sig i sidled eller roterar.

- [ ] **2. Fartränder (Speed Particles)**
  - *Designmål:* När spelaren lägger i högsta växeln (Speed 3) måste det kännas i magen.
  - *Utvecklar-notering:* Strecha ut `trailParticles` över Z-axeln när hastigheten är hög för att simulera stjärnor/rymdstoft som viner förbi cockpiten (Tänk "Warp speed").

---

## 🖥️ Fas 3: Omskriven Spelmekanik & Mitten-Cenrerad HUD (NY!)

Detta är nästa stora iteration av spelkänslan. Vi skiftar från osynliga siffervärden till tydliga begränsningar.

- [ ] **1. Nya Hastighetsnivåer (Speed 1, 2, 3)**
  - *Designmål:* Spelaren ska känna en extrem skillnad mellan nivåerna. Hastighet 3 ska upplevas som livsfarlig i asteroidbältet!
  - *Utvecklar-notering:* 
    - Uppdatera `GameConfig.SPEED_LEVELS` (i `Constants.js` eller var de nu bor).
    - Hastigheterna ska i koden vara `[6, 13, 20]`. 
    - Spelet MÅSTE starta på index 1 (dvs Hastighet 2, med värdet 13). 
    - I det visuella UI:t ska användaren bara se texten "Speed Level: 1", "2" eller "3". Konvertera index+1 till UI-visning.

- [ ] **2. Lasersystem: Överhettning & Cooldown**
  - *Designmål:* Spelaren får inte längre "Spamma" skjut-knappen.
  - *Utvecklar-notering:*
    - Skapa en ny variabel `laserHeat = 0` (max 100). Varje skott ökar värmen med t.ex. 15.
    - Om `laserHeat >= 100` "jammar" vapnet (stängs av temporärt).
    - Väntetid: `laserCooldownTimer`. Om spelaren inte skjutit på **1 sekund**, börja sänka `laserHeat` snabbt ner mot 0 igen.

- [ ] **3. UI: Balanserad HUD (Halv-Diegetisk)**
  - *Designmål:* Spelaren ska INTE behöva titta bort i kanterna ("HUD-vandring") när farten är över 20!
  - *Utvecklar-notering:*
    - Skapa ett nytt centrerat CSS-element som lägger sig transparent i en cirkel/båge eller två staplar **precis till vänster och höger om siktet / TIE Fightern**.
    - **Vänstra elementet (Hastighet):** Tre tydliga staplar eller punkter som tänds för att visa Speed 1, 2, och 3.
    - **Högra elementet (Värme):** En vertikal stapel som fylls på när man skjuter.
    - *Färgkodning:* Värmestapeln måste gå från **Grön** -> **Gul/Guld** -> **Röd** (via CSS `linear-gradient` och `height` justering från JS, eller en övergång i färg beroende på procent). 
    - Gärna "Neon / Sci-fi Glow" (CSS `box-shadow`) så att den smälter ihop med resten av den snygga AD-visionen.

---

## ⚙️ Arkitektoniska Riktlinjer för Utvecklar-agenten
* Eftersom projektet precis flyttats till en ny `src/`-struktur: Bibehåll modulariteten.
* Om spelet börjar lagga: Använd **Object Pooling** (återanvänd instanser) istället för att skapa nya Three.js-objekt och Material i minnet.
