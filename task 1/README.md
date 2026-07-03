# 🔐 Password Strength Analyzer Pro

A professional password strength checker with entropy calculation, real-time breach detection, and a modern user interface.

## 🎯 Features

- **Real-time password strength analysis** - Updates as you type
- **Entropy calculation** - Information theory-based strength measurement
- **Breach detection** - Checks against 10B+ leaked passwords via HIBP API (k-Anonymity)
- **Password generator** - Cryptographically secure random passwords
- **Clipboard safety** - Auto-clears clipboard after 15 seconds
- **Crack time estimation** - How long to brute force
- **Modern GUI** - Dark mode, professional design

## 🛠️ Tech Stack

- Python 3.8+
- CustomTkinter / Tkinter (modern GUI)
- Requests (API calls)
- HIBP API (breach checking)


# Project 1 Reflection: Password Strength Analyzer

## What I Built
A full-stack web application that analyzes password strength using entropy calculation, real-time breach detection via Have I Been Pwned API, and provides actionable feedback.

## The Hardest Part
Understanding k-Anonymity. Initially, I wanted to send the full password hash to HIBP, but that would defeat privacy. Learning how partial hash matching works (send first 5 chars only, match locally) was a "wow" moment for real-world security.

## What Went Wrong
The API rate limits. HIBP returns 500+ hashes for each prefix, and my first implementation parsed it inefficiently. I optimized by using set() for O(1) lookup instead of list iteration.

## What I Would Improve
1. Add zxcvbn library for dictionary attack simulation
2. Implement password strength history with charts
3. Add a "leaked password alert" browser extension

## One Thing That Surprised Me
"Tr0ub4dor&3" (52 bits) is weaker than "correct horse battery staple" (80 bits) even though the first looks "complex". Humans are bad at entropy.

## How This Changed My Thinking
I used to think adding "!" and numbers made passwords strong. Now I understand length > complexity, and avoiding common patterns matters more than forcing special characters.

## Link to Live Demo
https://password-strength-analyzer-1-m8dr.onrender.com/

## Link to GitHub
https://github.com/Youcef970/password-strength-analyzer.git

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Youcef970/password-strength-analyzer.git

# Navigate to project
cd password-strength-analyzer

# Install dependencies
pip install requests customtkinter

# Run the application
python main.py
