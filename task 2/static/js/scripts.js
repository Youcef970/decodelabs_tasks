document.addEventListener('DOMContentLoaded', function() {
    // --- Tabs ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = {
        encrypt: document.getElementById('tab-encrypt'),
        decrypt: document.getElementById('tab-decrypt'),
        metrics: document.getElementById('tab-metrics')
    };
    // Add Caesar tab (must be done before event listeners)
    tabContents.caesar = document.getElementById('tab-caesar');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            Object.keys(tabContents).forEach(key => {
                if (tabContents[key]) tabContents[key].classList.remove('active');
            });
            if (tabContents[tab]) tabContents[tab].classList.add('active');
        });
    });

    // --- Chart variables ---
    let avChart = null, entropyChart = null, histChart = null, ksChart = null;

    function destroyCharts() {
        if (avChart) { avChart.destroy(); avChart = null; }
        if (entropyChart) { entropyChart.destroy(); entropyChart = null; }
        if (histChart) { histChart.destroy(); histChart = null; }
        if (ksChart) { ksChart.destroy(); ksChart = null; }
    }

    // --- Helper: update status badge ---
    function updateBadge(id, value, ideal, thresholds) {
        const badge = document.getElementById(id);
        if (!badge) return;
        const diff = Math.abs(value - ideal);
        if (diff <= thresholds.good) {
            badge.textContent = '● Ideal';
            badge.className = 'status-badge';
        } else if (diff <= thresholds.warning) {
            badge.textContent = '● Acceptable';
            badge.className = 'status-badge warning';
        } else {
            badge.textContent = '● Weak';
            badge.className = 'status-badge danger';
        }
    }

    // --- 1. ENCRYPT ---
    document.getElementById('encrypt-btn').addEventListener('click', function() {
        const plaintext = document.getElementById('enc-plaintext').value;
        const password = document.getElementById('enc-password').value;
        if (!plaintext) { alert('Please enter plaintext.'); return; }

        fetch('/encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plaintext, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) { alert('Error: ' + data.error); return; }
            document.getElementById('enc-output').textContent = data.ciphertext;
            document.getElementById('enc-result').style.display = 'block';
            if (data.sbox) {
                document.getElementById('sbox-preview').textContent = data.sbox.join(', ');
            }
        })
        .catch(err => { alert('Request failed: ' + err.message); console.error(err); });
    });

    // Copy
    document.getElementById('copy-btn').addEventListener('click', function() {
        const text = document.getElementById('enc-output').textContent;
        if (!text) return;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => alert('Copied!'));
        } else {
            const range = document.createRange();
            const selection = window.getSelection();
            const el = document.getElementById('enc-output');
            range.selectNodeContents(el);
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand('copy');
            alert('Copied!');
        }
    });

    // --- 2. DECRYPT ---
    document.getElementById('decrypt-btn').addEventListener('click', function() {
        const ciphertext = document.getElementById('dec-ciphertext').value;
        const password = document.getElementById('dec-password').value;
        if (!ciphertext) { alert('Please enter ciphertext.'); return; }

        fetch('/decrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ciphertext, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) { alert('Error: ' + data.error); return; }
            document.getElementById('dec-output').textContent = data.plaintext;
            document.getElementById('dec-result').style.display = 'block';
        })
        .catch(err => { alert('Request failed: ' + err.message); console.error(err); });
    });

    // --- 3. METRICS ---
    document.getElementById('metrics-btn').addEventListener('click', function() {
        const plaintext = document.getElementById('metrics-text').value || 'Default test message.';
        const password = document.getElementById('metrics-password').value || 'default123';

        const resultBox = document.getElementById('metrics-result');
        resultBox.style.display = 'block';
        document.getElementById('avalanche-val').textContent = '...';
        document.getElementById('entropy-val').textContent = '...';
        document.getElementById('ks-val').textContent = '...';

        destroyCharts();

        fetch('/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plaintext, password })
        })
        .then(async res => {
            if (!res.ok) {
                let errorMsg = `Server error (${res.status})`;
                try {
                    const errorData = await res.json();
                    if (errorData.error) errorMsg = errorData.error;
                } catch (_) {
                    const text = await res.text();
                    errorMsg = text || errorMsg;
                }
                throw new Error(errorMsg);
            }
            return res.json();
        })
        .then(data => {
            if (data.error) {
                alert('Metrics Error: ' + data.error);
                resultBox.style.display = 'none';
                return;
            }

            // Avalanche
            const av = data.avalanche;
            if (av && typeof av.percent === 'number') {
                document.getElementById('avalanche-val').textContent = av.percent;
                renderAvalancheChart(av.percent);
                updateBadge('avalanche-status', av.percent, 50, { good: 10, warning: 20 });
            }

            // Entropy
            if (typeof data.entropy === 'number') {
                document.getElementById('entropy-val').textContent = data.entropy;
                renderEntropyGauge(data.entropy);
                updateBadge('entropy-status', data.entropy, 8, { good: 1.0, warning: 2.0 });
            }

            // Histogram
            if (data.histogram && Array.isArray(data.histogram.counts) && data.histogram.counts.length === 256) {
                renderHistogram(data.histogram.counts);
                // Check uniformity: if max frequency is less than 3x average, it's uniform
                const counts = data.histogram.counts;
                const avg = counts.reduce((a,b) => a+b, 0) / 256;
                const max = Math.max(...counts);
                const badge = document.getElementById('hist-status');
                if (max < avg * 4) {
                    badge.textContent = '● Uniform';
                    badge.className = 'status-badge';
                } else {
                    badge.textContent = '● Biased';
                    badge.className = 'status-badge warning';
                }
            }

            // Key Sensitivity
            const ks = data.key_sensitivity;
            if (ks && typeof ks.percent === 'number') {
                document.getElementById('ks-val').textContent = ks.percent;
                renderKSChart(ks.percent);
                updateBadge('ks-status', ks.percent, 50, { good: 10, warning: 20 });
            }
        })
        .catch(err => {
            alert('❌ Metrics Analysis Failed: ' + err.message);
            console.error(err);
            resultBox.style.display = 'none';
        });
    });

    // --- 4. CLASSIC CAESAR ---
    const shiftSlider = document.getElementById('caesar-shift-slider');
    const shiftDisplay = document.getElementById('caesar-shift-display');
    const caesarText = document.getElementById('caesar-text');

    // Update shift display
    shiftSlider.addEventListener('input', function() {
        shiftDisplay.textContent = this.value;
        // Trigger live demo update
        updateCaesarDemo();
    });

    // Live demo: show step-by-step ASCII math
    function updateCaesarDemo() {
        const text = caesarText.value || 'Hello';
        const shift = parseInt(shiftSlider.value);
        
        fetch('/caesar/demo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plaintext: text, shift: shift })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) return;
            const steps = data.steps;
            const result = data.result;
            
            let html = '';
            steps.forEach(step => {
                const color = step.char === step.result ? '#5a6a7a' : '#b0f0e0';
                html += `<div style="display:flex; gap:12px; padding:2px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
                    <span style="width:30px; color:#ffaa44;">'${step.char}'</span>
                    <span style="color:#8899aa; font-size:12px;">→</span>
                    <span style="color:#b8c8dd; font-size:12px;">${step.formula}</span>
                    <span style="color:#8899aa; font-size:12px;">→</span>
                    <span style="color:${color}; font-weight:600;">'${step.result}'</span>
                </div>`;
            });
            document.getElementById('caesar-demo-steps').innerHTML = html;
            document.getElementById('caesar-demo-encrypted').textContent = result;
        })
        .catch(err => console.error('Demo error:', err));
    }

    // Trigger live demo on text change
    caesarText.addEventListener('input', updateCaesarDemo);
    // Initial demo
    setTimeout(updateCaesarDemo, 100);

    // Caesar Encrypt
    document.getElementById('caesar-encrypt-btn').addEventListener('click', function() {
        const text = document.getElementById('caesar-text').value;
        const shift = parseInt(shiftSlider.value);
        if (!text) { alert('Please enter text.'); return; }

        fetch('/caesar/encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plaintext: text, shift: shift })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) { alert('Error: ' + data.error); return; }
            document.getElementById('caesar-output').textContent = data.ciphertext;
            document.getElementById('caesar-result').style.display = 'block';
            document.getElementById('caesar-brute-results').style.display = 'none';
        })
        .catch(err => alert('Request failed: ' + err.message));
    });

    // Caesar Decrypt
    document.getElementById('caesar-decrypt-btn').addEventListener('click', function() {
        const text = document.getElementById('caesar-text').value;
        const shift = parseInt(shiftSlider.value);
        if (!text) { alert('Please enter text.'); return; }

        fetch('/caesar/decrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ciphertext: text, shift: shift })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) { alert('Error: ' + data.error); return; }
            document.getElementById('caesar-output').textContent = data.plaintext;
            document.getElementById('caesar-result').style.display = 'block';
            document.getElementById('caesar-brute-results').style.display = 'none';
        })
        .catch(err => alert('Request failed: ' + err.message));
    });

    // Caesar Brute-Force
    document.getElementById('caesar-brute-btn').addEventListener('click', function() {
        const text = document.getElementById('caesar-text').value;
        if (!text) { alert('Please enter ciphertext.'); return; }

        fetch('/caesar/bruteforce', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ciphertext: text })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) { alert('Error: ' + data.error); return; }
            const results = data.results;
            let html = '';
            results.forEach(r => {
                html += `<div style="background:rgba(0,0,0,0.2); padding:6px 12px; border-radius:6px; font-size:13px; border-left:2px solid ${r.shift === 3 ? '#00ffc8' : '#2a3a4a'};">
                    <strong style="color:#ffaa44;">Shift ${r.shift}:</strong> 
                    <span style="color:#b0f0e0;">${r.text}</span>
                    ${r.shift === 3 ? ' <span style="color:#00ffc8; font-size:11px;">✅ (likely)</span>' : ''}
                </div>`;
            });
            document.getElementById('caesar-brute-list').innerHTML = html;
            document.getElementById('caesar-brute-results').style.display = 'block';
            document.getElementById('caesar-result').style.display = 'none';
        })
        .catch(err => alert('Request failed: ' + err.message));
    });

    // --- CHART RENDERERS ---
    function renderAvalancheChart(value) {
        const canvas = document.getElementById('avalanche-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (avChart) avChart.destroy();
        avChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Actual', 'Ideal'],
                datasets: [{
                    label: 'Bit Change (%)',
                    data: [value, 50],
                    backgroundColor: ['#00ffc8', 'rgba(136,153,170,0.2)'],
                    borderColor: ['#00ffc8', '#5a6a7a'],
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { max: 100, beginAtZero: true, grid: { color: 'rgba(255,255,255,0.03)' } } },
                plugins: { legend: { display: false } }
            }
        });
    }

    function renderEntropyGauge(value) {
        const canvas = document.getElementById('entropy-gauge');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (entropyChart) entropyChart.destroy();
        entropyChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Entropy', 'Remaining'],
                datasets: [{
                    data: [value, Math.max(0, 8 - value)],
                    backgroundColor: ['#00aaff', 'rgba(136,153,170,0.15)'],
                    borderColor: ['#00aaff', 'transparent'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: { legend: { display: false } },
                animation: { animateRotate: true }
            }
        });
    }

    function renderHistogram(counts) {
        const canvas = document.getElementById('histogram-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (histChart) histChart.destroy();
        if (!Array.isArray(counts) || counts.length !== 256) {
            counts = new Array(256).fill(0);
        }
        const labels = Array.from({ length: 256 }, (_, i) => i);
        histChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Frequency',
                    data: counts,
                    backgroundColor: 'rgba(0, 255, 200, 0.15)',
                    borderColor: 'rgba(0, 255, 200, 0.4)',
                    borderWidth: 0.5,
                    borderRadius: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { display: false },
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.03)' } }
                },
                plugins: { legend: { display: false } },
                animation: { duration: 400 }
            }
        });
    }

    function renderKSChart(value) {
        const canvas = document.getElementById('ks-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ksChart) ksChart.destroy();
        ksChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Actual', 'Ideal'],
                datasets: [{
                    label: 'Difference (%)',
                    data: [value, 50],
                    backgroundColor: ['#ffaa44', 'rgba(136,153,170,0.2)'],
                    borderColor: ['#ffaa44', '#5a6a7a'],
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { max: 100, beginAtZero: true, grid: { color: 'rgba(255,255,255,0.03)' } } },
                plugins: { legend: { display: false } }
            }
        });
    }
});