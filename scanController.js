// controllers/scanController.js
const UserScan = require('../models/Scan');
const Disease = require('../models/Disease');
const Plant = require('../models/Plant');
const { analyzeImage } = require('../services/mlService');
const { uploadToCloudinary } = require('../config/cloudinary');
const { translateText } = require('../services/translationService');
const { generateSpeech } = require('../services/ttsService');

// Upload and analyze leaf image
exports.analyzeLeaf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded'
      });
    }

    const { language = 'en' } = req.body;

    // Upload image to cloud storage
    const imageUrl = await uploadToCloudinary(req.file.path);

    // Analyze image with ML model
    const analysisResult = await analyzeImage(req.file.path);

    // Get disease details from database
    const disease = await Disease.findByPk(analysisResult.disease_id);
    
    // Get affected plants
    const plants = await disease.getPlants();

    // Create scan record
    const scan = await UserScan.create({
      user_id: req.user ? req.user.id : null,
      plant_id: plants[0]?.plant_id,
      disease_id: analysisResult.disease_id,
      image_url: imageUrl,
      confidence_score: analysisResult.confidence,
      severity_detected: analysisResult.severity,
      notes: analysisResult.notes
    });

    // Prepare response
    let response = {
      success: true,
      scan_id: scan.scan_id,
      disease: {
        id: disease.disease_id,
        name: disease.disease_name,
        confidence: analysisResult.confidence,
        severity: analysisResult.severity,
        description: disease.description,
        symptoms: disease.symptoms,
        treatment: disease.treatment
      },
      affected_plants: plants.map(p => p.plant_name),
      image_url: imageUrl
    };

    // Translate if needed
    if (language !== 'en') {
      response.disease.name = await translateText(disease.disease_name, language);
      response.disease.description = await translateText(disease.description, language);
      response.disease.symptoms = await translateText(disease.symptoms, language);
      response.disease.treatment = await translateText(disease.treatment, language);
    }

    // Generate audio if requested
    if (req.query.audio === 'true') {
      const audioUrl = await generateSpeech(
        `Detected ${response.disease.name} with ${response.disease.confidence}% confidence. ${response.disease.treatment}`,
        language
      );
      response.audio_url = audioUrl;
    }

    res.json(response);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing image'
    });
  }
};

// Get user's scan history
exports.getScanHistory = async (req, res) => {
  try {
    const scans = await UserScan.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Disease, attributes: ['disease_name', 'severity_level'] },
        { model: Plant, attributes: ['plant_name'] }
      ],
      order: [['scan_date', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      count: scans.length,
      data: scans
    });
  } catch (error) {
    console.error('Scan history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scan history'
    });
  }
};

// Get disease statistics for pie chart
exports.getDiseaseStatistics = async (req, res) => {
  try {
    const { user_id, timeframe = 'month' } = req.query;

    let dateFilter = {};
    const now = new Date();
    
    if (timeframe === 'week') {
      dateFilter = {
        scan_date: {
          [sequelize.Op.gte]: new Date(now.setDate(now.getDate() - 7))
        }
      };
    } else if (timeframe === 'month') {
      dateFilter = {
        scan_date: {
          [sequelize.Op.gte]: new Date(now.setMonth(now.getMonth() - 1))
        }
      };
    }

    const whereClause = user_id ? { user_id, ...dateFilter } : dateFilter;

    const statistics = await UserScan.findAll({
      where: whereClause,
      include: [{
        model: Disease,
        attributes: ['disease_name']
      }],
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('scan_id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('confidence_score')), 'avg_confidence']
      ],
      group: ['disease_id', 'Disease.disease_id'],
      order: [[sequelize.fn('COUNT', sequelize.col('scan_id')), 'DESC']]
    });

    // Format for pie chart
    const pieChartData = {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ]
      }]
    };

    statistics.forEach(stat => {
      pieChartData.labels.push(stat.Disease.disease_name);
      pieChartData.datasets[0].data.push(parseInt(stat.dataValues.count));
    });

    res.json({
      success: true,
      data: pieChartData
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
};