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

        // Step 2 Rescan and Back buttons
        const radarScanBtn = document.getElementById('btnRadarScan');
        if (radarScanBtn) {
            radarScanBtn.addEventListener('click', () => {
                this.startDiscoveryScan();
            });
        }

        const rescanListBtn = document.getElementById('btnPairRescan');
        if (rescanListBtn) {
            rescanListBtn.addEventListener('click', () => {
                this.startDiscoveryScan();
            });
        }

        const backStep1Btn = document.getElementById('btnPairBackStep1');
        if (backStep1Btn) {
            backStep1Btn.addEventListener('click', () => {
                if (this.scanTimer) clearTimeout(this.scanTimer);
                this.renderStep(1);
            });
        }

        // Step 4 Form submit
        const configForm = document.getElementById('pairingConfigForm');
        if (configForm) {
            configForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.finalizePairing();
            });
        }

        // Step 4 Section count buttons
        document.querySelectorAll('.btn-cfg-sec-count').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const count = parseInt(btn.dataset.count, 10) || 1;
                this.setSectionCount(count);
            });
        });

        // Step 4 Add Section button
        const addSecBtn = document.getElementById('btnCfgAddSection');
        if (addSecBtn) {
            addSecBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const current = this.sectionCount || 1;
                if (current < 4) {
                    this.setSectionCount(current + 1);
                } else {
                    window.showToast("Maximum 4 sections allowed per smart switch.", "info");
                }
            });
        }

        // Step 4 Load Shedding Tier change listener
        const prioritySelect = document.getElementById('cfgPriority');
        if (prioritySelect) {
            prioritySelect.addEventListener('change', () => {
                this.updatePriorityExplainer(prioritySelect.value);
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
        if (this.stageTimer) clearTimeout(this.stageTimer);
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
        if (this.scanTimer) {
            clearTimeout(this.scanTimer);
            this.scanTimer = null;
        }

        this.isScanning = true;
        this.discoveredDevices = [];
        const resultsContainer = document.getElementById('discoveredDevicesList');
        const scanningText = document.getElementById('scanStatusText');
        const radarElement = document.getElementById('radarSweeper');

        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div id="scanStatusPlaceholder" class="p-8 rounded-2xl border border-dashed border-cyan-500/30 bg-slate-950/40 text-center space-y-3">
                    <div class="w-12 h-12 mx-auto rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                        <span class="inline-block w-6 h-6 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></span>
                    </div>
                    <div>
                        <h4 class="text-xs font-bold text-white tracking-wider uppercase font-mono">Radar Frequency Sweep Active</h4>
                        <p class="text-[11px] text-slate-400 font-mono mt-1">Listening for BLE advertisements and 802.15.4 mesh packets...</p>
                    </div>
                </div>
            `;
        }
        if (scanningText) {
            scanningText.innerHTML = `<span class="text-cyan-400 font-mono">Sweeping Bluetooth LE & 2.4GHz SmartUps Mesh for uncommissioned nodes...</span>`;
        }
        if (radarElement) {
            radarElement.classList.add('animate-radar-sweep');
        }

        // Safely retrieve hardware catalog
        const sourceCatalog = window.PAIRING_CATALOG || (typeof PAIRING_CATALOG !== 'undefined' ? PAIRING_CATALOG : (DEFAULT_SYSTEM_DATA && DEFAULT_SYSTEM_DATA.pairingCatalog) || []);
        let catalog = sourceCatalog.filter(d =>
            !this.selectedDeviceType || this.selectedDeviceType === 'all' || d.type === this.selectedDeviceType
        );
        if (!catalog || catalog.length === 0) {
            catalog = sourceCatalog; // safe fallback
        }

        let discoveredIndex = 0;

        const discoverNext = () => {
            if (this.currentStep !== 2) return;

            // Remove loading placeholder before injecting first device
            const placeholder = document.getElementById('scanStatusPlaceholder');
            if (placeholder) {
                placeholder.remove();
            }

            if (discoveredIndex < catalog.length) {
                const item = catalog[discoveredIndex];
                this.discoveredDevices.push(item);
                this.renderDiscoveredItem(item);
                if (window.smartUpsEngine) {
                    window.smartUpsEngine.playBeep(1200, 0.06);
                }
                discoveredIndex++;

                if (discoveredIndex < catalog.length) {
                    if (scanningText) {
                        scanningText.innerHTML = `<span class="text-cyan-300 font-semibold font-mono">Node Discovered!</span> <span class="text-slate-400 font-mono">Sweeping for additional hardware...</span>`;
                    }
                    // Discover next node approximately 1 second after
                    this.scanTimer = setTimeout(discoverNext, 1000);
                } else {
                    this.isScanning = false;
                    if (scanningText) {
                        scanningText.innerHTML = `<span class="text-emerald-400 font-bold font-mono">✓ Scan Complete:</span> <span class="text-slate-300 font-mono">Found ${catalog.length} available device(s) ready to pair.</span>`;
                    }
                }
            }
        };

        // User requested: trigger demo discovery 1 second (1000ms) after scanning starts
        this.scanTimer = setTimeout(discoverNext, 1000);
    }

    renderDiscoveredItem(device) {
        const list = document.getElementById('discoveredDevicesList');
        if (!list) return;

        const card = document.createElement('div');
        card.className = "p-4 rounded-xl bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 transition-all duration-300 flex items-center justify-between gap-4 shadow-lg shadow-cyan-950/30";

        // Signal strength bars
        const signalLevel = device.rssi > -45 ? 4 : (device.rssi > -55 ? 3 : 2);
        let signalBars = '';
        for (let i = 1; i <= 4; i++) {
            const active = i <= signalLevel;
            const barHeight = i * 4 + 2;
            signalBars += `<span class="inline-block w-1.5 rounded-t ${active ? 'bg-emerald-400' : 'bg-slate-700'}" style="height: ${barHeight}px;"></span>`;
        }

        const typeIcon = device.type === 'switch' ? '⚡' : (device.type === 'battery' ? '🔋' : '🔌');
        const typeBg = device.type === 'switch' ? 'border-cyan-500/30 bg-cyan-950/60 text-cyan-400' : (device.type === 'battery' ? 'border-purple-500/30 bg-purple-950/60 text-purple-400' : 'border-emerald-500/30 bg-emerald-950/60 text-emerald-400');

        card.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl ${typeBg} border flex items-center justify-center text-xl font-bold flex-shrink-0">
                    ${typeIcon}
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-white text-sm">${device.name}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 font-mono">${device.model}</span>
                    </div>
                    <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                        <span>MAC: ${device.mac}</span>
                        <span>•</span>
                        <span class="text-emerald-400">${device.protocol}</span>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <div class="text-right hidden sm:block">
                    <div class="text-[11px] text-slate-400 flex items-center gap-1.5 justify-end font-mono">
                        <span>${device.rssi} dBm</span>
                        <div class="flex items-end gap-0.5 h-4">
                            ${signalBars}
                        </div>
                    </div>
                    <div class="text-[10px] text-slate-500 font-mono">${device.ratedAmps ? device.ratedAmps + 'A Rated' : 'Modular LiFePO4'}</div>
                </div>

                <button type="button" class="btn-pair-target px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer whitespace-nowrap">
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
        if (this.stageTimer) {
            clearTimeout(this.stageTimer);
            this.stageTimer = null;
        }

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
                <li id="stage_item_${idx}" class="flex items-center gap-3 text-sm text-slate-400 transition-colors duration-300">
                    <span class="stage-icon w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-xs font-mono">
                        ${idx + 1}
                    </span>
                    <span class="stage-text">${s.text}</span>
                </li>
            `).join('');
        }

        const updateStageUI = (index) => {
            const item = document.getElementById(`stage_item_${index}`);
            if (item) {
                item.classList.remove('text-slate-400', 'text-gray-500');
                item.classList.add('text-cyan-300', 'font-medium');
                const icon = item.querySelector('.stage-icon') || item.firstElementChild;
                if (icon) {
                    icon.className = "stage-icon w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center text-xs font-bold animate-pulse font-mono";
                    icon.innerHTML = "•";
                }
            }
        };

        const markStageComplete = (index) => {
            const item = document.getElementById(`stage_item_${index}`);
            if (item) {
                item.classList.remove('text-cyan-300', 'font-medium', 'text-slate-400');
                item.classList.add('text-emerald-400');
                const icon = item.querySelector('.stage-icon') || item.firstElementChild;
                if (icon) {
                    icon.className = "stage-icon w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs font-bold font-mono";
                    icon.innerHTML = "✓";
                }
            }
        };

        if (window.smartUpsEngine) {
            window.smartUpsEngine.playBeep(650, 0.1);
        }

        const runStage = (idx) => {
            if (this.currentStep !== 3) return;

            if (idx >= stages.length) {
                if (progressBar) progressBar.style.width = '100%';
                if (window.smartUpsEngine) {
                    window.smartUpsEngine.playChime();
                }
                this.stageTimer = setTimeout(() => {
                    this.prepareConfigurationStep();
                }, 600);
                return;
            }

            updateStageUI(idx);

            const percentPerStage = 95 / stages.length;
            const currentProgress = Math.min(95, Math.round((idx + 1) * percentPerStage));
            if (progressBar) progressBar.style.width = `${currentProgress}%`;

            this.stageTimer = setTimeout(() => {
                markStageComplete(idx);
                if (window.smartUpsEngine) {
                    window.smartUpsEngine.playBeep(880 + (idx * 150), 0.08);
                }
                runStage(idx + 1);
            }, stages[idx].duration);
        };

        runStage(0);
    }

    setSectionCount(count) {
        this.sectionCount = Math.max(1, Math.min(4, count));
        document.querySelectorAll('.btn-cfg-sec-count').forEach(btn => {
            const bCount = parseInt(btn.dataset.count, 10);
            if (bCount === this.sectionCount) {
                btn.className = "btn-cfg-sec-count w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all border border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-500/30 cursor-pointer";
            } else {
                btn.className = "btn-cfg-sec-count w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all border border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 cursor-pointer";
            }
        });
        this.renderSectionInputs();
    }

    renderSectionInputs() {
        const container = document.getElementById('cfgSectionsInputsList');
        if (!container) return;

        // Preserve already typed labels
        const existingValues = {};
        container.querySelectorAll('.cfg-section-label-input').forEach(inp => {
            existingValues[inp.dataset.secId] = inp.value;
        });

        let html = '';
        for (let i = 1; i <= this.sectionCount; i++) {
            // User requested: default 1 named "Default Section"
            const defaultLabel = i === 1 ? "Default Section" : `Section ${i}`;
            const val = (existingValues[i] !== undefined && existingValues[i].trim().length > 0)
                ? existingValues[i]
                : defaultLabel;

            html += `
                <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold flex-shrink-0">${i}</span>
                    <input type="text" 
                           class="cfg-section-label-input flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none" 
                           data-sec-id="${i}" 
                           value="${val}" 
                           placeholder="Label for Section ${i}">
                </div>
            `;
        }
        container.innerHTML = html;
    }

    updatePriorityExplainer(priority) {
        const explainer = document.getElementById('cfgPriorityExplainer');
        if (!explainer) return;

        if (priority === 'critical') {
            explainer.className = "p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200";
            explainer.innerHTML = `🟣 <strong>Critical:</strong> Never auto-sheds. SmartUps maintains continuous power until 0% battery reserve or physical emergency shutdown.`;
        } else if (priority === 'non-essential') {
            explainer.className = "p-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-[11px] text-slate-300";
            explainer.innerHTML = `⚪ <strong>Non-Essential:</strong> Sheds immediately upon grid failure / blackout mode to preserve battery capacity for critical loads.`;
        } else {
            explainer.className = "p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-[11px] text-blue-200";
            explainer.innerHTML = `🔵 <strong>Essential (Default):</strong> Operates on UPS battery during outage; automatically sheds if battery falls below 20% to safeguard Critical loads.`;
        }
    }

    prepareConfigurationStep() {
        this.renderStep(4);
        const device = this.selectedCatalogItem;

        // Auto-fill suggested name
        const nameInput = document.getElementById('cfgDeviceName');
        const roomInput = document.getElementById('cfgRoomName');
        const typeBadge = document.getElementById('cfgDeviceTypeBadge');
        const switchBox = document.getElementById('cfgSwitchSectionsBox');

        if (nameInput && device) {
            nameInput.value = `${device.name} - Unit ${Math.floor(Math.random() * 90 + 10)}`;
        }
        if (typeBadge && device) {
            typeBadge.textContent = `${device.type.toUpperCase()} • ${device.protocol}`;
        }

        if (switchBox) {
            if (device && device.type === 'switch') {
                switchBox.classList.remove('hidden');
                this.setSectionCount(1); // User request: default 1 named "Default Section"
            } else {
                switchBox.classList.add('hidden');
            }
        }

        const prioritySelect = document.getElementById('cfgPriority');
        if (prioritySelect) {
            this.updatePriorityExplainer(prioritySelect.value || 'essential');
        }
    }

    finalizePairing() {
        if (!this.selectedCatalogItem) return;
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

        if (config.type === 'switch') {
            const sectionInputs = document.querySelectorAll('.cfg-section-label-input');
            const sections = [];
            sectionInputs.forEach(inp => {
                const secId = parseInt(inp.dataset.secId, 10) || 1;
                const secLabel = inp.value.trim() || `Circuit ${secId}`;
                sections.push({
                    id: secId,
                    label: secLabel,
                    state: initialState,
                    watts: Math.floor(Math.random() * 35 + 35)
                });
            });
            config.sections = sections.length > 0 ? sections : [
                { id: 1, label: `${config.name} - Circuit 1`, state: initialState, watts: 60 }
            ];
        }

        window.smartUpsEngine.addPairedDevice(config);

        const successMsg = config.type === 'switch'
            ? `Smart Switch "${config.name}" configured with ${config.sections.length} section(s) in ${config.room}!`
            : `Device "${config.name}" successfully integrated into ${config.room}!`;

        window.showToast(successMsg, "success");
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
