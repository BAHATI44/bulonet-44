const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping product URL:', formattedUrl);

    // Determine source
    const isAliExpress = formattedUrl.includes('aliexpress');
    const isAmazon = formattedUrl.includes('amazon');
    const source = isAliExpress ? 'aliexpress' : isAmazon ? 'amazon' : 'other';

    // Use Firecrawl with JSON extraction for structured product data
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: [
          'markdown',
          {
            type: 'json',
            prompt: 'Extract the product information from this e-commerce page. Get the product name/title, description, price (as a number without currency symbol), currency (3-letter code like USD, EUR, CNY), all image URLs you can find, the SKU or product ID, any available stock/quantity info, product specifications/features as a list, and the product category.',
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Product name/title' },
                description: { type: 'string', description: 'Product description' },
                price: { type: 'number', description: 'Price as a number' },
                currency: { type: 'string', description: '3-letter currency code' },
                images: { type: 'array', items: { type: 'string' }, description: 'Image URLs' },
                sku: { type: 'string', description: 'Product SKU or ID' },
                stock: { type: 'number', description: 'Available stock quantity' },
                specifications: { type: 'array', items: { type: 'string' }, description: 'Product features/specs' },
                category: { type: 'string', description: 'Product category' },
              },
              required: ['title', 'price'],
            },
          },
          'screenshot',
        ],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Scrape failed (${response.status})` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract product data from response
    const jsonData = data.data?.json || data.json || {};
    const screenshot = data.data?.screenshot || data.screenshot;
    const metadata = data.data?.metadata || data.metadata || {};

    const product = {
      title: jsonData.title || metadata.title || '',
      description: jsonData.description || metadata.description || '',
      price: jsonData.price || 0,
      currency: jsonData.currency || 'USD',
      images: jsonData.images || [],
      sku: jsonData.sku || '',
      stock: jsonData.stock || 0,
      specifications: jsonData.specifications || [],
      category: jsonData.category || '',
      source,
      sourceUrl: formattedUrl,
      screenshot,
    };

    console.log('Product scraped successfully:', product.title);

    return new Response(
      JSON.stringify({ success: true, product }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping product:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Scrape failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
