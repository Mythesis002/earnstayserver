const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dns = require('dns');

const app = express();
const PORT = process.env.PORT || 10000;

// Enable CORS for all routes
app.use(cors());

// Endpoint for resolving URLs
app.get('/resolveShortenedUrl', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log(`Received URL: ${url}`);

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

async function resolveFlipkartUrl(url) {
  try {
    const response = await axios.get(url, {
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    });

    const finalUrl = response.request.res.responseUrl;
    console.log(`Resolved Flipkart URL: ${finalUrl}`);

    // Extract brand name
    const brand = extractFlipkartBrandName(finalUrl);

    return { brand };
  } catch (error) {
    handleAxiosError('Flipkart', error);
    throw error;
  }
}

function extractFlipkartBrandName(url) {
  const regex = /https:\/\/www\.flipkart\.com\/([^\/]+)\//;
  const match = url.match(regex);
  if (match) {
    const brandPart = match[1].split('-')[0];  // Split by '-' and take the first part
    return brandPart;
  }
  return null;
}

async function resolveAmazonUrl(url) {
  try {
    const response = await axios.get(url, { maxRedirects: 5 });
    const resolvedUrl = response.request.res.responseUrl;
    console.log(`Resolved Amazon URL: ${resolvedUrl}`);

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
    handleAxiosError('Amazon', error);
    throw error;
  }
}

function handleAxiosError(source, error) {
  if (error.response) {
    // Server responded with a status other than 200 range
    console.error(`${source} Error status code:`, error.response.status);
    console.error(`${source} Error response data:`, error.response.data);
  } else if (error.request) {
    // No response received
    console.error(`${source} No response received:`, error.request);
  } else {
    // Error setting up the request
    console.error(`${source} Error in request setup:`, error.message);
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
