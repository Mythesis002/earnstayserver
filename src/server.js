const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());

app.get('/resolveShortenedUrl', async (req, res) => {
  try {
    const { url } = req.query;
    const response = await axios.get(url, { maxRedirects: 5 });
    const resolvedUrl = response.request.res.responseUrl;
    const regex = /dp\/([^?]+)/;
    const match = resolvedUrl.match(regex);
    let asin;
    if (match && match[1]) {
      asin = match[1];
    } else {
      throw new Error('ASIN not found in the resolved URL');
    }

    // Set up the request parameters for the new API
    const params = {
      api_key: "96473062B0A24D2CB0F2E9FB5086749B",
      amazon_domain: "amazon.in",
      asin,
      type: "product",
      include_html: "false",
      include_summarization_attributes: "false",
      language: "en_US",
      output: "json"
    };

    // Make a request to the new API
    const apiResponse = await axios.get('https://api.asindataapi.com/request', { params });

    // Return the data to the client
    res.json(apiResponse.data);
  } catch (error) {
    console.error('Error:', error);
    
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
