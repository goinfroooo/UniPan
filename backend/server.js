const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'blocs.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = 'change_this_secret'; // À mettre en variable d'env en prod
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Charger les blocs depuis le fichier
function loadBlocs() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Sauvegarder les blocs dans le fichier
function saveBlocs(blocs) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(blocs, null, 2), 'utf-8');
}

// Charger les utilisateurs depuis le fichier
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Sauvegarder les utilisateurs dans le fichier
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

// Modèle Bloc MongoDB
const blocSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  holds: {
    type: [
      {
        num: Number,
        type: String, // 'S', 'F', 'M', 'P'
      },
    ],
    required: true,
  },
  grade: { type: String, default: '' },
  ratings: {
    type: [
      {
        userId: String,
        rating: Number,
      },
    ],
    default: [],
  },
});
const Bloc = mongoose.model('Bloc', blocSchema);

// Récupérer tous les blocs
app.get('/api/blocs', async (req, res) => {
  try {
    const blocs = await Bloc.find();
    res.json(blocs);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un bloc par id
app.get('/api/blocs/:id', async (req, res) => {
  try {
    const bloc = await Bloc.findById(req.params.id);
    if (!bloc) return res.status(404).json({ error: 'Bloc non trouvé' });
    res.json(bloc);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un nouveau bloc
app.post('/api/blocs', async (req, res) => {
  const { name, description, holds, grade } = req.body;
  if (!name || !Array.isArray(holds) || holds.length === 0) {
    return res.status(400).json({ error: 'Nom et prises obligatoires' });
  }
  try {
    // Vérification du format des prises
    for (const h of holds) {
      if (typeof h.num !== 'number' || !['S','F','M','P'].includes(h.type)) {
        return res.status(400).json({ error: 'Format de prise invalide' });
      }
    }
    const bloc = new Bloc({ name, description: description || '', holds, grade: grade || '', ratings: [] });
    await bloc.save();
    res.status(201).json(bloc);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Token manquant' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

// Inscription (le premier utilisateur devient admin)
app.post('/api/register', async (req, res) => {
  const { email, password, consent, pseudo, avatar } = req.body;
  if (!email || !password || consent !== true || !pseudo) {
    return res.status(400).json({ error: 'Email, mot de passe, pseudo et consentement requis' });
  }
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Utilisateur déjà existant' });
    }
    const hash = await bcrypt.hash(password, 10);
    const isFirst = (await User.countDocuments()) === 0;
    const user = new User({
      email,
      password: hash,
      pseudo,
      avatar: avatar || '',
      role: isFirst ? 'admin' : 'user',
    });
    await user.save();
    res.status(201).json({ message: 'Compte créé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Connexion (retourne aussi le rôle, le pseudo et l'avatar)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, role: user.role, pseudo: user.pseudo, avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Infos utilisateur (authentifié)
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      favorites: user.favorites || [],
      pseudo: user.pseudo || '',
      avatar: user.avatar || '',
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mise à jour du profil utilisateur (pseudo et avatar)
app.patch('/api/me', authMiddleware, async (req, res) => {
  const { pseudo, avatar } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    if (pseudo) user.pseudo = pseudo;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();
    res.json({ message: 'Profil mis à jour', pseudo: user.pseudo, avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Suppression de compte (droit à l'oubli)
app.delete('/api/me', authMiddleware, (req, res) => {
  let users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  users = users.filter(u => u.id !== req.user.id);
  saveUsers(users);
  res.json({ message: 'Compte supprimé' });
});

// Export des données personnelles
app.get('/api/me/export', authMiddleware, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  // RGPD : on ne retourne que les infos nécessaires
  res.json({ id: user.id, email: user.email });
});

// Suppression de bloc (admin uniquement)
app.delete('/api/blocs/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Droits administrateur requis' });
    }
    const bloc = await Bloc.findById(req.params.id);
    if (!bloc) return res.status(404).json({ error: 'Bloc non trouvé' });
    await bloc.deleteOne();
    res.json({ message: 'Bloc supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Favoris : ajouter un bloc aux favoris
app.post('/api/me/favorites', authMiddleware, (req, res) => {
  const { blocId } = req.body;
  if (!blocId) return res.status(400).json({ error: 'blocId requis' });
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  if (!user.favorites) user.favorites = [];
  if (!user.favorites.includes(blocId)) user.favorites.push(blocId);
  saveUsers(users);
  res.json({ favorites: user.favorites });
});

// Favoris : retirer un bloc des favoris
app.delete('/api/me/favorites/:blocId', authMiddleware, (req, res) => {
  const blocId = req.params.blocId;
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  if (!user.favorites) user.favorites = [];
  user.favorites = user.favorites.filter(id => id !== blocId);
  saveUsers(users);
  res.json({ favorites: user.favorites });
});

// Favoris : liste des blocs favoris
app.get('/api/me/favorites', authMiddleware, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json({ favorites: user.favorites || [] });
});

// Noter un bloc (1 à 5 étoiles, un vote par utilisateur)
app.post('/api/blocs/:id/rate', authMiddleware, (req, res) => {
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Note invalide' });
  }
  const blocs = loadBlocs();
  const bloc = blocs.find(b => b.id === req.params.id);
  if (!bloc) return res.status(404).json({ error: 'Bloc non trouvé' });
  if (!bloc.ratings) bloc.ratings = [];
  // Un seul vote par utilisateur
  const existing = bloc.ratings.find(r => r.userId === req.user.id);
  if (existing) {
    existing.rating = rating;
  } else {
    bloc.ratings.push({ userId: req.user.id, rating });
  }
  saveBlocs(blocs);
  res.json({ message: 'Note enregistrée', ratings: bloc.ratings });
});

// Récupérer la moyenne des notes d'un bloc
app.get('/api/blocs/:id/ratings', (req, res) => {
  const blocs = loadBlocs();
  const bloc = blocs.find(b => b.id === req.params.id);
  if (!bloc) return res.status(404).json({ error: 'Bloc non trouvé' });
  if (!bloc.ratings || bloc.ratings.length === 0) {
    return res.json({ average: null, count: 0 });
  }
  const sum = bloc.ratings.reduce((acc, r) => acc + r.rating, 0);
  const avg = sum / bloc.ratings.length;
  res.json({ average: avg, count: bloc.ratings.length });
});

// Ajouter ou mettre à jour une ascension (tentative ou réussite)
app.post('/api/me/ascents', authMiddleware, (req, res) => {
  const { blocId, status, attempts } = req.body; // status: 'sent' ou 'tried', attempts: nombre d'essais
  if (!blocId || !['sent', 'tried'].includes(status)) {
    return res.status(400).json({ error: 'blocId et status requis' });
  }
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  if (!user.ascents) user.ascents = [];
  const existing = user.ascents.find(a => a.blocId === blocId);
  if (existing) {
    existing.status = status;
    existing.attempts = attempts || 1;
  } else {
    user.ascents.push({ blocId, status, attempts: attempts || 1 });
  }
  saveUsers(users);
  res.json({ ascents: user.ascents });
});

// Récupérer la liste des ascensions de l'utilisateur
app.get('/api/me/ascents', authMiddleware, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json({ ascents: user.ascents || [] });
});

// Supprimer une ascension
app.delete('/api/me/ascents/:blocId', authMiddleware, (req, res) => {
  const blocId = req.params.blocId;
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  if (!user.ascents) user.ascents = [];
  user.ascents = user.ascents.filter(a => a.blocId !== blocId);
  saveUsers(users);
  res.json({ ascents: user.ascents });
});

// Exposer le dossier uploads en statique
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload d'image de profil
app.post('/api/upload/avatar', authMiddleware, upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier envoyé' });
  }
  // Retourner l'URL d'accès à l'image
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/unipan', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  pseudo: { type: String, required: true },
  avatar: { type: String, default: '' },
  role: { type: String, default: 'user' },
  favorites: { type: [String], default: [] },
  ascents: {
    type: [
      {
        blocId: String,
        status: String, // 'sent' ou 'tried'
        attempts: Number,
      },
    ],
    default: [],
  },
});

const User = mongoose.model('User', userSchema);

app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur http://localhost:${PORT}`);
}); 