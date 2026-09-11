# ⚡ SmartUps Pro - Intelligent Power & Device Management Web Application

A modernized, high-performance Smart Uninterruptible Power Supply (UPS) control center built for **Netlify** hosting with full demo telemetry, smart switch and socket controls, interactive 4-step device pairing wizard, and functioning authentication system.

---

## 🌟 Key Features

1. **Functioning Authentication System (`js/auth.js`)**:
   - **Admin Profile**: `admin@smartups.io` / `admin123` (Hardware commissioning, lock overrides, master bypass)
   - **Operator Profile**: `operator@smartups.io` / `power456` (Switch/socket control, timers)
   - **Guest Profile**: `demo@smartups.io` / `demo` (Read-only observation)
   - Custom user registration and session persistence in `localStorage`.

2. **Smart Switches & Circuit Breakers (`js/ups.js`)**:
   - Managed relays with live load wattage and safety lock protection.
   - Master "All Switches ON" and "All Switches OFF" commands.
   - Realistic relay sound effects synthesized via the Web Audio API.

3. **Smart Socket Outlets & Auto Load Shedding**:
   - Per-outlet telemetry: Real-time Watts, Amps, Volts, and cumulative kWh.
   - **Load Shedding Priorities**:
     - `Critical`: Never sheds (e.g. NAS storage, core router).
     - `Essential`: Sheds when battery falls below 20%.
     - `Non-Essential`: Automatically sheds immediately upon grid failure to maximize runtime.
   - Configurable auto-off countdown timers.

4. **Interactive 4-Step Device Pairing Wizard Demo (`js/pairing.js`)**:
   - **Step 1: Hardware Class Selection**: Smart Breakers, Dual Socket Outlets, In-line Plugs, Battery Expansion Packs.
   - **Step 2: Sonar/Radar Scan**: Animated circular radar sweep discovering nearby BLE and Wi-Fi mesh nodes with live signal strength (RSSI dBm) and MAC addresses.
   - **Step 3: Secure Handshake**: Animated cryptographic key exchange and telemetry channel sync.
   - **Step 4: Device Configuration**: Customize label, assign room (Server Room, Lab, Office), and select priority tier.
   - Newly paired devices are dynamically added to the active dashboard controls!

5. **Live UPS Telemetry & Blackout Simulator**:
   - Interactive SVG power flow diagram showing real-time animated electric current between Grid, Battery, Inverter, and Outlets.
   - Live 1-second pulse telemetry graph using Chart.js.
   - **1-Click Power Outage Simulator**: Cuts utility mains, engages inverter battery mode, calculates real-time runtime decay, auto-sheds non-essential sockets, and triggers alarms.

---

## 🚀 How to Host on Netlify

### Method 1: Netlify Drop (Fastest - 30 Seconds)
1. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop the `SmartUps` folder into the Netlify upload area.
3. Your site will instantly be deployed with a live HTTPS URL!

### Method 2: Git Continuous Deployment (Connected to GitHub)
1. Push this project to your repository `https://github.com/supunchamara7220-max/SmartUps.git` (see GitHub guide below).
2. Log in to [Netlify](https://app.netlify.com).
3. Click **Add new site** > **Import an existing project** > **GitHub**.
4. Select `SmartUps`.
5. Netlify will detect `netlify.toml` automatically:
   - **Build command**: *(Leave blank)*
   - **Publish directory**: `.`
6. Click **Deploy site**!

---

## 💻 Running Locally

### Option 1: 1-Click Launch (Windows)
Double-click `start.bat`. It will start the local HTTP server and open `http://localhost:3000` in your browser.

### Option 2: Command Line
```bash
node server.js
```
Then visit [http://localhost:3000](http://localhost:3000).

---

## 📦 Pushing to GitHub

To push this codebase to `https://github.com/supunchamara7220-max/SmartUps.git`:

```bash
git init
git remote add origin https://github.com/supunchamara7220-max/SmartUps.git
git add .
git commit -m "Initial release of modernized SmartUps web application with pairing demo"
git branch -M main
git push -u origin main
```

*(Alternatively, you can upload the files directly using GitHub's web interface at https://github.com/supunchamara7220-max/SmartUps).*
