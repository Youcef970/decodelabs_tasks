from flask import Flask, render_template, request, jsonify
from analyzer import analyze_password
from generator import generate_strong_password
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    password = data.get('password', '')
    result = analyze_password(password)
    return jsonify(result)

@app.route('/generate', methods=['GET'])
def generate():
    password = generate_strong_password(18)
    return jsonify({'password': password})

# THIS IS THE IMPORTANT PART — FIXED FOR RENDER
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)