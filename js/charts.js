/**
 * SmartUps - Live Real-Time Telemetry Charts
 * Uses Chart.js with glowing neon gradients, live rolling data points, and dual views.
 */

class TelemetryCharts {
    constructor() {
        this.powerChart = null;
        this.chartHistoryLength = 20; // Number of rolling data points
        this.labels = [];
        this.powerData = [];
        this.batteryData = [];
        this.activeMetric = 'power'; // 'power' or 'battery'

        this.initData();
        this.initChart();
        this.bindEvents();
    }

    initData() {
        const now = new Date();
        for (let i = this.chartHistoryLength - 1; i >= 0; i--) {
            const timePoint = new Date(now.getTime() - (i * 2000));
            this.labels.push(timePoint.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            this.powerData.push(1150 + Math.floor(Math.sin(i) * 80 + Math.random() * 40));
            this.batteryData.push(94);
        }
    }

    initChart() {
        const canvas = document.getElementById('telemetryCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Cyan gradient for power load
        const cyanGrad = ctx.createLinearGradient(0, 0, 0, 260);
        cyanGrad.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
        cyanGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

        // Emerald gradient for battery
        const greenGrad = ctx.createLinearGradient(0, 0, 0, 260);
        greenGrad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
        greenGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

        this.gradients = {
            power: cyanGrad,
            battery: greenGrad
        };

        this.powerChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.labels,
                datasets: [
                    {
                        label: 'Active Output Load (Watts)',
                        data: this.powerData,
                        borderColor: '#06b6d4',
                        backgroundColor: cyanGrad,
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 2,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#22d3ee',
                        pointBorderColor: '#083344',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 400,
                    easing: 'easeOutQuad'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#e2e8f0',
                        bodyColor: '#38bdf8',
                        borderColor: '#0284c7',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                return `Load: ${context.parsed.y} Watts (${Math.round((context.parsed.y / 2700) * 100)}% Capacity)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#64748b',
                            font: { size: 10, family: 'monospace' },
                            maxTicksLimit: 6
                        }
                    },
                    y: {
                        min: 0,
                        max: 2700,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.06)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: { size: 10, family: 'monospace' },
                            callback: (value) => `${value} W`
                        }
                    }
                }
            }
        });
    }

    bindEvents() {
        const btnMetricPower = document.getElementById('btnMetricPower');
        const btnMetricBattery = document.getElementById('btnMetricBattery');

        if (btnMetricPower && btnMetricBattery) {
            btnMetricPower.addEventListener('click', () => this.switchMetric('power'));
            btnMetricBattery.addEventListener('click', () => this.switchMetric('battery'));
        }
    }

    switchMetric(metric) {
        if (this.activeMetric === metric) return;
        this.activeMetric = metric;

        const btnPower = document.getElementById('btnMetricPower');
        const btnBattery = document.getElementById('btnMetricBattery');

        if (metric === 'power') {
            btnPower.classList.add('bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/40');
            btnPower.classList.remove('text-gray-400', 'border-transparent');

            btnBattery.classList.remove('bg-emerald-500/20', 'text-emerald-400', 'border-emerald-500/40');
            btnBattery.classList.add('text-gray-400', 'border-transparent');

            this.powerChart.data.datasets[0].label = 'Active Output Load (Watts)';
            this.powerChart.data.datasets[0].data = this.powerData;
            this.powerChart.data.datasets[0].borderColor = '#06b6d4';
            this.powerChart.data.datasets[0].backgroundColor = this.gradients.power;
            this.powerChart.data.datasets[0].pointBackgroundColor = '#22d3ee';
            this.powerChart.options.scales.y.max = 2700;
            this.powerChart.options.scales.y.ticks.callback = (val) => `${val} W`;
        } else {
            btnBattery.classList.add('bg-emerald-500/20', 'text-emerald-400', 'border-emerald-500/40');
            btnBattery.classList.remove('text-gray-400', 'border-transparent');

            btnPower.classList.remove('bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/40');
            btnPower.classList.add('text-gray-400', 'border-transparent');

            this.powerChart.data.datasets[0].label = 'Battery State of Charge (%)';
            this.powerChart.data.datasets[0].data = this.batteryData;
            this.powerChart.data.datasets[0].borderColor = '#10b981';
            this.powerChart.data.datasets[0].backgroundColor = this.gradients.battery;
            this.powerChart.data.datasets[0].pointBackgroundColor = '#34d399';
            this.powerChart.options.scales.y.max = 100;
            this.powerChart.options.scales.y.ticks.callback = (val) => `${val}%`;
        }

        this.powerChart.update('none');
    }

    pushTelemetryPoint(currentWatts, currentBatteryPct) {
        if (!this.powerChart) return;

        const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        this.labels.push(timeLabel);
        this.labels.shift();

        this.powerData.push(currentWatts);
        this.powerData.shift();

        this.batteryData.push(currentBatteryPct);
        this.batteryData.shift();

        this.powerChart.update('none');
    }
}

// Global charts instance
window.smartUpsCharts = new TelemetryCharts();
