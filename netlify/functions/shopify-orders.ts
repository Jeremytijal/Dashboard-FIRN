import type { Handler, HandlerEvent } from '@netlify/functions';

const SHOPIFY_STORE = 'firn-fr';
const SHOPIFY_API_VERSION = '2024-01';

const handler: Handler = async (event: HandlerEvent) => {
    // Récupérer le token depuis les variables d'environnement
    const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!SHOPIFY_ACCESS_TOKEN) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'SHOPIFY_ACCESS_TOKEN not configured' }),
        };
    }

    // Récupérer les paramètres de la requête
    const params = event.queryStringParameters || {};
    const queryString = new URLSearchParams(params).toString();

    const url = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/orders.json?${queryString}`;

    try {
        const response = await fetch(url, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.text();
            return {
                statusCode: response.status,
                body: JSON.stringify({ error }),
            };
        }

        const data = await response.json();

        // Récupérer le header Link pour la pagination
        const linkHeader = response.headers.get('Link');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                ...(linkHeader ? { 'X-Shopify-Link': linkHeader } : {}),
            },
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error('Shopify API error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch from Shopify' }),
        };
    }
};

export { handler };


