const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'blocs.json');

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

// Récupérer tous les blocs
app.get('/api/blocs', (req, res) => {
  const blocs = loadBlocs();
  res.json(blocs);
});

// Récupérer un bloc par id
app.get('/api/blocs/:id', (req, res) => {
  const blocs = loadBlocs();
  const bloc = blocs.find(b => b.id === req.params.id);
  if (!bloc) return res.status(404).json({ error: 'Bloc non trouvé' });
  res.json(bloc);
});

// Créer un nouveau bloc
app.post('/api/blocs', (req, res) => {
  const { name, description, holds } = req.body;
  if (!name || !Array.isArray(holds)) {
    return res.status(400).json({ error: 'Nom et prises obligatoires' });
  }
  const blocs = loadBlocs();
  const id = Date.now().toString();
  const bloc = { id, name, description: description || '', holds };
  blocs.push(bloc);
  saveBlocs(blocs);
  res.status(201).json(bloc);
});

app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur http://localhost:${PORT}`);
}); 