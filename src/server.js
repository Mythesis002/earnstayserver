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
    dns.lookup(new URL(url).hostname, async (dnsErr) => {
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
      try {
        const resolvedData = await resolveShortenedUrl(url);
        res.json(resolvedData);
      } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
@@ -51,7 +52,7 @@ async function resolveShortenedUrl(url) {
    } else {
      throw new Error('ASIN not found in the resolved URL');
    }

    
    // Make a request to the external API
    const apiResponse = await axios.get(`https://real-time-amazon-data.p.rapidapi.com/product-details?asin=${asin}&country=IN`, {
      headers: {
@@ -60,12 +61,21 @@ async function resolveShortenedUrl(url) {
      }
    });

    // Return the data to the client
    if (!apiResponse.data.data || !apiResponse.data.data.product_details) {
      throw new Error('Invalid response from external API');
    // Check and return the Brand from the correct location
    const data = apiResponse.data.data;
    let brand;

    if (data.product_details && data.product_details.Brand) {
      brand = data.product_details.Brand;
    } else if (data.product_information && data.product_information.Brand) {
      brand = data.product_information.Brand;
    } else {
      throw new Error('Brand not found in the response');
    }
    return apiResponse.data.data.product_details.Brand;

    return brand;
  } catch (error) {
    console.error('Error fetching product details:', error.message);
    throw error;
  }
}
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
