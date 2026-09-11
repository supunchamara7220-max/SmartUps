/**
 * SmartUps - Telemetry Engine, Audio Effects & Control System
 * Manages real-time simulation, relay audio, load shedding, and blackout simulator.
 */

class SmartUpsEngine {
    constructor() {
        this.data = getSystemData();
        this.ensureSwitchIntegrity();
        this.audioCtx = null;
        this.listeners = [];
        this.timerInterval = null;

        this.initAudio();
        this.startSimulationLoop();

        // Listen for user login/logout to switch user device storage immediately
        window.addEventListener('smartups:auth-changed', (e) => {
            this.data = getSystemData(e.detail ? e.detail.user : null);
            this.ensureSwitchIntegrity();
            this.notifyUpdate();
        });
    }

    ensureSwitchIntegrity() {
        if (this.data && this.data.switches && Array.isArray(this.data.switches)) {
            this.data.switches.forEach(sw => {
                if (typeof ensureSwitchSections === 'function') {
                    ensureSwitchSections(sw);
                }
            });
        }
    }

    // Web Audio API Relay & Alert Synthesizer (no external audio files needed)
    initAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        } catch (e) {
            console.warn("Web Audio not supported", e);
        }
    }

    resumeAudio() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    playRelaySound(turnOn = true) {
        if (!this.data.ups.soundEnabled) return;
        this.resumeAudio();
        if (!this.audioCtx) return;

        try {
            const now = this.audioCtx.currentTime;
            // Primary relay mechanical click
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = turnOn ? 'triangle' : 'square';
            osc.frequency.setValueAtTime(turnOn ? 320 : 180, now);
            osc.frequency.exponentialRampToValueAtTime(turnOn ? 80 : 50, now + 0.04);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.05);

            // Secondary metallic snap
            setTimeout(() => {
                if (!this.audioCtx) return;
                const snapNow = this.audioCtx.currentTime;
                const snapOsc = this.audioCtx.createOscillator();
                const snapGain = this.audioCtx.createGain();
                snapOsc.type = 'sine';
                snapOsc.frequency.setValueAtTime(800, snapNow);
                snapOsc.frequency.exponentialRampToValueAtTime(200, snapNow + 0.03);
                snapGain.gain.setValueAtTime(0.15, snapNow);
                snapGain.gain.exponentialRampToValueAtTime(0.001, snapNow + 0.03);
                snapOsc.connect(snapGain);
                snapGain.connect(this.audioCtx.destination);
                snapOsc.start(snapNow);
                snapOsc.stop(snapNow + 0.03);
            }, 12);
        } catch (e) {
            // Audio fail-safe
        }
    }

    playBeep(frequency = 880, duration = 0.15, count = 1) {
        if (!this.data.ups.soundEnabled) return;
        this.resumeAudio();
        if (!this.audioCtx) return;

        try {
            for (let i = 0; i < count; i++) {
                const now = this.audioCtx.currentTime + (i * (duration + 0.08));
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(frequency, now);

                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.start(now);
                osc.stop(now + duration);
            }
        } catch (e) {
            // Audio fail-safe
        }
    }

    playChime() {
        if (!this.data.ups.soundEnabled) return;
        this.resumeAudio();
        if (!this.audioCtx) return;

        try {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const now = this.audioCtx.currentTime + (idx * 0.09);
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.start(now);
                osc.stop(now + 0.28);
            });
        } catch (e) {
            // Audio fail-safe
        }
    }

    // Telemetry & Load Calculations
    calculateTotalLoad() {
        let switchWatts = 0;
        let outletWatts = 0;

        if (this.data.switches && Array.isArray(this.data.switches)) {
            this.data.switches.forEach(sw => {
                if (sw.state) {
                    switchWatts += (sw.currentLoadWatts || 0);
                }
            });
        }

        if (this.data.outlets && Array.isArray(this.data.outlets)) {
            this.data.outlets.forEach(sock => {
                if (sock.state) {
                    outletWatts += (sock.powerWatts || 0);
                }
            });
        }

        const totalWatts = Math.round(switchWatts + outletWatts);
        const percentCapacity = totalWatts > 0 ? Math.min(100, Math.round((totalWatts / this.data.ups.maxLoadWatts) * 100)) : 0;
        const totalAmps = totalWatts > 0 ? parseFloat((totalWatts / (this.data.ups.outputVoltage || 230)).toFixed(2)) : 0.0;

        return {
            switchWatts,
            outletWatts,
            totalWatts,
            percentCapacity,
            totalAmps
        };
    }

    calculateRuntimeMinutes() {
        const { totalWatts } = this.calculateTotalLoad();
        // When output load is zero, estimated runtime must be zero
        if (totalWatts <= 0) return 0;

        // Effective usable Watt-hours with 88% inverter efficiency
        const usableWh = this.data.ups.batteryCapacityWh * (this.data.ups.batteryLevel / 100) * 0.88;
        const runtimeHours = usableWh / totalWatts;
        return Math.max(1, Math.round(runtimeHours * 60));
    }

    // Start 1-second simulation loop
    startSimulationLoop() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            this.tick();
        }, 1000);
    }

    tick() {
        const isBlackout = this.data.ups.isSimulatedBlackout;

        if (isBlackout) {
            // Grid is down: running on battery inverter
            this.data.ups.status = "battery";
            this.data.ups.gridVoltage = 0.0;
            this.data.ups.gridFrequency = 0.0;
            this.data.ups.outputVoltage = 230.0 + (Math.random() * 0.6 - 0.3);

            // Battery drain proportional to load
            const { totalWatts } = this.calculateTotalLoad();
            const drainRate = Math.max(0.04, (totalWatts / this.data.ups.batteryCapacityWh) * 0.25);
            this.data.ups.batteryLevel = Math.max(0, parseFloat((this.data.ups.batteryLevel - drainRate).toFixed(2)));

            // Battery voltage curve (54V full down to 42V empty)
            this.data.ups.batteryVoltage = parseFloat((42.0 + (12.0 * (this.data.ups.batteryLevel / 100))).toFixed(1));

            // Auto load shedding at critical battery levels
            if (this.data.ups.batteryLevel <= 25) {
                this.performEmergencyLoadShedding();
            }

            // Low battery audible warning
            if (this.data.ups.batteryLevel <= 15 && Math.floor(Date.now() / 1000) % 5 === 0) {
                this.playBeep(950, 0.2, 2);
            }
        } else {
            // Normal Grid Mode
            this.data.ups.status = "online";
            // Realistic AC fluctuations
            this.data.ups.gridVoltage = parseFloat((230.0 + (Math.sin(Date.now() / 2500) * 2.4) + (Math.random() * 0.6)).toFixed(1));
            this.data.ups.gridFrequency = parseFloat((50.0 + (Math.sin(Date.now() / 3800) * 0.05)).toFixed(2));
            this.data.ups.outputVoltage = 230.0;

            // Slow float charging if battery not full
            if (this.data.ups.batteryLevel < 100) {
                this.data.ups.batteryLevel = Math.min(100, parseFloat((this.data.ups.batteryLevel + 0.15).toFixed(2)));
                this.data.ups.batteryVoltage = parseFloat((42.0 + (12.0 * (this.data.ups.batteryLevel / 100))).toFixed(1));
            }
        }

        // Check countdown timers on outlets
        this.data.outlets.forEach(outlet => {
            if (outlet.state && outlet.timerMinutesRemaining !== null && outlet.timerMinutesRemaining > 0) {
                // Reduce timer every minute or fraction
                outlet.timerMinutesRemaining = Math.max(0, outlet.timerMinutesRemaining - 0.016);
                if (outlet.timerMinutesRemaining <= 0) {
                    outlet.state = false;
                    outlet.timerMinutesRemaining = null;
                    this.playRelaySound(false);
                    this.logEvent("warning", `${outlet.name} countdown timer expired - Power cut.`);
                }
            }
        });

        // Micro-fluctuations on active outlet wattages
        this.data.outlets.forEach(outlet => {
            if (outlet.state && outlet.powerWatts > 0) {
                const jitter = (Math.random() * 4 - 2);
                outlet.voltage = this.data.ups.outputVoltage;
                outlet.currentAmps = parseFloat((outlet.powerWatts / outlet.voltage).toFixed(2));
                outlet.dailyKwh = parseFloat((outlet.dailyKwh + 0.00002).toFixed(3));
            }
        });

        saveSystemData(this.data);
        this.notifyUpdate();
    }

    // Emergency Load Shedding
    performEmergencyLoadShedding() {
        let shedCount = 0;
        this.data.outlets.forEach(sock => {
            if (sock.state && sock.priority !== "critical") {
                sock.state = false;
                shedCount++;
            }
        });

        this.data.switches.forEach(sw => {
            if (sw.state && sw.priority === "non-essential") {
                sw.state = false;
                shedCount++;
            }
        });

        if (shedCount > 0) {
            this.playBeep(440, 0.3, 1);
            this.logEvent("warning", `EMERGENCY LOAD SHED: ${shedCount} non-critical circuits cut to protect UPS battery reserve.`);
        }
    }

    // Toggle Smart Switch (Master Toggle across all sections)
    toggleSwitch(switchId) {
        if (!window.smartUpsAuth.canToggle()) {
            return { success: false, message: "Permission Denied: Viewer role cannot operate circuit breakers." };
        }

        const sw = this.data.switches.find(s => s.id === switchId);
        if (!sw) return { success: false, message: "Switch not found." };

        if (sw.locked && !window.smartUpsAuth.isAdmin()) {
            return { success: false, message: `Switch [${sw.name}] is physically locked. Administrator authentication required to toggle.` };
        }

        if (typeof ensureSwitchSections === 'function') {
            ensureSwitchSections(sw);
        }

        sw.state = !sw.state;
        sw.lastChanged = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Synchronize all sub-sections with master state
        if (sw.sections && Array.isArray(sw.sections)) {
            sw.sections.forEach(sec => {
                sec.state = sw.state;
                if (!sw.state) {
                    sec.savedWatts = sec.watts || 45;
                    sec.watts = 0;
                } else {
                    sec.watts = sec.savedWatts || Math.floor(Math.random() * 35 + 35);
                }
            });
            sw.currentLoadWatts = sw.sections.reduce((acc, s) => acc + (s.state ? (s.watts || 0) : 0), 0);
        }

        this.playRelaySound(sw.state);
        this.logEvent("info", `Smart Switch [${sw.name}] turned ${sw.state ? 'ON' : 'OFF'} by ${window.smartUpsAuth.getCurrentUser().name}.`);
        saveSystemData(this.data);
        this.notifyUpdate();
        return { success: true, state: sw.state, name: sw.name };
    }

    // Toggle Individual Sub-Channel Section (1, 2, 3, 4)
    toggleSwitchSection(switchId, sectionId) {
        if (!window.smartUpsAuth.canToggle()) {
            return { success: false, message: "Permission Denied: Viewer role cannot operate circuit breakers." };
        }

        const sw = this.data.switches.find(s => s.id === switchId);
        if (!sw) return { success: false, message: "Switch not found." };

        if (sw.locked && !window.smartUpsAuth.isAdmin()) {
            return { success: false, message: `Switch [${sw.name}] is physically locked.` };
        }

        if (typeof ensureSwitchSections === 'function') {
            ensureSwitchSections(sw);
        }

        const sec = sw.sections.find(s => s.id === sectionId);
        if (!sec) return { success: false, message: "Section not found." };

        sec.state = !sec.state;
        if (!sec.state) {
            sec.savedWatts = sec.watts || 45;
            sec.watts = 0;
        } else {
            sec.watts = sec.savedWatts || Math.floor(Math.random() * 35 + 35);
        }

        // Recalculate switch total load and master state
        sw.currentLoadWatts = sw.sections.reduce((acc, s) => acc + (s.state ? (s.watts || 0) : 0), 0);
        sw.state = sw.sections.some(s => s.state);
        sw.lastChanged = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        this.playRelaySound(sec.state);
        this.logEvent("info", `[${sw.name}] Section ${sec.id} (${sec.label}) turned ${sec.state ? 'ON' : 'OFF'}.`);
        saveSystemData(this.data);
        this.notifyUpdate();
        return { success: true, state: sec.state, switchState: sw.state };
    }

    // Add another section (channel) to a switch (up to 4)
    addSwitchSection(switchId, label) {
        if (window.smartUpsAuth && typeof window.smartUpsAuth.canConfigure === 'function' && !window.smartUpsAuth.canConfigure()) {
            return { success: false, message: "Permission Denied: Configuration role required." };
        }

        const sw = this.data.switches.find(s => s.id === switchId);
        if (!sw) return { success: false, message: "Switch not found." };

        if (typeof ensureSwitchSections === 'function') {
            ensureSwitchSections(sw);
        }

        if (sw.sections.length >= 4) {
            return { success: false, message: "Maximum 4 sections allowed per smart switch." };
        }

        const nextId = sw.sections.length + 1;
        const defaultLabel = nextId === 1 ? "Default Section" : `Section ${nextId}`;
        const secLabel = (label && label.trim()) || defaultLabel;
        const newSecWatts = Math.floor(Math.random() * 35 + 35);

        sw.sections.push({
            id: nextId,
            label: secLabel,
            state: true,
            watts: newSecWatts
        });

        sw.currentLoadWatts = sw.sections.reduce((acc, s) => acc + (s.state ? (s.watts || 0) : 0), 0);
        sw.state = true;

        this.playBeep(880, 0.1);
        this.logEvent("success", `Added Section ${nextId} (${secLabel}) to [${sw.name}].`);
        saveSystemData(this.data);
        this.notifyUpdate();
        return { success: true, sectionId: nextId };
    }

    // Rename Section Label
    renameSwitchSection(switchId, sectionId, newLabel) {
        const sw = this.data.switches.find(s => s.id === switchId);
        if (!sw || !sw.sections) return { success: false };

        const sec = sw.sections.find(s => s.id === sectionId);
        if (!sec) return { success: false };

        sec.label = newLabel.trim();
        this.logEvent("info", `[${sw.name}] Section ${sec.id} renamed to "${sec.label}".`);
        saveSystemData(this.data);
        this.notifyUpdate();
        return { success: true };
    }

    // Toggle Smart Socket Outlet
    toggleOutlet(outletId) {
        if (!window.smartUpsAuth.canToggle()) {
            return { success: false, message: "Permission Denied: Viewer role cannot control socket outlets." };
        }

        const sock = this.data.outlets.find(s => s.id === outletId);
        if (!sock) return { success: false, message: "Socket not found." };

        sock.state = !sock.state;
        if (!sock.state) {
            sock.timerMinutesRemaining = null;
        }
        this.playRelaySound(sock.state);

        this.logEvent("info", `Socket [${sock.name}] turned ${sock.state ? 'ACTIVE' : 'CUT OFF'} by ${window.smartUpsAuth.getCurrentUser().name}.`);
        saveSystemData(this.data);
        this.notifyUpdate();
        return { success: true, state: sock.state, name: sock.name };
    }

    // Set Switch Lock (Admin only)
    toggleSwitchLock(switchId) {
        if (!window.smartUpsAuth.isAdmin()) {
            return { success: false, message: "Admin access required to toggle safety lock." };
        }
        const sw = this.data.switches.find(s => s.id === switchId);
        if (!sw) return { success: false, message: "Switch not found." };

        sw.locked = !sw.locked;
        this.playBeep(600, 0.08);
        this.logEvent("info", `Safety lock on [${sw.name}] ${sw.locked ? 'ENGAGED' : 'RELEASED'}.`);
        saveSystemData(this.data);
        this.notifyUpdate();
        return { success: true, locked: sw.locked };
    }

    // Blackout Simulator Toggle
    setBlackoutSimulation(enable) {
        this.data.ups.isSimulatedBlackout = enable;
        if (enable) {
            this.playBeep(520, 0.25, 3);
            this.logEvent("warning", "SIMULATION: Utility Grid Power Cut! Smart UPS switched to Battery Inverter Mode.");

            // Immediately auto-shed non-essential loads
            this.data.outlets.forEach(s => {
                if (s.priority === "non-essential" && s.state) {
                    s.state = false;
                    this.logEvent("info", `Auto-shed: Cut power to non-essential outlet [${s.name}].`);
                }
            });
        } else {
            this.playChime();
            this.logEvent("success", "SIMULATION: Utility Grid Power Restored. Inverter synchronized and battery charging.");
        }
        saveSystemData(this.data);
        this.notifyUpdate();
    }

    // Set UPS Operating Mode
    setUpsMode(mode) {
        if (!window.smartUpsAuth.isAdmin()) {
            return { success: false, message: "Admin access required to change UPS operational topology." };
        }
        this.data.ups.mode = mode;
        this.playBeep(700, 0.1);
        this.logEvent("info", `UPS mode changed to ${mode.toUpperCase().replace('_', ' ')}.`);
        saveSystemData(this.data);
        this.notifyUpdate();
        return { success: true };
    }

    // Sound effects toggle
    toggleSound() {
        this.data.ups.soundEnabled = !this.data.ups.soundEnabled;
        if (this.data.ups.soundEnabled) {
            this.playBeep(880, 0.1);
        }
        saveSystemData(this.data);
        this.notifyUpdate();
        return this.data.ups.soundEnabled;
    }

    // Bulk control
    setAllSwitches(state) {
        if (!window.smartUpsAuth.canToggle()) {
            return { success: false, message: "Permission Denied." };
        }
        this.data.switches.forEach(sw => {
            if (!sw.locked) sw.state = state;
        });
        this.playRelaySound(state);
        this.logEvent("info", `Master switch command: All unlocked switches turned ${state ? 'ON' : 'OFF'}.`);
        saveSystemData(this.data);
        this.notifyUpdate();
    }

    setAllOutlets(state) {
        if (!window.smartUpsAuth.canToggle()) {
            return { success: false, message: "Permission Denied." };
        }
        this.data.outlets.forEach(sock => {
            sock.state = state;
        });
        this.playRelaySound(state);
        this.logEvent("info", `Master socket command: All socket outlets turned ${state ? 'ACTIVE' : 'OFF'}.`);
        saveSystemData(this.data);
        this.notifyUpdate();
    }

    // Add newly paired device
    addPairedDevice(deviceConfig) {
        if (deviceConfig.type === 'switch') {
            let sections = [];
            if (deviceConfig.sections && Array.isArray(deviceConfig.sections) && deviceConfig.sections.length > 0) {
                sections = deviceConfig.sections.map((sec, idx) => ({
                    id: idx + 1,
                    label: (sec.label && sec.label.trim()) || (idx === 0 ? "Default Section" : `Section ${idx + 1}`),
                    state: deviceConfig.initialState !== false,
                    watts: sec.watts || Math.floor(Math.random() * 35 + 35)
                }));
            } else {
                const count = parseInt(deviceConfig.sectionCount, 10) || 1;
                for (let i = 1; i <= count; i++) {
                    sections.push({
                        id: i,
                        label: i === 1 ? "Default Section" : `Section ${i}`,
                        state: deviceConfig.initialState !== false,
                        watts: Math.floor(Math.random() * 35 + 35)
                    });
                }
            }

            const initialLoad = deviceConfig.initialState !== false
                ? sections.reduce((acc, s) => acc + (s.state ? (s.watts || 0) : 0), 0)
                : 0;

            const newSwitch = {
                id: "sw_" + Date.now().toString(36),
                name: deviceConfig.name || "Smart Switch Pro",
                room: deviceConfig.room || "Main Hub",
                icon: "toggle-right",
                state: deviceConfig.initialState !== false,
                locked: false,
                priority: deviceConfig.priority || "essential",
                currentLoadWatts: initialLoad,
                ratedAmps: deviceConfig.ratedAmps || 16,
                lastChanged: "Just now",
                isNewlyPaired: true,
                sections: sections
            };
            this.data.switches.unshift(newSwitch);
            this.logEvent("success", `Newly paired device [${newSwitch.name}] with ${sections.length} section(s) enrolled in ${newSwitch.room}.`);
        } else if (deviceConfig.type === 'outlet') {
            const newOutlet = {
                id: "sock_" + Date.now().toString(36),
                name: deviceConfig.name || "Smart Socket Outlet",
                room: deviceConfig.room || "Main Hub",
                state: deviceConfig.initialState !== false,
                priority: deviceConfig.priority || "essential",
                voltage: 230.0,
                currentAmps: 0.8,
                powerWatts: Math.floor(Math.random() * 180 + 50),
                dailyKwh: 0.05,
                timerMinutesRemaining: null,
                icon: "plug",
                schedule: "Standard On-Demand",
                isNewlyPaired: true
            };
            this.data.outlets.unshift(newOutlet);
            this.logEvent("success", `Newly paired socket [${newOutlet.name}] enrolled in ${newOutlet.room}.`);
        } else if (deviceConfig.type === 'battery') {
            this.data.ups.batteryCapacityWh += 2400;
            this.data.ups.batteryHealth = 100;
            this.logEvent("success", `Expansion Battery Pack integrated! Total energy capacity boosted to ${this.data.ups.batteryCapacityWh}Wh.`);
        }

        this.playChime();
        saveSystemData(this.data);
        this.notifyUpdate();
    }

    // Delete a device from user's account
    deleteDevice(type, id) {
        if (type === 'switch') {
            this.data.switches = this.data.switches.filter(s => s.id !== id);
        } else if (type === 'outlet') {
            this.data.outlets = this.data.outlets.filter(s => s.id !== id);
        }
        this.playBeep(350, 0.1);
        this.logEvent("warning", `Device removed from active UPS topology.`);
        saveSystemData(this.data);
        this.notifyUpdate();
        return { success: true };
    }

    // Add log entry
    logEvent(type, text) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.data.logs.unshift({
            id: Date.now(),
            time,
            type, // "info", "success", "warning", "danger"
            text
        });
        if (this.data.logs.length > 25) {
            this.data.logs.pop();
        }
        this.data.ups.lastEvent = text;
    }

    // Subscription system for UI updates
    onUpdate(callback) {
        this.listeners.push(callback);
    }

    notifyUpdate() {
        this.listeners.forEach(cb => {
            try {
                cb(this.data);
            } catch (e) {
                console.error("Error in update listener", e);
            }
        });
    }
}

// Global singleton instance
window.smartUpsEngine = new SmartUpsEngine();
