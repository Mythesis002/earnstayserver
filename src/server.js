const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dns = require('dns');
const app = express();
const PORT = 10000;

// Enable CORS for all routes
app.use(cors());

app.get('/resolveShortenedUrl', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Check DNS resolution
    dns.lookup(new URL(url).hostname, (dnsErr) => {
      if (dnsErr) {
        console.error('DNS resolution error:', dnsErr.message);
        return res.status(500).json({ error: 'Failed to resolve domain name' });
      }

      // Proceed with URL resolution
      resolveShortenedUrl(url)
        .then(resolvedData => res.json(resolvedData))
        .catch(err => {
          console.error('Error:', err.message);
          res.status(500).json({ error: 'Internal server error' });
        });
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function resolveShortenedUrl(url) {
  try {
    const response = await axios.get(url, { maxRedirects: 5 });
    const resolvedUrl = response.request.res.responseUrl;

    // Extract the ASIN from the resolved URL using a more comprehensive regex
    const regex = /(?:dp|gp\/product|exec\/obidos\/asin|product)\/([A-Z0-9]{10})|(?:asin|pd_rd_i)=([A-Z0-9]{10})/i;
    const match = resolvedUrl.match(regex);
    let asin;
    if (match) {
      asin = match[1] || match[2]; // Match the first or second capturing group
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
    if (!apiResponse.data.data || !apiResponse.data.data.product_details) {
      throw new Error('Invalid response from external API');
    }
    return apiResponse.data.data.product_details.Brand;
  } catch (error) {
    throw error;
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
