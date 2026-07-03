from flask import Flask, render_template, request, jsonify
import os
from crypto.cipher import encrypt, decrypt
from crypto.metrics import avalanche_effect, shannon_entropy, histogram_data, key_sensitivity_test

# NEW: Import Caesar module
from crypto.caesar import caesar_encrypt, caesar_decrypt, brute_force_caesar, caesar_shift_demo

app = Flask(__name__)
app.secret_key = os.urandom(24)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/about')
def about():
    return render_template('about.html')


@app.route('/encrypt', methods=['POST'])
def encrypt_route():
    data = request.get_json()
    plaintext = data.get('plaintext', '')
    password = data.get('password', 'default123')
    if not plaintext:
        return jsonify({'error': 'Plaintext is required'}), 400
    try:
        cipher_hex, sbox, round_keys = encrypt(plaintext, password)
        return jsonify({
            'success': True,
            'ciphertext': cipher_hex,
            'sbox': sbox[:16],
            'round_keys': [list(k) for k in round_keys]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/decrypt', methods=['POST'])
def decrypt_route():
    data = request.get_json()
    cipher_hex = data.get('ciphertext', '')
    password = data.get('password', 'default123')
    if not cipher_hex:
        return jsonify({'error': 'Ciphertext is required'}), 400
    try:
        plaintext = decrypt(cipher_hex, password)
        return jsonify({'success': True, 'plaintext': plaintext})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/metrics', methods=['POST'])
def metrics_route():
    data = request.get_json()
    plaintext = data.get('plaintext', 'Default test message for avalanche analysis.')
    password = data.get('password', 'default123')
    
    if not plaintext:
        plaintext = 'Default test message for avalanche analysis.'

    # Default fallback values in case anything crashes
    default_av = {"avg_bit_changes": 0, "total_bits": 128, "percent": 0, "ideal": 50.0}
    default_ent = 0.0
    default_hist = {"counts": [0] * 256, "length": 0}
    default_ks = {"differing_bits": 0, "total_bits": 128, "percent": 0, "ideal": 50.0}

    try:
        # Encrypt to get ciphertext for entropy & histogram
        enc_hex, _, _ = encrypt(plaintext, password)
        
        # SECURITY FIX: Ensure enc_hex is valid
        if not enc_hex:
            raise ValueError("Encryption returned empty hex")
            
        cipher_bytes = bytes.fromhex(enc_hex)
        
        # Run all metrics (with individual try/except to isolate failures)
        try:
            av = avalanche_effect(plaintext, password, num_tests=10)
        except Exception as e:
            print(f"Avalanche error: {e}")
            av = default_av
        
        try:
            ent = shannon_entropy(cipher_bytes)
        except Exception as e:
            print(f"Entropy error: {e}")
            ent = default_ent
        
        try:
            hist = histogram_data(enc_hex)
        except Exception as e:
            print(f"Histogram error: {e}")
            hist = default_hist
        
        try:
            pwd2 = password + "a"
            ks = key_sensitivity_test(plaintext, password, pwd2)
        except Exception as e:
            print(f"Key sensitivity error: {e}")
            ks = default_ks
        
        return jsonify({
            'success': True,
            'avalanche': av,
            'entropy': ent,
            'histogram': hist,
            'key_sensitivity': ks,
            'ciphertext_preview': enc_hex[:64] + ('...' if len(enc_hex) > 64 else '')
        })
    
    except Exception as e:
        print(f"CRITICAL /metrics error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': f'Metrics engine error: {str(e)}',
            'avalanche': default_av,
            'entropy': default_ent,
            'histogram': default_hist,
            'key_sensitivity': default_ks
        }), 500


# ============ NEW CAESAR ROUTES ============

@app.route('/caesar/encrypt', methods=['POST'])
def caesar_encrypt_route():
    """Encrypt using Caesar cipher with shift."""
    data = request.get_json()
    plaintext = data.get('plaintext', '')
    shift = int(data.get('shift', 3)) % 26
    
    if not plaintext:
        return jsonify({'error': 'Plaintext is required'}), 400
    
    try:
        ciphertext = caesar_encrypt(plaintext, shift)
        return jsonify({
            'success': True,
            'ciphertext': ciphertext,
            'shift': shift
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/caesar/decrypt', methods=['POST'])
def caesar_decrypt_route():
    """Decrypt using Caesar cipher with shift."""
    data = request.get_json()
    ciphertext = data.get('ciphertext', '')
    shift = int(data.get('shift', 3)) % 26
    
    if not ciphertext:
        return jsonify({'error': 'Ciphertext is required'}), 400
    
    try:
        plaintext = caesar_decrypt(ciphertext, shift)
        return jsonify({
            'success': True,
            'plaintext': plaintext,
            'shift': shift
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/caesar/bruteforce', methods=['POST'])
def caesar_bruteforce_route():
    """Brute-force all 25 shifts to demonstrate weakness."""
    data = request.get_json()
    ciphertext = data.get('ciphertext', '')
    
    if not ciphertext:
        return jsonify({'error': 'Ciphertext is required'}), 400
    
    try:
        results = brute_force_caesar(ciphertext)
        return jsonify({
            'success': True,
            'results': results
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/caesar/demo', methods=['POST'])
def caesar_demo_route():
    """Show step-by-step shift logic for education."""
    data = request.get_json()
    plaintext = data.get('plaintext', '')
    shift = int(data.get('shift', 3)) % 26
    
    if not plaintext:
        return jsonify({'error': 'Plaintext is required'}), 400
    
    try:
        demo = caesar_shift_demo(plaintext, shift)
        return jsonify({
            'success': True,
            'steps': demo['steps'],
            'result': demo['result']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)