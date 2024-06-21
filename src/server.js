const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import cors module
const app = express();
const PORT = 10000;


// Enable CORS for all routes
app.use(cors());
app.get('/resolveShortenedUrl', async (req, res) => {
  try {
    const { url } = req.query;
    // Make a request to the shortened URL to resolve it
    const response = await axios.get(url, { maxRedirects: 5 });
    const resolvedUrl = response.request.res.responseUrl;
    
    // Extract the ASIN from the resolved URL
    const regex = /dp\/([^?]+)/;
    const match = resolvedUrl.match(regex);
    let asin;
    if (match && match[1]) {
      asin = match[1];
    } else {
      throw new Error('ASIN not found in the resolved URL');
    }
    // Make a request to the external API
    const apiResponse = await axios.get(`https://real-time-amazon-data.p.rapidapi.com/product-details?asin=${asin}&country=IN`, {
      headers: {
        'X-RapidAPI-Key': 'bc4551ab84msh6733c61fc21c591p1d72c2jsnad99d9c3dd43',
        'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
      }
    });
    // Return the data to the client
    res.json(apiResponse.data.data.product_details.Brand);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
