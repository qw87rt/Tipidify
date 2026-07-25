# Tipidify — Smart Money Tracker App 💰📱

Tipidify is a simple and intuitive mobile app built with **React Native + Expo** that helps users track their daily income and expenses, monitor their balance, and develop smarter saving habits.

Designed for everyday use, Tipidify makes it easy to manage your money anytime, anywhere.

---

## 🚀 Features

* Add income and expense records
* Automatic balance calculation
* Persistent local storage using AsyncStorage
* Clean and minimal interface
* Scrollable transaction list
* Fixed footer showing totals
* Optional delete mode with toggle
* Works offline

---

## 🛠 Tech Stack

* React Native
* Expo
* JavaScript
* AsyncStorage
* Expo EAS Build

---

## 📱 Screenshots

*(Add screenshots here)*

---

## 🔧 Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/tipidify.git
cd tipidify
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the app

```bash
npx expo start
```

Scan the QR code using **Expo Go** on your phone.

---

## 📦 Build for Production

Install EAS CLI:

```bash
npm install -g eas-cli
```

Login to Expo:

```bash
eas login
```

Configure build:

```bash
eas build:configure
```

Build Android App Bundle (AAB):

```bash
eas build -p android --profile production
```

---

## 📄 App Configuration

Edit `app.json`:

```json
{
  "expo": {
    "name": "Tipidify",
    "slug": "tipidify",
    "version": "1.0.0",
    "android": {
      "package": "com.jhunray.tipidify",
      "versionCode": 1
    }
  }
}
```

---

## 🔐 Privacy

Tipidify stores all data locally on the user's device using AsyncStorage.
No personal data is collected or uploaded to any server.

---

## 📜 License

MIT License

---

## 👨‍💻 Author

**Jhun Ray Omiping**
BSIT Graduate
📧 [jhunrayomiping@gmail.com](mailto:jhunrayomiping@gmail.com)
🌐 [https://jhunray.github.io/Portfolio](https://jhunray.github.io/Portfolio)

---

## ⭐ Support

If you like Tipidify, consider giving the project a star on GitHub ⭐

---
