// controllers/diseaseController.js
const Disease = require('../models/Disease');
const Plant = require('../models/Plant');
const { sequelize } = require('../config/database');
const { translateText } = require('../services/translationService');

// Get all diseases with optional filters
exports.getAllDiseases = async (req, res) => {
  try {
    const { plant_id, severity, language } = req.query;
    
    let whereClause = {};
    if (severity) {
      whereClause.severity_level = severity;
    }

    const diseases = await Disease.findAll({
      where: whereClause,
      include: plant_id ? [{
        model: Plant,
        where: { plant_id },
        through: { attributes: [] }
      }] : [],
      order: [['disease_name', 'ASC']]
    });

    // Translate if language is specified and not English
    let translatedDiseases = diseases;
    if (language && language !== 'en') {
      translatedDiseases = await Promise.all(
        diseases.map(async (disease) => {
          const diseaseObj = disease.toJSON();
          diseaseObj.disease_name = await translateText(diseaseObj.disease_name, language);
          diseaseObj.description = await translateText(diseaseObj.description, language);
          diseaseObj.symptoms = await translateText(diseaseObj.symptoms, language);
          diseaseObj.treatment = await translateText(diseaseObj.treatment, language);
          return diseaseObj;
        })
      );
    }

    res.json({
      success: true,
      count: diseases.length,
      data: translatedDiseases
    });
  } catch (error) {
    console.error('Get diseases error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching diseases'
    });
  }
};

// Get disease by ID
exports.getDiseaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const { language } = req.query;

    const disease = await Disease.findByPk(id, {
      include: [{
        model: Plant,
        through: { attributes: [] }
      }]
    });

    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found'
      });
    }

    let result = disease.toJSON();

    // Translate if needed
    if (language && language !== 'en') {
      result.disease_name = await translateText(result.disease_name, language);
      result.description = await translateText(result.description, language);
      result.symptoms = await translateText(result.symptoms, language);
      result.treatment = await translateText(result.treatment, language);
      result.prevention = await translateText(result.prevention, language);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get disease error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching disease'
    });
  }
};

// Get treatment suggestions
exports.getTreatmentSuggestions = async (req, res) => {
  try {
    const { disease_id, language } = req.query;

    const disease = await Disease.findByPk(disease_id, {
      attributes: ['treatment', 'prevention', 'disease_name']
    });

    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found'
      });
    }

    let treatment = disease.treatment;
    let prevention = disease.prevention;

    // Translate if needed
    if (language && language !== 'en') {
      treatment = await translateText(treatment, language);
      prevention = await translateText(prevention, language);
    }

    res.json({
      success: true,
      data: {
        disease_name: disease.disease_name,
        treatment,
        prevention,
        organic_options: [
          'Neem oil spray',
          'Garlic extract',
          'Baking soda solution'
        ],
        chemical_options: treatment.split(',').map(t => t.trim())
      }
    });
  } catch (error) {
    console.error('Treatment suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching treatment suggestions'
    });
  }
};