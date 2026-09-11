/**
 * SmartUps - Demo Data & State Store
 * Provides default state, demo accounts, device definitions, and localStorage persistence.
 */

const STORAGE_KEY = 'smartups_system_state_v1';
const AUTH_STORAGE_KEY = 'smartups_auth_user_v1';

// Standalone Global Hardware Catalog available for discovery in pairing wizard
const PAIRING_CATALOG = [
    {
        id: "pair_device_1",
        type: "switch",
        name: "Smart Breaker Gen4 Pro",
        model: "SW-PRO-16A",
        mac: "3C:71:BF:84:A2:91",
        rssi: -42, // Strongest dBm
        protocol: "Wi-Fi 6 + BLE 5.3",
        firmware: "v2.1.0",
        ratedAmps: 16,
        icon: "toggle-right",
        description: "High-capacity smart relay breaker with hardware overload surge cutoff."
    },
    {
        id: "pair_device_2",
        type: "switch",
        name: "Industrial Circuit Breaker",
        model: "CB-IND-32A",
        mac: "44:17:93:D8:10:C3",
        rssi: -52,
        protocol: "Zigbee 3.0 / Matter",
        firmware: "v2.4.2",
        ratedAmps: 32,
        icon: "toggle-right",
        description: "Heavy-duty 32A DIN-rail breaker for HVAC, server racks and workshop machines."
    },
    {
        id: "pair_device_3",
        type: "outlet",
        name: "Dual Managed Smart Socket",
        model: "SOCK-DUO-230V",
        mac: "A4:C1:38:19:D5:4B",
        rssi: -48,
        protocol: "Zigbee 3.0 / Matter",
        firmware: "v3.0.4",
        ratedAmps: 13,
        icon: "plug",
        description: "Dual managed AC socket with per-port power metering & auto load-shedding."
    },
    {
        id: "pair_device_4",
        type: "outlet",
        name: "Smart Power Monitor Plug",
        model: "PLUG-MON-10A",
        mac: "58:8E:81:42:11:FE",
        rssi: -62,
        protocol: "Wi-Fi 2.4GHz",
        firmware: "v1.8.2",
        ratedAmps: 10,
        icon: "zap",
        description: "Ultra-compact inline smart plug with instant wattage display and power factor telemetry."
    },
    {
        id: "pair_device_5",
        type: "outlet",
        name: "Appliance Heavy Socket 16A",
        model: "SOCK-HVY-16A",
        mac: "90:35:6E:12:87:B0",
        rssi: -55,
        protocol: "Matter over Thread",
        firmware: "v1.9.0",
        ratedAmps: 16,
        icon: "plug",
        description: "Reinforced high-load outlet with thermal runaway sensor and current limiting."
    },
    {
        id: "pair_device_6",
        type: "battery",
        name: "SmartUps Modular Battery Pack",
        model: "BATT-EXT-48V-50AH",
        mac: "70:B3:D5:99:43:08",
        rssi: -38, // Strongest
        protocol: "CAN-Bus / BLE Bridge",
        firmware: "v1.4.0",
        ratedAmps: 60,
        icon: "layers",
        description: "2400Wh modular LiFePO4 battery pack to double backup runtime."
    },
    {
        id: "pair_device_7",
        type: "battery",
        name: "RackMount LiFePO4 Bank 5kWh",
        model: "BATT-RACK-48V-100AH",
        mac: "88:E2:0F:7A:B1:39",
        rssi: -45,
        protocol: "CAN-Bus / Modbus RS485",
        firmware: "v2.0.1",
        ratedAmps: 100,
        icon: "layers",
        description: "5120Wh high-density server rack battery module for extended mission-critical operations."
    }
];

if (typeof window !== 'undefined') {
    window.PAIRING_CATALOG = PAIRING_CATALOG;
}

// Default system dataset (Clean slate for all newly created accounts and users: 0 devices, 0 load)
const DEFAULT_SYSTEM_DATA = {
    // UPS Core System Stats
    ups: {
        model: "SmartUps Pro Ultra 3000VA",
        firmware: "v4.2.1-PRO",
        serialNumber: "SU-2026-98174X",
        status: "online", // "online" (grid), "battery", "bypass", "fault"
        gridVoltage: 230.0, // Volts
        gridFrequency: 50.0, // Hz
        outputVoltage: 230.0, // Volts pure sine
        batteryLevel: 100, // %
        batteryVoltage: 54.0, // Volts (48V nominal LiFePO4 bank)
        batteryHealth: 100, // %
        batteryTemp: 26.0, // °C
        batteryCycles: 12,
        batteryCapacityWh: 2400, // Watt-hours total
        maxLoadWatts: 2700, // 3000VA * 0.9 PF
        mode: "ups_priority", // "eco", "high_efficiency", "ups_priority", "peak_shaving"
        isSimulatedBlackout: false,
        soundEnabled: true,
        lastEvent: "System online. 0 active load. Ready to pair smart devices."
    },
    switches: [],
    outlets: [],
    pairingCatalog: PAIRING_CATALOG,
    logs: [
        {
            id: Date.now(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: "info",
            text: "Clean power topology initialized. 0 devices connected. Output load: 0 W."
        }
    ]
};

// Admin demo hardware cluster (available for System Administrator demo)
const ADMIN_SYSTEM_DATA = {
    ups: {
        model: "SmartUps Pro Ultra 3000VA",
        firmware: "v4.2.1-PRO",
        serialNumber: "SU-2026-98174X",
        status: "online",
        gridVoltage: 231.4,
        gridFrequency: 50.02,
        outputVoltage: 230.0,
        batteryLevel: 94,
        batteryVoltage: 52.4,
        batteryHealth: 99,
        batteryTemp: 28.5,
        batteryCycles: 42,
        batteryCapacityWh: 2400,
        maxLoadWatts: 2700,
        mode: "ups_priority",
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
    pairingCatalog: PAIRING_CATALOG,

    // Activity and system security logs
    logs: [
        { id: 1, time: "18:45:10", type: "info", text: "System self-test passed. Inverter pure sine wave verified." },
        { id: 2, time: "17:30:22", type: "success", text: "Battery float charge maintained at 100% capacity." },
        { id: 3, time: "16:15:04", type: "info", text: "Socket 1 NAS storage load steady at 220W." },
        { id: 4, time: "14:02:18", type: "warning", text: "HVAC Fan switched OFF to optimize power factor." },
        { id: 5, time: "12:00:00", type: "info", text: "Admin logged in from local console." }
    ]
};

// Demo user accounts with the 5 dedicated roles
const DEMO_USERS = [
    {
        id: "usr_engineer",
        name: "Alex Rivera",
        email: "engineer@smartups.io",
        password: "engineer123",
        role: "energy_engineer",
        avatar: "⚡",
        title: "Energy Sector Engineer",
        canPair: true,
        canConfigure: true,
        canToggle: true
    },
    {
        id: "usr_business",
        name: "Sarah Chen",
        email: "business@smartups.io",
        password: "business123",
        role: "business_owner",
        avatar: "🏢",
        title: "Small Business Owner",
        canPair: true,
        canConfigure: true,
        canToggle: true
    },
    {
        id: "usr_resident",
        name: "David Miller",
        email: "resident@smartups.io",
        password: "resident123",
        role: "household_resident",
        avatar: "🏡",
        title: "Household Resident",
        canPair: true,
        canConfigure: true,
        canToggle: true
    },
    {
        id: "usr_office",
        name: "Emma Watson",
        email: "office@smartups.io",
        password: "office123",
        role: "office_worker",
        avatar: "💼",
        title: "Office Worker",
        canPair: true,
        canConfigure: true,
        canToggle: true
    },
    {
        id: "usr_student",
        name: "Liam Patel",
        email: "student@smartups.io",
        password: "student123",
        role: "student",
        avatar: "🎓",
        title: "Engineering Student",
        canPair: true,
        canConfigure: true,
        canToggle: true
    },
    {
        id: "usr_admin",
        name: "System Administrator",
        email: "admin@smartups.io",
        password: "admin123",
        role: "energy_engineer",
        avatar: "⚡",
        title: "Energy Sector Engineer (Admin)",
        canPair: true,
        canConfigure: true,
        canToggle: true
    }
];

// Helper to load or initialize system data (per-user storage)
function getSystemData(user) {
    const activeUser = user || (window.smartUpsAuth ? window.smartUpsAuth.getCurrentUser() : null);
    const userId = activeUser ? activeUser.id : 'guest';
    const isAdmin = activeUser ? (activeUser.id === 'usr_admin' || activeUser.role === 'admin') : false;
    const userStorageKey = `${STORAGE_KEY}_${userId}`;

    try {
        const stored = localStorage.getItem(userStorageKey);
        if (stored) {
            const parsed = JSON.parse(stored);
            // If user is non-admin and still has pre-assigned demo devices (e.g. sw_1 from previous version), purge them immediately!
            if (!isAdmin && parsed && parsed.switches && parsed.switches.some(s => s.id === 'sw_1')) {
                parsed.switches = [];
                parsed.outlets = [];
                saveSystemData(parsed, userId);
            }
            return parsed;
        }
    } catch (e) {
        console.warn("Could not read user state from localStorage", e);
    }

    // Initialize fresh system data:
    // Admin gets the full demo hardware cluster, everyone else gets 0 devices!
    const data = isAdmin ? JSON.parse(JSON.stringify(ADMIN_SYSTEM_DATA)) : JSON.parse(JSON.stringify(DEFAULT_SYSTEM_DATA));

    if (!isAdmin) {
        data.switches = [];
        data.outlets = [];
        data.logs = [
            {
                id: Date.now(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                type: "info",
                text: `Welcome, ${activeUser ? activeUser.name : 'User'}! 0 pre-assigned devices. Output load: 0 W. Estimated runtime: 0m. Use "+ Pair New Device" to pair hardware.`
            }
        ];
    }

    saveSystemData(data, userId);
    return data;
}

// Helper to save system data
function saveSystemData(data, userId) {
    const activeUser = window.smartUpsAuth ? window.smartUpsAuth.getCurrentUser() : null;
    const id = userId || (activeUser ? activeUser.id : 'guest');
    const userStorageKey = `${STORAGE_KEY}_${id}`;
    try {
        localStorage.setItem(userStorageKey, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save state to localStorage", e);
    }
}

// Helper to reset to factory defaults
function resetSystemData(user) {
    const activeUser = user || (window.smartUpsAuth ? window.smartUpsAuth.getCurrentUser() : null);
    const id = activeUser ? activeUser.id : 'guest';
    localStorage.removeItem(`${STORAGE_KEY}_${id}`);
    return getSystemData(activeUser);
}
