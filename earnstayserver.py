from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

@app.route('/resolveShortenedUrl')
def resolve_shortened_url():
    try:
        url = request.args.get('url')
        response = requests.get(url, allow_redirects=True, max_redirects=5)
        resolved_url = response.url
        asin = resolved_url.split('/dp/')[1].split('?')[0]

        # Set up the request parameters for the new API
        params = {
            'api_key': "96473062B0A24D2CB0F2E9FB5086749B",
            'amazon_domain': "amazon.in",
            'asin': asin,
            'type': "product",
            'include_html': "false",
            'include_summarization_attributes': "false",
            'language': "en_US",
            'output': "json"
        }

        # Make a request to the new API
        api_response = requests.get('https://api.asindataapi.com/request', params=params)
        
        # Return the data to the client
        return jsonify(api_response.json())

    except Exception as e:
        print('Error:', e)
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(port=3000)
