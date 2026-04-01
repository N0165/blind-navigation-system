# Password Strength Checker & Cracker Demo (GUI Version)
# ======================================================
# This version includes a graphical user interface using tkinter

import re
import hashlib
import itertools
import string
import time
import tkinter as tk
from tkinter import messagebox

# ==============================
# PASSWORD STRENGTH CHECKER
# ==============================

def check_password_strength(password):
    score = 0
    feedback = []

    if len(password) >= 12:
        score += 2
    elif len(password) >= 8:
        score += 1
    else:
        feedback.append("At least 8 characters required")

    if re.search(r"[A-Z]", password):
        score += 1
    else:
        feedback.append("Add uppercase letter")

    if re.search(r"[a-z]", password):
        score += 1
    else:
        feedback.append("Add lowercase letter")

    if re.search(r"[0-9]", password):
        score += 1
    else:
        feedback.append("Add number")

    if re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        score += 2
    else:
        feedback.append("Add special character")

    if score >= 6:
        strength = "Strong"
    elif score >= 4:
        strength = "Medium"
    else:
        strength = "Weak"

    return strength, feedback

# ==============================
# HASH FUNCTION
# ==============================

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# ==============================
# DICTIONARY ATTACK
# ==============================

def dictionary_attack(hash_target):
    try:
        with open("wordlist.txt", "r") as f:
            words = f.readlines()
    except:
        words = ["123456", "password", "admin", "admin123"]

    for word in words:
        word = word.strip()
        if hash_password(word) == hash_target:
            return word
    return None

# ==============================
# BRUTE FORCE (LIMITED)
# ==============================

def brute_force_attack(hash_target, max_length=3):
    chars = string.ascii_lowercase + string.digits
    for length in range(1, max_length + 1):
        for attempt in itertools.product(chars, repeat=length):
            attempt = ''.join(attempt)
            if hash_password(attempt) == hash_target:
                return attempt
    return None

# ==============================
# GUI FUNCTIONS
# ==============================

def analyze_password():
    password = entry.get()

    if not password:
        messagebox.showwarning("Warning", "Please enter a password")
        return

    strength, feedback = check_password_strength(password)
    result_label.config(text=f"Strength: {strength}")

    feedback_text.delete("1.0", tk.END)
    for f in feedback:
        feedback_text.insert(tk.END, f"- {f}\n")

    hashed = hash_password(password)
    hash_label.config(text=f"Hash: {hashed[:30]}...")

    # Try attacks
    dict_result = dictionary_attack(hashed)
    brute_result = brute_force_attack(hashed)

    if dict_result:
        crack_label.config(text=f"Dictionary cracked: {dict_result}")
    elif brute_result:
        crack_label.config(text=f"Brute force cracked: {brute_result}")
    else:
        crack_label.config(text="Password not cracked")

# ==============================
# GUI SETUP
# ==============================

root = tk.Tk()
root.title("Password Security Tool")
root.geometry("500x500")

# Title
label = tk.Label(root, text="Password Strength Checker", font=("Arial", 16))
label.pack(pady=10)

# Entry
entry = tk.Entry(root, width=30, show="*")
entry.pack(pady=10)

# Button
btn = tk.Button(root, text="Analyze", command=analyze_password)
btn.pack(pady=10)

# Result
result_label = tk.Label(root, text="Strength: ")
result_label.pack(pady=5)

# Feedback box
feedback_text = tk.Text(root, height=5, width=50)
feedback_text.pack(pady=10)

# Hash display
hash_label = tk.Label(root, text="Hash: ")
hash_label.pack(pady=5)

# Crack result
crack_label = tk.Label(root, text="Crack Result: ")
crack_label.pack(pady=10)

# Run
root.mainloop()