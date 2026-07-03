# 🛡️ PhishGuard

> A heuristic-based phishing detection platform that analyzes suspicious URLs, emails, and webpages using explainable security rules instead of black-box AI.

PhishGuard was developed as **Project 3** during the **DecodeLabs Cyber Security Industrial Training Program (Batch 2026)**. The project focuses on building an explainable phishing detection system that helps users identify phishing attacks while understanding *why* a message or website is considered malicious.

Unlike machine learning solutions that require large datasets and expensive infrastructure, PhishGuard relies on multiple rule-based detection engines that work together to produce a transparent and reliable security verdict.

---

## Live Demo

🌐 **Try PhishGuard Online**

https://phishguard--youcefkacef5.replit.app

---

## GitHub Repository

https://github.com/Youcef970/phishguard

---

# Overview

PhishGuard combines multiple heuristic detection engines into a single phishing analysis platform.

The system analyzes:

- Suspicious URLs
- Email content
- Social engineering indicators
- Visual brand impersonation

The results from each engine are combined into a weighted risk score that classifies content as:

- ✅ SAFE
- ⚠️ SUSPICIOUS
- 🚨 PHISHING

Because every decision is based on explicit security rules, users can understand exactly why a threat was detected.

---

# Features

## URL Forensics

Detects:

- Suspicious Top-Level Domains
- IP-based URLs
- IDN Homograph attacks
- High-entropy domains
- Brand impersonation in subdomains
- Redirect parameters
- Suspicious URL patterns

---

## Context Analysis

Analyzes message content for common phishing techniques such as:

- Urgency language
- Threat language
- Authority impersonation
- Credential requests
- Sensitive information requests
- Secrecy requests
- Generic greetings
- Suspicious URLs inside email bodies

---

## Visual Brand Detection

Uses Perceptual Hashing (pHash) to identify cloned login pages and brand impersonation attempts.

Current implementation includes placeholder fingerprints that can easily be replaced with real production hashes.

---

## Adaptive Risk Scoring

Combines all available detection engines into a weighted risk score.

Final verdicts:

- SAFE
- SUSPICIOUS
- PHISHING

The scoring engine automatically redistributes weights whenever one detection engine is unavailable.

---

## Browser Extension

Manifest V3 Chrome Extension capable of:

- Scanning visited websites
- Displaying phishing risk
- Showing floating page indicators
- Reporting suspicious URLs

---

## Interactive Dashboard

The React dashboard includes:

- URL & Email Analyzer
- Training Simulator
- Detection History
- Session Statistics
- Threat Reports

---

## Security Awareness Training

Includes an interactive phishing simulator where users identify phishing red flags and receive immediate feedback.

---

# Technologies

## Backend

- Python 3.11
- FastAPI
- Pillow
- imagehash

---

## Frontend

- React
- Vite
- TailwindCSS

---

## Browser

- Chrome Extension (Manifest V3)

---

## Development

- Git
- GitHub
- Replit

---

# System Architecture

```
                     User
                       │
                       ▼
              React Dashboard
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
Chrome Extension                FastAPI API
                                      │
        ┌──────────────┬──────────────┴─────────────┐
        ▼              ▼                            ▼
 URL Analyzer   Context Analyzer          Visual Matcher
        └──────────────┬────────────────────────────┘
                       ▼
                 Risk Scorer Engine
                       ▼
                Final Security Verdict
```

---

# Detection Pipeline

```
User Input

      │

      ▼

URL Analysis

      │

      ▼

Context Analysis

      │

      ▼

Visual Matching

      │

      ▼

Risk Scoring

      │

      ▼

SAFE
SUSPICIOUS
PHISHING
```

---

# Project Structure

```
phishguard/
├── backend/
│   ├── api/
│   ├── core/
│   ├── data/
│   ├── utils/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── extension/
│   ├── manifest.json
│   ├── popup.js
│   ├── background.js
│   ├── content.js
│   └── assets/
```

---

# Running Locally

## Backend

Requires Python 3.11+

```bash
cd backend

pip install -r requirements.txt

python main.py
```

Backend:

```
http://localhost:8000
```

Swagger Documentation:

```
http://localhost:8000/api/docs
```

---

## Frontend

Requires Node.js 20+

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```
http://localhost:3000
```

---

# Running with Docker

```bash
docker-compose up --build
```

Backend

```
http://localhost:8000
```

Frontend

```
http://localhost:3000
```

---

# Browser Extension

The Chrome Extension communicates directly with the FastAPI backend.

To install:

1. Start the backend server.

2. Open

```
chrome://extensions
```

3. Enable **Developer Mode**

4. Click

```
Load unpacked
```

5. Select the **extension/** folder.

The extension automatically scans visited pages and displays phishing indicators.

---

# API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/v1/analyze` | Analyze URLs and email content |
| POST | `/api/v1/analyze/quick` | URL-only analysis |
| GET | `/api/v1/training/samples` | Retrieve phishing training samples |
| POST | `/api/v1/training/validate` | Validate training answers |
| GET | `/api/v1/stats` | Session statistics |
| POST / GET | `/api/v1/report` | Report suspicious URLs |
| GET | `/api/v1/blacklist` | Known malicious domains |

---

# What Works

The following components are fully functional:

- URL heuristic analysis
- Context analysis
- Risk scoring
- React Dashboard
- Chrome Extension
- Training Simulator
- REST API
- Statistics Dashboard

---

# Current Limitations

The project is intended for educational purposes and does not yet include:

- Persistent database
- User authentication
- Threat intelligence feeds
- WHOIS lookups
- VirusTotal integration
- Production brand fingerprint database

The visual matching engine currently uses placeholder perceptual hashes and can be extended with real brand fingerprints.

---

# Future Improvements

Planned enhancements include:

- Machine Learning hybrid detection
- VirusTotal API integration
- WHOIS intelligence
- OCR screenshot analysis
- Email header analysis
- Persistent PostgreSQL database
- User authentication
- Threat intelligence feeds
- SIEM integration
- Multi-user dashboard
- Real-time notifications

---

# Learning Outcomes

This project strengthened my understanding of:

- Cybersecurity
- Phishing detection
- Social engineering
- URL forensics
- Browser extension development
- FastAPI
- React
- REST API design
- Security-focused software architecture
- Perceptual hashing
- Risk scoring algorithms
- Full-stack development

---

# Disclaimer

This project was developed for educational purposes as part of the DecodeLabs Cyber Security Industrial Training Program.

It is not intended to replace enterprise phishing detection platforms but rather demonstrates the implementation of explainable heuristic-based phishing detection techniques.

---

# Author

**Youcef Kaced**

Master's Student in Cybersecurity & AI Enthusiast

GitHub

https://github.com/Youcef970

LinkedIn

https://www.linkedin.com/in/youcef-kaced/

---

If you find this project interesting, feel free to ⭐ the repository and share your feedback or suggestions!
