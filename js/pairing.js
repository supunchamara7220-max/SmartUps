/**
 * SmartUps - Interactive Device Pairing Wizard Demo
 * Provides a 4-step guided workflow: Device Selection -> Sonar/Radar Scan -> Secure Handshake -> Room & Priority Config.
 */

class PairingManager {
    constructor() {
        this.currentStep = 1;
        this.selectedDeviceType = null;
        this.selectedCatalogItem = null;
        this.isScanning = false;
        this.scanTimer = null;
        this.discoveredDevices = [];
        this.handshakeInterval = null;

        this.initElements();
        this.bindEvents();
    }

    initElements() {
        this.modal = document.getElementById('pairingModal');
        this.stepContainers = [
            document.getElementById('pairStep1'),
            document.getElementById('pairStep2'),
            document.getElementById('pairStep3'),
            document.getElementById('pairStep4')
        ];
        this.stepperDots = document.querySelectorAll('.stepper-dot');
    }

    bindEvents() {
        const pairBtn = document.getElementById('btnOpenPairing');
        if (pairBtn) {
            pairBtn.addEventListener('click', () => this.open());
        }

        const closeBtn = document.getElementById('btnClosePairing');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Device Type selection cards in Step 1
        document.querySelectorAll('.device-type-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const type = card.dataset.type;
                this.selectDeviceType(type);
            });
        });

        // Step 4 Form submit
        const configForm = document.getElementById('pairingConfigForm');
        if (configForm) {
            configForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.finalizePairing();
            });
        }
    }

    open() {
        if (!window.smartUpsAuth.isAuthenticated()) {
            window.showToast("Please sign in to enroll and pair smart hardware.", "warning");
            return;
        }

        this.currentStep = 1;
        this.selectedDeviceType = null;
        this.selectedCatalogItem = null;
        this.discoveredDevices = [];
        this.renderStep(1);
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
    }

    openForType(type) {
        this.open();
        if (type) {
            this.selectDeviceType(type);
        }
    }

    close() {
        if (this.scanTimer) clearTimeout(this.scanTimer);
        if (this.handshakeInterval) clearInterval(this.handshakeInterval);
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
    }

    renderStep(step) {
        this.currentStep = step;

        this.stepContainers.forEach((container, idx) => {
            if (container) {
                if (idx + 1 === step) {
                    container.classList.remove('hidden');
                } else {
                    container.classList.add('hidden');
                }
            }
        });

        // Update stepper dots & lines
        this.stepperDots.forEach((dot, idx) => {
            const stepNum = idx + 1;
            if (stepNum < step) {
                dot.classList.remove('bg-gray-700', 'text-gray-400', 'border-gray-600', 'ring-2', 'ring-cyan-500');
                dot.classList.add('bg-emerald-500', 'text-black', 'border-emerald-400');
                dot.innerHTML = '✓';
            } else if (stepNum === step) {
                dot.classList.remove('bg-gray-700', 'text-gray-400', 'border-gray-600', 'bg-emerald-500', 'text-black');
                dot.classList.add('bg-cyan-500', 'text-black', 'border-cyan-400', 'ring-4', 'ring-cyan-500/30');
                dot.innerHTML = stepNum;
            } else {
                dot.classList.remove('bg-emerald-500', 'bg-cyan-500', 'text-black', 'ring-4', 'ring-cyan-500/30');
                dot.classList.add('bg-gray-800', 'text-gray-400', 'border-gray-700');
                dot.innerHTML = stepNum;
            }
        });
    }

    selectDeviceType(type) {
        this.selectedDeviceType = type;
        this.renderStep(2);
        this.startDiscoveryScan();
    }

    startDiscoveryScan() {
        this.isScanning = true;
        this.discoveredDevices = [];
        const resultsContainer = document.getElementById('discoveredDevicesList');
        const scanningText = document.getElementById('scanStatusText');
        const radarElement = document.getElementById('radarSweeper');

        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
        if (scanningText) {
            scanningText.textContent = "Sweeping Bluetooth LE & 2.4GHz SmartUps Mesh for uncommissioned nodes...";
        }
        if (radarElement) {
            radarElement.classList.add('animate-radar-sweep');
        }

        // Available devices matching or all
        const catalog = DEFAULT_SYSTEM_DATA.pairingCatalog.filter(d =>
            !this.selectedDeviceType || this.selectedDeviceType === 'all' || d.type === this.selectedDeviceType
        );

        let discoveredIndex = 0;

        const discoverNext = () => {
            if (discoveredIndex < catalog.length && this.currentStep === 2) {
                const item = catalog[discoveredIndex];
                this.discoveredDevices.push(item);
                this.renderDiscoveredItem(item);
                if (window.smartUpsEngine) {
                    window.smartUpsEngine.playBeep(1200, 0.05);
                }
                discoveredIndex++;

                if (discoveredIndex < catalog.length) {
                    this.scanTimer = setTimeout(discoverNext, 1200 + Math.random() * 800);
                } else {
                    if (scanningText) {
                        scanningText.textContent = `Scan Complete: Found ${catalog.length} available device(s) ready to pair.`;
                    }
                }
            }
        };

        // Trigger first detection after 1 second
        this.scanTimer = setTimeout(discoverNext, 1000);
    }

    renderDiscoveredItem(device) {
        const list = document.getElementById('discoveredDevicesList');
        if (!list) return;

        const card = document.createElement('div');
        card.className = "p-4 rounded-xl bg-gray-800/80 border border-cyan-500/40 hover:border-cyan-400 transition-all duration-300 flex items-center justify-between gap-4 animate-fade-in shadow-lg shadow-cyan-950/30";

        // Signal strength bars
        const signalLevel = device.rssi > -50 ? 4 : (device.rssi > -65 ? 3 : 2);
        let signalBars = '';
        for (let i = 1; i <= 4; i++) {
            const active = i <= signalLevel;
            signalBars += `<span class="inline-block w-1.5 h-${i * 1.5 + 1} rounded-t ${active ? 'bg-emerald-400' : 'bg-gray-700'}"></span>`;
        }

        card.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl font-bold">
                    ${device.type === 'switch' ? '⚡' : (device.type === 'battery' ? '🔋' : '🔌')}
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-white text-base">${device.name}</span>
                        <span class="text-xs px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 font-mono">${device.model}</span>
                    </div>
                    <div class="text-xs text-gray-400 flex items-center gap-3 mt-1 font-mono">
                        <span>MAC: ${device.mac}</span>
                        <span>•</span>
                        <span class="text-emerald-400">${device.protocol}</span>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-4">
                <div class="text-right hidden sm:block">
                    <div class="text-xs text-gray-400 flex items-center gap-1.5 justify-end">
                        <span>Signal: ${device.rssi} dBm</span>
                        <div class="flex items-end gap-0.5 h-4">
                            ${signalBars}
                        </div>
                    </div>
                    <div class="text-[11px] text-gray-500">Firmware ${device.firmware}</div>
                </div>

                <button class="btn-pair-target px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-sm transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer">
                    Pair Device →
                </button>
            </div>
        `;

        card.querySelector('.btn-pair-target').addEventListener('click', () => {
            this.startHandshake(device);
        });

        list.appendChild(card);
    }

    startHandshake(device) {
        this.selectedCatalogItem = device;
        this.renderStep(3);

        const progressBar = document.getElementById('handshakeProgressBar');
        const stageList = document.getElementById('handshakeStageList');
        const deviceNameElem = document.getElementById('handshakeDeviceName');

        if (deviceNameElem) {
            deviceNameElem.textContent = `${device.name} (${device.model})`;
        }

        const stages = [
            { text: "Verifying hardware identity token & cryptographic key...", duration: 800 },
            { text: "Establishing encrypted AES-256 telemetry bridge...", duration: 900 },
            { text: "Assigning dedicated UPS mesh IP address...", duration: 700 },
            { text: "Synchronizing real-time power metering & safety relays...", duration: 800 }
        ];

        if (stageList) {
            stageList.innerHTML = stages.map((s, idx) => `
                <li id="stage_item_${idx}" class="flex items-center gap-3 text-sm text-gray-500 transition-colors duration-300">
                    <span class="w-5 h-5 rounded-full border border-gray-700 flex items-center justify-center text-xs stage-icon font-mono">
                        ${idx + 1}
                    </span>
                    <span class="stage-text">${s.text}</span>
                </li>
            `).join('');
        }

        let currentProgress = 5;
        let activeStageIndex = 0;

        const updateStageUI = (index) => {
            const item = document.getElementById(`stage_item_${index}`);
            if (item) {
                item.classList.remove('text-gray-500');
                item.classList.add('text-cyan-300', 'font-medium');
                const icon = item.querySelector('.stage-icon');
                icon.className = "w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center text-xs font-bold animate-pulse";
                icon.innerHTML = "•";
            }
        };

        const markStageComplete = (index) => {
            const item = document.getElementById(`stage_item_${index}`);
            if (item) {
                item.classList.remove('text-cyan-300', 'font-medium');
                item.classList.add('text-emerald-400');
                const icon = item.querySelector('.stage-icon');
                icon.className = "w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs font-bold";
                icon.innerHTML = "✓";
            }
        };

        updateStageUI(0);
        if (window.smartUpsEngine) {
            window.smartUpsEngine.playBeep(650, 0.1);
        }

        const runStage = (idx) => {
            if (idx >= stages.length) {
                if (progressBar) progressBar.style.width = '100%';
                if (window.smartUpsEngine) {
                    window.smartUpsEngine.playChime();
                }
                setTimeout(() => {
                    this.prepareConfigurationStep();
                }, 600);
                return;
            }

            activeStageIndex = idx;
            updateStageUI(idx);

            const percentPerStage = 95 / stages.length;
            currentProgress = Math.min(95, Math.round((idx + 1) * percentPerStage));
            if (progressBar) progressBar.style.width = `${currentProgress}%`;

            setTimeout(() => {
                markStageComplete(idx);
                if (window.smartUpsEngine) {
                    window.smartUpsEngine.playBeep(880 + (idx * 150), 0.08);
                }
                runStage(idx + 1);
            }, stages[idx].duration);
        };

        runStage(0);
    }

    prepareConfigurationStep() {
        this.renderStep(4);
        const device = this.selectedCatalogItem;

        // Auto-fill suggested name
        const nameInput = document.getElementById('cfgDeviceName');
        const roomInput = document.getElementById('cfgRoomName');
        const typeBadge = document.getElementById('cfgDeviceTypeBadge');

        if (nameInput && device) {
            nameInput.value = `${device.name} - Unit ${Math.floor(Math.random() * 90 + 10)}`;
        }
        if (typeBadge && device) {
            typeBadge.textContent = `${device.type.toUpperCase()} • ${device.protocol}`;
        }
    }

    finalizePairing() {
        const name = document.getElementById('cfgDeviceName')?.value || this.selectedCatalogItem.name;
        const room = document.getElementById('cfgRoomName')?.value || "Control Lab";
        const priority = document.getElementById('cfgPriority')?.value || "essential";
        const initialState = document.getElementById('cfgInitialState')?.checked ?? true;

        const config = {
            type: this.selectedCatalogItem.type,
            name: name.trim(),
            room: room.trim(),
            priority: priority,
            initialState: initialState,
            ratedAmps: this.selectedCatalogItem.ratedAmps
        };

        window.smartUpsEngine.addPairedDevice(config);

        window.showToast(`Device "${config.name}" successfully integrated into ${config.room}!`, "success");
        this.close();

        // Scroll to dashboard switches / sockets section
        const targetSection = config.type === 'switch' ? document.getElementById('switchesSection') : document.getElementById('outletsSection');
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Global pairing manager instance
window.smartUpsPairing = new PairingManager();
