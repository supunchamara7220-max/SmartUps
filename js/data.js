/**
 * SmartUps - Demo Data & State Store
 * Provides default state, demo accounts, device definitions, and localStorage persistence.
 */

const STORAGE_KEY = 'smartups_system_state_v1';
const AUTH_STORAGE_KEY = 'smartups_auth_user_v1';

// Default system dataset
const DEFAULT_SYSTEM_DATA = {
    // UPS Core System Stats
    ups: {
        model: "SmartUps Pro Ultra 3000VA",
        firmware: "v4.2.1-PRO",
        serialNumber: "SU-2026-98174X",
        status: "online", // "online" (grid), "battery", "bypass", "fault"
        gridVoltage: 231.4, // Volts
        gridFrequency: 50.02, // Hz
        outputVoltage: 230.0, // Volts pure sine
        batteryLevel: 94, // %
        batteryVoltage: 52.4, // Volts (48V nominal LiFePO4 bank)
        batteryHealth: 99, // %
        batteryTemp: 28.5, // °C
        batteryCycles: 42,
        batteryCapacityWh: 2400, // Watt-hours total
        maxLoadWatts: 2700, // 3000VA * 0.9 PF
        mode: "ups_priority", // "eco", "high_efficiency", "ups_priority", "peak_shaving"
        isSimulatedBlackout: false,
        soundEnabled: true,
        lastEvent: "System running normally on utility grid power."
    },

    // Smart Breakers & High-Load Switches
    switches: [
        {
            id: "sw_1",
            name: "Main Server Rack Breaker",
            room: "Server Room",
            icon: "server",
            state: true, // ON
            locked: true, // Protected against accidental toggling
            priority: "critical", // "critical", "essential", "non-essential"
            currentLoadWatts: 480,
            ratedAmps: 16,
            lastChanged: "2026-09-11 08:30"
        },
        {
            id: "sw_2",
            name: "Network & Security Hub",
            room: "Telecom Closet",
            icon: "shield-check",
            state: true,
            locked: false,
            priority: "critical",
            currentLoadWatts: 95,
            ratedAmps: 10,
            lastChanged: "2026-09-11 08:30"
        },
        {
            id: "sw_3",
            name: "Workstation Bench Power",
            room: "Control Lab",
            icon: "cpu",
            state: true,
            locked: false,
            priority: "essential",
            currentLoadWatts: 280,
            ratedAmps: 16,
            lastChanged: "2026-09-11 11:15"
        },
        {
            id: "sw_4",
            name: "Lab HVAC Climate Fan",
            room: "Control Lab",
            icon: "fan",
            state: false,
            locked: false,
            priority: "non-essential",
            currentLoadWatts: 0,
            maxWatts: 350,
            ratedAmps: 10,
            lastChanged: "2026-09-11 14:02"
        },
        {
            id: "sw_5",
            name: "Perimeter Lighting & CCTV",
            room: "Exterior",
            icon: "lightbulb",
            state: true,
            locked: false,
            priority: "essential",
            currentLoadWatts: 140,
            ratedAmps: 10,
            lastChanged: "2026-09-11 18:00"
        }
    ],

    // Smart Socket Outlets
    outlets: [
        {
            id: "sock_1",
            name: "Socket 1: TrueNAS Storage Cluster",
            room: "Server Room",
            state: true,
            priority: "critical", // Never auto-shed
            voltage: 230.1,
            currentAmps: 0.96,
            powerWatts: 220,
            dailyKwh: 4.82,
            timerMinutesRemaining: null,
            icon: "hard-drive",
            schedule: "24/7 Always ON"
        },
        {
            id: "sock_2",
            name: "Socket 2: Core Firewall & PoE Switch",
            room: "Telecom Closet",
            state: true,
            priority: "critical",
            voltage: 230.0,
            currentAmps: 0.52,
            powerWatts: 120,
            dailyKwh: 2.64,
            timerMinutesRemaining: null,
            icon: "router",
            schedule: "24/7 Always ON"
        },
        {
            id: "sock_3",
            name: "Socket 3: 3D Rapid Prototype Printer",
            room: "Fabrication Lab",
            state: true,
            priority: "non-essential", // Auto-sheds immediately upon grid failure
            voltage: 229.8,
            currentAmps: 1.17,
            powerWatts: 270,
            dailyKwh: 1.95,
            timerMinutesRemaining: 45,
            icon: "box",
            schedule: "Auto-shed on Battery"
        },
        {
            id: "sock_4",
            name: "Socket 4: Multi-Monitor Command Array",
            room: "Control Lab",
            state: true,
            priority: "essential", // Sheds at 20% battery
            voltage: 230.2,
            currentAmps: 0.65,
            powerWatts: 150,
            dailyKwh: 1.65,
            timerMinutesRemaining: null,
            icon: "monitor",
            schedule: "Shed at <20% Battery"
        },
        {
            id: "sock_5",
            name: "Socket 5: Emergency Auxiliary Charger",
            room: "Control Lab",
            state: false,
            priority: "non-essential",
            voltage: 230.0,
            currentAmps: 0.0,
            powerWatts: 0,
            dailyKwh: 0.32,
            timerMinutesRemaining: null,
            icon: "battery-charging",
            schedule: "Manual only"
        }
    ],

    // Available devices that can be discovered in the pairing wizard demo
    pairingCatalog: [
        {
            id: "pair_device_1",
            type: "switch",
            name: "Smart Switch Gen4",
            model: "SW-PRO-16A",
            mac: "3C:71:BF:84:A2:91",
            rssi: -42, // Excellent dBm
            protocol: "Wi-Fi 6 + BLE 5.3",
            firmware: "v2.1.0",
            ratedAmps: 16,
            icon: "toggle-right",
            description: "High-capacity smart relay breaker with hardware overload surge cutoff."
        },
        {
            id: "pair_device_2",
            type: "outlet",
            name: "Dual Smart Socket Module",
            model: "SOCK-DUO-230V",
            mac: "A4:C1:38:19:D5:4B",
            rssi: -58, // Good dBm
            protocol: "Zigbee 3.0 / Matter",
            firmware: "v3.0.4",
            ratedAmps: 13,
            icon: "plug",
            description: "Dual managed AC socket with per-port power metering & auto load-shedding."
        },
        {
            id: "pair_device_3",
            type: "outlet",
            name: "Smart Power Monitor Plug",
            model: "PLUG-MON-10A",
            mac: "58:8E:81:42:11:FE",
            rssi: -65,
            protocol: "Wi-Fi 2.4GHz",
            firmware: "v1.8.2",
            ratedAmps: 10,
            icon: "zap",
            description: "Ultra-compact inline smart plug with instant wattage display and power factor telemetry."
        },
        {
            id: "pair_device_4",
            type: "battery",
            name: "SmartUps Expansion Battery Pack",
            model: "BATT-EXT-48V-50AH",
            mac: "70:B3:D5:99:43:08",
            rssi: -38, // Strongest
            protocol: "CAN-Bus / BLE Bridge",
            firmware: "v1.4.0",
            ratedAmps: 60,
            icon: "layers",
            description: "2400Wh modular LiFePO4 battery pack to double backup runtime."
        }
    ],

    // Activity and system security logs
    logs: [
        { id: 1, time: "18:45:10", type: "info", text: "System self-test passed. Inverter pure sine wave verified." },
        { id: 2, time: "17:30:22", type: "success", text: "Battery float charge maintained at 100% capacity." },
        { id: 3, time: "16:15:04", type: "info", text: "Socket 1 NAS storage load steady at 220W." },
        { id: 4, time: "14:02:18", type: "warning", text: "HVAC Fan switched OFF to optimize power factor." },
        { id: 5, time: "12:00:00", type: "info", text: "Admin logged in from local console." }
    ]
};

// Demo user accounts
const DEMO_USERS = [
    {
        id: "usr_admin",
        name: "Supreme Administrator",
        email: "admin@smartups.io",
        password: "admin123",
        role: "admin", // "admin", "operator", "viewer"
        avatar: "⚡",
        title: "UPS Chief Systems Engineer",
        canPair: true,
        canConfigure: true,
        canToggle: true
    },
    {
        id: "usr_operator",
        name: "Operations Manager",
        email: "operator@smartups.io",
        password: "power456",
        role: "operator",
        avatar: "🛡️",
        title: "Facilities Power Tech",
        canPair: false,
        canConfigure: false,
        canToggle: true
    },
    {
        id: "usr_viewer",
        name: "Guest Demo User",
        email: "demo@smartups.io",
        password: "demo",
        role: "viewer",
        avatar: "👁️",
        title: "Auditor / Observer",
        canPair: false,
        canConfigure: false,
        canToggle: false
    }
];

// Helper to load or initialize system data
function getSystemData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn("Could not read localStorage, using default data.", e);
    }
    saveSystemData(DEFAULT_SYSTEM_DATA);
    return JSON.parse(JSON.stringify(DEFAULT_SYSTEM_DATA));
}

// Helper to save system data
function saveSystemData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save state to localStorage", e);
    }
}

// Helper to reset to factory defaults
function resetSystemData() {
    localStorage.removeItem(STORAGE_KEY);
    return getSystemData();
}
