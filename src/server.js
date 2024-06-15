const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dns = require('dns');
const puppeteer = require('puppeteer');

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

async function resolveFlipkartUrl(shortenedUrl) {
  // Ensure Puppeteer uses the installed Chrome version
  const browser = await puppeteer.launch({
    executablePath: puppeteer.executablePath() // Use the correct Chrome executable
  });
  const page = await browser.newPage();

  try {
    // Navigate to the shortened URL
    await page.goto(shortenedUrl);

    // Extract the final URL after all redirects
    const finalUrl = page.url();

    // Extract brand name
    const brandName = extractBrandName(finalUrl);

    return { brandName };
  } finally {
    await browser.close();
  }
}

function extractBrandName(url) {
  const regex = /https:\/\/www\.flipkart\.com\/([^\/]+)/;
  const match = url.match(regex);
  if (match) {
    const brandPart = match[1].split('-')[0];  // Split by '-' and take the first part
    console.log(brandPart)
    return brandPart;
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
        'X-RapidAPI-Key': 'bc4551ab84msh6733c61fc21c591p1d72c2jsnad99d9c3dd43',
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
    console.log(brand)
    return { brand };
  } catch (error) {
    console.error('Error fetching product details:', error.message);
    throw error;
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
