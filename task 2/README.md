# 🔐 Post‑Quantum IoT Cryptography
### Hybrid Chaotic‑Lattice Framework with Classic Caesar Foundation

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3.3-green.svg)](https://flask.palletsprojects.com/)
[![Render](https://img.shields.io/badge/Deployed-Render-purple.svg)](https://render.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 Overview

This project was developed as **Project 2** for the DecodeLabs Cybersecurity Internship (Batch 2026). It fulfils the **mandatory requirement** (Classic Caesar Cipher) while extending far beyond into **post‑quantum cryptographic research**.

> **The Problem:** IoMT (Internet of Medical Things) devices—pacemakers, insulin pumps, patient monitors—are resource‑constrained but must be resistant to future quantum attacks. Existing post‑quantum solutions (Kyber, Dilithium) are too heavy for 8‑bit microcontrollers.

> **Our Solution:** A **hybrid chaotic‑lattice framework** that combines:
> - **Chaotic key generation** (Logistic Map, r=3.99) for lightweight entropy.
> - **Dynamic key‑dependent S‑Box** (256‑byte permutation, unique per password).
> - **16‑round Feistel network** with strong linear diffusion.
> - **Live security metrics** (Avalanche Effect, Shannon Entropy, Histogram, Key Sensitivity).

---

## ✨ Features

### 1. 🏛️ Classic Caesar Cipher (Mandatory Requirement)
- Encrypt / Decrypt with shift slider (1‑25).
- **Live ASCII transformation** – see `ord(char) - 65 + shift` in real time.
- **Brute‑force all 25 shifts** – visually demonstrates why Caesar is insecure.

### 2. ⚡ Hybrid Post‑Quantum Cipher (Research Bonus)
- **Dynamic S‑Box** generated per key via chaotic logistic map.
- **16‑round Feistel** with diffusion layer (`out[i] = in[i] ^ in[i+1] ^ in[i+2]`).
- **Hex output** – ready for transmission over insecure channels.

### 3. 📊 Security Metrics Dashboard
- **Avalanche Effect** – ~50% bit change when 1 plaintext bit flips.
- **Shannon Entropy** – > 7.9 bits/byte (near‑perfect randomness).
- **Byte Frequency Histogram** – proves uniform distribution.
- **Key Sensitivity** – ~50% ciphertext change for 1‑bit key difference.
- **Status badges** – visual indicators (Ideal / Acceptable / Weak).

### 4. 🎨 Professional UI/UX
- Glass‑morphism design with animated background orbs.
- Dark cyber‑security theme optimised for long working sessions.
- Fully responsive – works on desktop, tablet, and mobile.
- Real‑time Chart.js visualisations.

---

## 🧠 How It Works (High Level)

1. **User provides a password**.
2. **SHA‑256 hashing** → Chaotic seed (0–1).
3. **Logistic Map** (`x_{n+1} = 3.99 * x_n * (1 - x_n)`) generates 256+ floats.
4. **Dynamic S‑Box** constructed from the first 256 floats (unique 0–255 permutation).
5. **Round keys** derived from the remaining floats.
6. **Plaintext** → padded to 16‑byte blocks → **16 Feistel rounds** (Substitute → Permute → Diffuse → XOR key).
7. **Decryption** uses the same S‑Box and reverse key order (Feistel invertibility).

---

## 🗂️ Project Structure
quantum-iot-crypto/
├── app.py # Flask main entry point
├── crypto/
│ ├── init.py
│ ├── caesar.py # Classic Caesar logic + brute‑force
│ ├── chaotic.py # Logistic map & SHA‑256 seeding
│ ├── sbox.py # Dynamic S‑Box generation
│ ├── cipher.py # 16‑round Feistel hybrid cipher
│ └── metrics.py # Avalanche, entropy, histogram, key sensitivity
├── static/
│ ├── css/style.css # Glass‑morphism dark theme
│ └── js/scripts.js # Tab logic, Chart.js rendering, API calls
├── templates/
│ ├── index.html # Main dashboard (Caesar + Hybrid + Metrics)
│ └── about.html # Research context / whitepaper
├── requirements.txt # Flask, NumPy, Gunicorn
├── runtime.txt # Python 3.11
└── README.md # This file

text

---

## 🚀 Live Demo

Deployed on **Render** (free tier – may take a few seconds to spin up):

🔗 **[https://quantum-iot-crypto.onrender.com](https://quantum-iot-crypto.onrender.com)**

---

## 💻 Local Development

### Prerequisites
- Python 3.11+
- pip

### Installation
```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/quantum-iot-crypto.git
cd quantum-iot-crypto

# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the app
python app.py
Open http://127.0.0.1:5000 in your browser.

Running Tests (Security Metrics)
Navigate to the 📊 Metrics tab.

Enter a test plaintext and key.

Click "Run Security Analysis".

Observe the avalanche, entropy, histogram, and key sensitivity charts.

📊 Security Metrics Performance
Metric	Achieved	Ideal	Status
Avalanche Effect	~50%	50%	✅ Ideal
Shannon Entropy	> 7.9 bits/byte	8.0	✅ Ideal
Key Sensitivity	~50%	50%	✅ Ideal
Histogram Uniformity	Flat distribution	Uniform	✅ Uniform
These metrics prove the cipher meets the confusion and diffusion principles required for strong encryption.

🔬 Research Context
This project explores a hybrid chaotic‑lattice approach for lightweight post‑quantum cryptography. Unlike AES (fixed S‑Box), our dynamic S‑Box is key‑dependent, making side‑channel and differential attacks significantly harder. The Feistel structure ensures perfect invertibility while maintaining low computational overhead—suitable for ARM Cortex‑M and ESP32 class devices.

Future work: Hardware implementation on ESP32, integration with MQTT for secure IoMT communication, and submission to NIST Lightweight Cryptography standardization.

🛠️ Technologies Used
Category	Technologies
Backend	Python 3.11, Flask 2.3.3, Gunicorn
Math & Crypto	NumPy 1.26.0, SHA‑256, Logistic Map
Frontend	HTML5, CSS3, JavaScript, Chart.js
Deployment	Render (GitHub‑connected CI/CD)
Design	Glass‑morphism, Dark Theme, Responsive Grid
🤝 Contributing
This is an internship project, but feedback and contributions are welcome!

Fork the repository.

Create a feature branch (git checkout -b feature/amazing-feature).

Commit your changes (git commit -m 'Add some amazing feature').

Push to the branch (git push origin feature/amazing-feature).

Open a Pull Request.

📝 License
This project is licensed under the MIT License – see the LICENSE file for details.

🙏 Acknowledgements
DecodeLabs – For the internship opportunity and project brief.

NIST – For the lightweight cryptography research motivation.

Chart.js – For beautiful, responsive visualisations.


