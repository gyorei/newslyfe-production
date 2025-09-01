

/*
import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import process from 'process';
import { fileURLToPath } from 'url';

// ES6 modulokban a __filename és __dirname nem elérhető alapértelmezetten
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Config importálása - ezt valószínűleg JSON fájlból kell importálni
// Ha config.json, akkor így:
import configData from '../config/config.json' assert { type: 'json' };
const config = configData[env];

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Biztonságos fájlnév ellenőrzése
function isSafeFilename(filename) {
  // Szigorú ellenőrzés - csak alfanumerikus karakterek, kötőjel, aláhúzás
  const safePattern = /^[a-zA-Z0-9_-]+\.js$/;
  const hasPathTraversal = filename.includes('..') || 
                          filename.includes('/') || 
                          filename.includes('\\');
  const isReasonableLength = filename.length < 100;
  const isNotBasename = filename !== basename;
  const isNotTestFile = !filename.includes('.test.js');
  const isNotHiddenFile = !filename.startsWith('.');
  
  return safePattern.test(filename) && 
         !hasPathTraversal &&
         isReasonableLength &&
         isNotBasename &&
         isNotTestFile &&
         isNotHiddenFile;
}

const files = fs.readdirSync(__dirname);

for (const file of files) {
  if (file.slice(-3) === '.js' && isSafeFilename(file)) {
    try {
      // Dinamikus import ES6 modulokhoz
      const modelModule = await import(path.join(__dirname, file));
      const model = modelModule.default(sequelize, DataTypes);
      db[model.name] = model;
    } catch (error) {
      // Biztonságos logging - file név nem interpolálva
      console.error('Hiba a modell betöltésekor:', { filename: file, error: error.message });
    }
  }
}

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
*/

/*
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
*/