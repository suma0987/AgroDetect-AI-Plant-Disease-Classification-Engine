"""
AgroDetect AI - Backend with DeepSeek API Integration
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import base64
import requests
import os
from PIL import Image
import io
import json
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="AgroDetect AI", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# DeepSeek API Configuration
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

# Disease database (fallback if API fails)
DISEASE_DATABASE = {
    "tomato late blight": {
        "symptoms": "Dark lesions on leaves, white mold on underside",
        "chemical_treatment": "Apply copper-based fungicides (2g/L water) every 7-10 days",
        "organic_treatment": "Neem oil spray (5ml/L water) + baking soda solution",
        "prevention": "Ensure good air circulation, avoid overhead watering",
        "severity_indicators": {
            "mild": "Small spots on few leaves",
            "moderate": "Spreading lesions, some leaf yellowing",
            "severe": "Extensive leaf damage, fruit rot"
        }
    },
    "tomato early blight": {
        "symptoms": "Dark spots with concentric rings, yellowing leaves",
        "chemical_treatment": "Chlorothalonil fungicide (2ml/L water)",
        "organic_treatment": "Compost tea spray, copper soap",
        "prevention": "Mulch around plants, crop rotation",
        "severity_indicators": {
            "mild": "Few spots on lower leaves",
            "moderate": "Spots spreading to middle leaves",
            "severe": "Defoliation, stem lesions"
        }
    },
    "potato late blight": {
        "symptoms": "Water-soaked lesions, white fungal growth",
        "chemical_treatment": "Mancozeb fungicide (2g/L water)",
        "organic_treatment": "Remove infected leaves, copper fungicide",
        "prevention": "Plant resistant varieties, proper spacing",
        "severity_indicators": {
            "mild": "Small lesions on few leaves",
            "moderate": "Spreading lesions, some stem damage",
            "severe": "Complete defoliation, tuber rot"
        }
    },
    "corn common rust": {
        "symptoms": "Reddish-brown pustules on leaves",
        "chemical_treatment": "Azoxystrobin fungicide (1ml/L water)",
        "organic_treatment": "Sulfur spray, remove infected leaves",
        "prevention": "Plant resistant hybrids, crop rotation",
        "severity_indicators": {
            "mild": "Few pustules on lower leaves",
            "moderate": "Pustules spreading upward",
            "severe": "Leaves covered, reduced yield"
        }
    }
}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "🌱 AgroDetect AI API is running",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "api_key_configured": bool(DEEPSEEK_API_KEY)
    }

@app.post("/analyze")
async def analyze_plant_disease(file: UploadFile = File(...)):
    """
    Analyze plant leaf image for disease detection using DeepSeek API
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(400, "File must be an image")
        
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Resize image to reduce size
        image.thumbnail((800, 800))
        
        # Convert to base64
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        # Prepare prompt for DeepSeek
        prompt = f"""You are an expert plant pathologist. Analyze this plant leaf image and provide:
1. Disease name (be specific)
2. Confidence level (percentage)
3. Severity (Mild/Moderate/Severe)
4. Visible symptoms
5. Chemical treatment recommendation
6. Organic treatment recommendation
7. Prevention tips

Format your response as JSON with these fields:
- disease_name
- confidence
- severity
- symptoms
- chemical_treatment
- organic_treatment
- prevention_tips

Base your analysis on the image provided."""

        # Call DeepSeek API
        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{img_base64}"}
                        }
                    ]
                }
            ],
            "temperature": 0.3,
            "max_tokens": 500
        }
        
        logger.info("Calling DeepSeek API...")
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result['choices'][0]['message']['content']
            
            # Try to parse JSON from response
            try:
                # Extract JSON from the response
                json_start = ai_response.find('{')
                json_end = ai_response.rfind('}') + 1
                if json_start != -1 and json_end != 0:
                    json_str = ai_response[json_start:json_end]
                    analysis = json.loads(json_str)
                else:
                    # Fallback to structured parsing
                    analysis = parse_ai_response(ai_response)
            except:
                # Fallback to structured parsing
                analysis = parse_ai_response(ai_response)
            
            return {
                "success": True,
                "analysis": analysis,
                "source": "deepseek_ai"
            }
        else:
            # Fallback to rule-based detection
            logger.warning(f"DeepSeek API failed: {response.status_code}")
            fallback_analysis = rule_based_detection(image)
            return {
                "success": True,
                "analysis": fallback_analysis,
                "source": "fallback_system"
            }
            
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(500, f"Analysis failed: {str(e)}")

def parse_ai_response(text):
    """Parse AI response into structured format"""
    lines = text.split('\n')
    analysis = {
        "disease_name": "Unknown",
        "confidence": 75,
        "severity": "Moderate",
        "symptoms": "Not specified",
        "chemical_treatment": "Consult local agricultural expert",
        "organic_treatment": "Use neem oil spray",
        "prevention_tips": "Regular monitoring and good farming practices"
    }
    
    for line in lines:
        line = line.lower()
        if "disease" in line and ":" in line:
            analysis["disease_name"] = line.split(":", 1)[1].strip().title()
        elif "confiden" in line and ":" in line:
            try:
                conf = ''.join(filter(str.isdigit, line))
                if conf:
                    analysis["confidence"] = int(conf)
            except:
                pass
        elif "sever" in line and ":" in line:
            severity = line.split(":", 1)[1].strip()
            if "mild" in severity.lower():
                analysis["severity"] = "Mild"
            elif "moderate" in severity.lower():
                analysis["severity"] = "Moderate"
            elif "severe" in severity.lower():
                analysis["severity"] = "Severe"
    
    return analysis

def rule_based_detection(image):
    """Simple rule-based detection for fallback"""
    import numpy as np
    
    # Convert image to array
    img_array = np.array(image)
    
    # Simple color-based detection
    avg_color = np.mean(img_array, axis=(0, 1))
    
    # Rule-based classification
    if avg_color[1] > 150:  # Greenish
        disease = "Healthy Plant"
        confidence = 85
        severity = "Mild"
        treatment = "No treatment needed. Continue good farming practices."
    elif avg_color[0] > 150:  # Reddish
        disease = "Possible Late Blight"
        confidence = 70
        severity = "Moderate"
        treatment = "Apply copper-based fungicide. Remove affected leaves."
    elif avg_color[2] > 150:  # Bluish
        disease = "Possible Fungal Infection"
        confidence = 65
        severity = "Moderate"
        treatment = "Apply organic fungicide. Improve air circulation."
    else:
        disease = "Unknown Condition"
        confidence = 50
        severity = "Unknown"
        treatment = "Consult local agricultural expert for proper diagnosis."
    
    return {
        "disease_name": disease,
        "confidence": confidence,
        "severity": severity,
        "symptoms": "Detected through color analysis",
        "chemical_treatment": treatment,
        "organic_treatment": "Neem oil spray as preventive measure",
        "prevention_tips": "Regular monitoring, proper watering, crop rotation"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)