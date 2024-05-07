from flask import Flask, request, jsonify
import requests
import re

app = Flask(__name__)
PORT = 3000

@app.route('/resolveShortenedUrl')
def resolve_shortened_url():
    try:
        url = request.args.get('url')
        response = requests.get(url, allow_redirects=True)
        resolved_url = response.url
        match = re.search(r'dp/([^?]+)', resolved_url)
        if match and match.group(1):
            asin = match.group(1)
        else:
            raise ValueError('ASIN not found in the resolved URL')

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
    except Exception as error:
        print('Error:', error)
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(port=PORT)
