const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dns = require('dns');
const app = express();
const PORT = 10000;
// Enable CORS for all routes
app.use(cors());
// Endpoint for resolving URLs
app.get('/resolveShortenedUrl', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    // Check DNS resolution
    dns.lookup(new URL(url).hostname, async (dnsErr) => {
      if (dnsErr) {
        console.error('DNS resolution error:', dnsErr.message);
        return res.status(500).json({ error: 'Failed to resolve domain name' });
      }
      // Resolve URL based on domain
      try {
        let resolvedData;
        if (url.includes('flipkart.com')) {
          resolvedData = await resolveFlipkartUrl(url);
          
        } else {
          resolvedData = await resolveAmazonUrl(url);
          
        }
        res.json(resolvedData);
      } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
const fetch = require('node-fetch');
async function resolveFlipkartUrl(Url) {
  const options = {
    timeout: 30000, // 30 seconds
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
      'sec-fetch-site': 'none',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-user': '?1',
      'sec-fetch-dest': 'document',
    }
  };
  try {
    const response = await fetch(Url, options);
    const finalUrl = response.url;
    console.log('Final Flipkart URL:', finalUrl);
    const brand = extractFlipkartBrandName(finalUrl);
    console.log('Extracted Flipkart brand:', brand);
    if (!brand) {
      throw new Error('Unable to extract brand from Flipkart URL');
    }
    return { brand };
  } catch (error) {
    console.error('Flipkart Error:', error.message);
    if (error.response) {
      console.error('Flipkart Error status code:', error.response.status);
      console.error('Flipkart Error response body:', await error.response.text());
    }
    throw error;
  }
}

function extractFlipkartBrandName(url) {
  // Updated regex to handle more URL formats
  const regex = /flipkart\.com\/(?:([^-\/]+)(?:\/|-)|dl\/([^\/]+))/i;
  const match = url.match(regex);
  if (match) {
    const brandPart = match[1].split('-')[0];  // Split by '-' and take the first part
    return decodeURIComponent(brandPart).replace(/\+/g, ' '); // Decode URL-encoded characters
  }
  return null;
}
async function resolveAmazonUrl(url) {
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
        'X-RapidAPI-Key': 'bc4551ab84msh6733c61fc21c591p1d72c2jsnad99d9c3dd43', // Replace with your actual key
        'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
      }
    });
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
    return { brand };
  } catch (error) {
    console.error('Error fetching Amazon product details:', error.message);
    throw error;
  }
}
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
