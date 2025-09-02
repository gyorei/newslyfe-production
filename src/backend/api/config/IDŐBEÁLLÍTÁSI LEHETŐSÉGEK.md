## 🕒 **HÍREK FRISSESÉGE - IDŐBEÁLLÍTÁSI LEHETŐSÉGEK**

A mostani implementációban a **`maxAgeHours`** paraméterrel tudsz időt beállítani!

### **📋 JELENLEGI BEÁLLÍTÁSOK:**

**🎯 Alapértelmezett:** `24 óra` (1 nap)

**⚙️ Választható tartomány:** `1-168 óra` (1 óra - 7 nap)

### **💡 GYAKORLATI PÉLDÁK:**

**⚡ Friss hírek:**

- `maxAgeHours=1` → Csak az elmúlt 1 óra hírei
- `maxAgeHours=6` → Elmúlt 6 óra hírei
- `maxAgeHours=12` → Elmúlt fél nap hírei

**📅 Normál használat:**

- `maxAgeHours=24` → Elmúlt 1 nap hírei (alapértelmezett)
- `maxAgeHours=48` → Elmúlt 2 nap hírei
- `maxAgeHours=72` → Elmúlt 3 nap hírei

**📰 Archív tartalom:**

- `maxAgeHours=120` → Elmúlt 5 nap hírei
- `maxAgeHours=168` → Elmúlt 1 hét hírei (maximum)

### **🎮 HASZNÁLAT:**

```bash
# Csak friss hírek (6 óra)
GET /api/local/news?maxAgeHours=6

# Standard (1 nap) - alapértelmezett
GET /api/local/news

# Hosszabb időszak (3 nap)
GET /api/local/news?maxAgeHours=72
```

### **🔧 VALIDÁLÁS:**

- ❌ **0 alatti értékek** → automatikusan 24 óra
- ❌ **168 feletti értékek** → automatikusan 168 óra (1 hét)
- ❌ **Nem szám értékek** → automatikusan 24 óra

### **📊 METAADATOK:**

A válaszban mindig megkapod:

- `maxAgeHours` - használt időszűrés
- `originalTotal` - összes hír szűrés előtt
- `filteredOutCount` - kiszűrt hírek száma
- `cutoffTimestamp` - határidő timestamp

**Szóval órákban tudsz gondolkozni, 1 órától 1 hétig!** ⏰✨
