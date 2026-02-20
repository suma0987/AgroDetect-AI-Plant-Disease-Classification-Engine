// API Configuration
const API_URL = 'http://localhost:8000';

// Global variables
let selectedFile = null;
let analysisResult = null;

// File upload handling
document.getElementById('fileInput').addEventListener('change', function(e) {
    if (e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
    }
});

// Drag and drop
const uploadArea = document.getElementById('uploadArea');
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.background = '#f0f8ff';
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.style.background = 'white';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.background = 'white';
    
    if (e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

uploadArea.addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please select an image file');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showError('File size must be less than 10MB');
        return;
    }
    
    selectedFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('imagePreview').src = e.target.result;
        document.getElementById('uploadCard').style.display = 'none';
        document.getElementById('previewCard').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function resetUpload() {
    selectedFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('uploadCard').style.display = 'block';
    document.getElementById('previewCard').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
}

async function analyzeImage() {
    if (!selectedFile) {
        showError('Please select an image first');
        return;
    }
    
    // Show loading
    document.getElementById('previewCard').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'block';
    
    // Animate progress bar
    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
        if (progress <= 90) {
            document.getElementById('progressFill').style.width = progress + '%';
        }
    }, 100);
    
    // Prepare form data
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
        // Call API
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            body: formData
        });
        
        clearInterval(interval);
        document.getElementById('progressFill').style.width = '100%';
        
        if (!response.ok) {
            throw new Error('Analysis failed');
        }
        
        const result = await response.json();
        
        // Small delay for smooth transition
        setTimeout(() => {
            displayResults(result);
        }, 500);
        
    } catch (error) {
        clearInterval(interval);
        showError('Error: ' + error.message);
        resetAll();
    }
}

function displayResults(result) {
    // Hide loading, show results
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'block';
    
    // Store result
    analysisResult = result.analysis;
    
    // Update source badge
    const sourceBadge = document.getElementById('sourceBadge');
    sourceBadge.textContent = result.source === 'deepseek_ai' ? '🤖 Powered by DeepSeek AI' : '⚡ Quick Analysis';
    sourceBadge.style.background = result.source === 'deepseek_ai' ? '#e3f2fd' : '#fff3e0';
    sourceBadge.style.color = result.source === 'deepseek_ai' ? '#1976d2' : '#f57c00';
    
    // Update UI with results
    document.getElementById('diseaseName').textContent = result.analysis.disease_name;
    document.getElementById('confidence').textContent = result.analysis.confidence + '%';
    document.getElementById('severityText').textContent = result.analysis.severity + ' Infection';
    document.getElementById('symptoms').textContent = result.analysis.symptoms;
    document.getElementById('chemicalTreatment').textContent = result.analysis.chemical_treatment;
    document.getElementById('organicTreatment').textContent = result.analysis.organic_treatment;
    document.getElementById('preventionTips').textContent = result.analysis.prevention_tips;
    
    // Style severity box
    const severityBox = document.getElementById('severityBox');
    severityBox.className = 'severity-box';
    if (result.analysis.severity.toLowerCase() === 'mild') {
        severityBox.style.background = 'rgba(76, 175, 80, 0.2)';
    } else if (result.analysis.severity.toLowerCase() === 'moderate') {
        severityBox.style.background = 'rgba(255, 152, 0, 0.2)';
    } else if (result.analysis.severity.toLowerCase() === 'severe') {
        severityBox.style.background = 'rgba(244, 67, 54, 0.2)';
    }
}

function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');
}

function downloadReport() {
    if (!analysisResult) return;
    
    const report = `
🌱 AGRODETECT AI - DISEASE ANALYSIS REPORT
===========================================
Date: ${new Date().toLocaleString()}
Source: ${document.getElementById('sourceBadge').textContent}

DISEASE INFORMATION
------------------
Disease: ${analysisResult.disease_name}
Confidence: ${analysisResult.confidence}%
Severity: ${analysisResult.severity}

SYMPTOMS
--------
${analysisResult.symptoms}

TREATMENT RECOMMENDATIONS
-------------------------
🧪 Chemical Treatment:
${analysisResult.chemical_treatment}

🌱 Organic Treatment:
${analysisResult.organic_treatment}

🛡️ Prevention Tips:
${analysisResult.prevention_tips}

---
Generated by AgroDetect AI - Powered by DeepSeek
    `;
    
    // Create download
    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrodetect-report-${Date.now()}.txt`;
    a.click();
}

function useSample(type) {
    // Mock function for demo
    let result;
    
    if (type === 'tomato') {
        result = {
            analysis: {
                disease_name: 'Tomato Late Blight',
                confidence: 94,
                severity: 'Severe',
                symptoms: 'Dark water-soaked lesions on leaves, white fungal growth on undersides, brown spots on stems',
                chemical_treatment: 'Apply copper-based fungicides (2g/L water) immediately. Repeat every 7-10 days. Use Mancozeb for severe cases.',
                organic_treatment: 'Apply neem oil spray (5ml/L water) with baking soda solution. Remove and destroy infected leaves.',
                prevention_tips: 'Ensure good air circulation, avoid overhead watering, use resistant varieties, practice crop rotation'
            },
            source: 'deepseek_ai'
        };
    } else if (type === 'potato') {
        result = {
            analysis: {
                disease_name: 'Potato Early Blight',
                confidence: 87,
                severity: 'Moderate',
                symptoms: 'Dark concentric rings on lower leaves, yellowing around spots, target-like patterns',
                chemical_treatment: 'Apply chlorothalonil fungicide (2ml/L water). Treat every 7-10 days.',
                organic_treatment: 'Use compost tea spray, copper soap, or Bacillus subtilis based products