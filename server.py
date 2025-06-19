from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import json
import logging
from typing import Dict, Any, List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Configuration
DATABRICKS_URL = "https://dbc-31bbe4ca-9886.cloud.databricks.com/serving-endpoints/agents_workspace-default-meta_llama_3_70b/invocations"
DATABRICKS_TOKEN = os.environ.get("DATABRICKS_TOKEN")

if not DATABRICKS_TOKEN:
    logger.error("DATABRICKS_TOKEN environment variable not set")
    raise ValueError("DATABRICKS_TOKEN environment variable is required")

class DatabricksClient:
    def __init__(self, url: str, token: str):
        self.url = url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def send_message(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Send messages to Databricks LLM endpoint"""
        payload = {
            "messages": messages
        }
        
        try:
            logger.info(f"Sending request to Databricks: {json.dumps(payload, indent=2)}")
            response = requests.post(
                self.url,
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            logger.info(f"Databricks response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Databricks response: {json.dumps(result, indent=2)}")
                return {
                    "success": True,
                    "data": result
                }
            else:
                error_msg = f"Databricks API error: {response.status_code} - {response.text}"
                logger.error(error_msg)
                return {
                    "success": False,
                    "error": error_msg,
                    "status_code": response.status_code
                }
                
        except requests.exceptions.Timeout:
            error_msg = "Request to Databricks timed out"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
        except requests.exceptions.RequestException as e:
            error_msg = f"Request failed: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}

# Initialize Databricks client
databricks_client = DatabricksClient(DATABRICKS_URL, DATABRICKS_TOKEN)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Real Estate Chatbot API",
        "databricks_configured": bool(DATABRICKS_TOKEN)
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint that forwards messages to Databricks"""
    try:
        # Validate request
        if not request.is_json:
            return jsonify({
                "success": False,
                "error": "Request must be JSON"
            }), 400
        
        data = request.get_json()
        
        # Validate required fields
        if 'messages' not in data:
            return jsonify({
                "success": False,
                "error": "Missing 'messages' field in request"
            }), 400
        
        messages = data['messages']
        
        # Validate messages structure
        if not isinstance(messages, list) or len(messages) == 0:
            return jsonify({
                "success": False,
                "error": "Messages must be a non-empty array"
            }), 400
        
        # Validate each message
        for i, message in enumerate(messages):
            if not isinstance(message, dict):
                return jsonify({
                    "success": False,
                    "error": f"Message at index {i} must be an object"
                }), 400
            
            if 'role' not in message or 'content' not in message:
                return jsonify({
                    "success": False,
                    "error": f"Message at index {i} must have 'role' and 'content' fields"
                }), 400
        
        logger.info(f"Received chat request with {len(messages)} messages")
        
        # Send to Databricks
        result = databricks_client.send_message(messages)
        
        if result['success']:
            return jsonify({
                "success": True,
                "response": result['data'],
                "message_count": len(messages)
            })
        else:
            status_code = result.get('status_code', 500)
            return jsonify({
                "success": False,
                "error": result['error']
            }), status_code
            
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500

@app.route('/api/listings', methods=['POST'])
def get_listings():
    """Endpoint specifically for getting property listings"""
    try:
        if not request.is_json:
            return jsonify({
                "success": False,
                "error": "Request must be JSON"
            }), 400
        
        data = request.get_json()
        
        # Extract user preferences
        area = data.get('area', '')
        classification = data.get('classification', '')
        budget = data.get('budget', '')
        property_type = data.get('property_type', '')
        
        # Create a formatted message for the LLM
        user_message = f"I'm looking for properties in {area}. I'm a {classification}."
        if budget:
            user_message += f" My budget is {budget}."
        if property_type:
            user_message += f" I'm interested in {property_type}."
        
        messages = [
            {
                "role": "user",
                "content": user_message
            }
        ]
        
        logger.info(f"Generated listing request message: {user_message}")
        
        # Send to Databricks
        result = databricks_client.send_message(messages)
        
        if result['success']:
            return jsonify({
                "success": True,
                "listings": result['data'],
                "query": {
                    "area": area,
                    "classification": classification,
                    "budget": budget,
                    "property_type": property_type
                }
            })
        else:
            status_code = result.get('status_code', 500)
            return jsonify({
                "success": False,
                "error": result['error']
            }), status_code
            
    except Exception as e:
        logger.error(f"Unexpected error in listings endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500

@app.route('/api/test', methods=['POST'])
def test_databricks():
    """Test endpoint to check Databricks connectivity"""
    try:
        test_messages = [
            {
                "role": "user",
                "content": "Hello, this is a test message"
            }
        ]
        
        result = databricks_client.send_message(test_messages)
        
        return jsonify({
            "success": result['success'],
            "databricks_response": result.get('data'),
            "error": result.get('error')
        })
        
    except Exception as e:
        logger.error(f"Test endpoint error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Endpoint not found"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500

if __name__ == '__main__':
    # Check if running in production
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    port = int(os.environ.get('PORT', 5000))
    
    logger.info(f"Starting server on port {port}, debug={debug_mode}")
    logger.info(f"Databricks URL: {DATABRICKS_URL}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug_mode
    )