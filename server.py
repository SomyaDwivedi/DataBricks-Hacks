import os
import requests
import numpy as np
import pandas as pd
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Databricks configuration
DATABRICKS_URL = 'https://dbc-31bbe4ca-9886.cloud.databricks.com/serving-endpoints/agents_workspace-default-meta_llama_3_70b/invocations'
DATABRICKS_TOKEN = os.environ.get("DATABRICKS_TOKEN")

if not DATABRICKS_TOKEN:
    logger.warning("DATABRICKS_TOKEN environment variable not set!")

def create_tf_serving_json(data):
    """Convert data to TensorFlow serving format"""
    if isinstance(data, dict):
        return {'inputs': {name: data[name].tolist() for name in data.keys()}}
    return data.tolist()

def score_model(dataset):
    """Score model using Databricks serving endpoint"""
    headers = {
        'Authorization': f'Bearer {DATABRICKS_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    # Prepare data based on type
    if isinstance(dataset, pd.DataFrame):
        ds_dict = {'dataframe_split': dataset.to_dict(orient='split')}
    else:
        ds_dict = create_tf_serving_json(dataset)
    
    data_json = json.dumps(ds_dict, allow_nan=True)
    
    try:
        response = requests.post(
            url=DATABRICKS_URL,
            headers=headers,
            data=data_json,
            timeout=30
        )
        
        if response.status_code != 200:
            raise Exception(f'Request failed with status {response.status_code}, {response.text}')
        
        return response.json()
    
    except requests.exceptions.Timeout:
        raise Exception('Request timed out')
    except requests.exceptions.RequestException as e:
        raise Exception(f'Request failed: {str(e)}')

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'databricks_token_configured': bool(DATABRICKS_TOKEN)
    })

@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    """Handle chat messages and return AI responses"""
    try:
        # Get request data
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        message = data.get('message', '')
        user_preferences = data.get('user_preferences', {})
        session_id = data.get('session_id', 'default-session')
        
        logger.info(f"Processing chat message: {message[:50]}...")
        
        # Prepare payload for Databricks
        chat_payload = {
            'messages': [
                {
                    'role': 'user',
                    'content': f"User message: {message}\nUser preferences: {json.dumps(user_preferences)}\nPlease provide a helpful response for real estate assistance."
                }
            ],
            'max_tokens': 500,
            'temperature': 0.7
        }
        
        # Call Databricks model
        result = score_model(chat_payload)
        
        # Extract response text (adjust based on your model's response format)
        if 'choices' in result and result['choices']:
            response_text = result['choices'][0].get('message', {}).get('content', 'I apologize, but I could not generate a response.')
        else:
            response_text = "Thank you for that information! Let me help you find the perfect property."
        
        return jsonify({
            'success': True,
            'response': response_text,
            'session_id': session_id
        })
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/listings', methods=['POST'])
def get_listings():
    """Get property listings based on user preferences"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No preferences provided'}), 400
        
        budget = data.get('budget', '')
        location = data.get('location', '')
        property_type = data.get('property_type', '')
        bedrooms = data.get('bedrooms', '')
        
        logger.info(f"Fetching listings for: {location}, {budget}, {property_type}, {bedrooms}")
        
        # Prepare payload for Databricks listings endpoint
        listings_payload = {
            'messages': [
                {
                    'role': 'user',
                    'content': f"Generate JSON array of real estate listings based on: Budget: {budget}, Location: {location}, Property Type: {property_type}, Bedrooms: {bedrooms}. Return only valid JSON with fields: id, address, price, bedrooms, bathrooms, sqft, imageUrl, description. No explanatory text."
                }
            ],
            'max_tokens': 2000,
            'temperature': 0.1
        }
        
        # Call Databricks model
        result = score_model(listings_payload)
        
        # Extract response from Databricks
        ai_response = ""
        if 'choices' in result and result['choices']:
            ai_response = result['choices'][0].get('message', {}).get('content', '')
        elif 'predictions' in result:
            ai_response = result['predictions'][0] if result['predictions'] else ''
        else:
            ai_response = str(result)
        
        # Try to parse JSON from AI response
        listings = []
        try:
            # Look for JSON array in the response
            import re
            json_match = re.search(r'\[.*\]', ai_response, re.DOTALL)
            if json_match:
                listings_json = json_match.group()
                listings = json.loads(listings_json)
            else:
                # If no JSON array found, try to parse the entire response
                listings = json.loads(ai_response)
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"Could not parse AI response as JSON: {e}")
            logger.warning(f"AI Response: {ai_response}")
            
            # Return error if we can't parse the response
            return jsonify({
                'success': False,
                'error': 'Could not parse property listings from AI response',
                'raw_response': ai_response
            }), 500
        
        # Validate listings structure
        valid_listings = []
        for listing in listings:
            if isinstance(listing, dict) and all(key in listing for key in ['id', 'address', 'price']):
                # Ensure required fields have default values
                listing.setdefault('bedrooms', 1)
                listing.setdefault('bathrooms', 1)
                listing.setdefault('sqft', 1000)
                listing.setdefault('imageUrl', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400')
                listing.setdefault('description', 'Property description not available')
                valid_listings.append(listing)
        
        return jsonify({
            'success': True,
            'listings': valid_listings,
            'count': len(valid_listings),
            'raw_ai_response': ai_response
        })
        
    except Exception as e:
        logger.error(f"Error in listings endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/test-databricks', methods=['GET'])
def test_databricks():
    """Test Databricks connection"""
    try:
        if not DATABRICKS_TOKEN:
            return jsonify({
                'success': False,
                'error': 'DATABRICKS_TOKEN not configured'
            }), 500
        
        # Simple test payload
        test_payload = {
            'messages': [
                {
                    'role': 'user',
                    'content': 'Hello, this is a test message.'
                }
            ],
            'max_tokens': 50
        }
        
        result = score_model(test_payload)
        
        return jsonify({
            'success': True,
            'message': 'Databricks connection successful',
            'response': result
        })
        
    except Exception as e:
        logger.error(f"Databricks test failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("Starting Flask server...")
    print(f"Databricks token configured: {bool(DATABRICKS_TOKEN)}")
    print("Available endpoints:")
    print("  GET  /health - Health check")
    print("  POST /api/chat - Chat with AI")
    print("  POST /api/listings - Get property listings")
    print("  GET  /api/test-databricks - Test Databricks connection")
    
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000
    )