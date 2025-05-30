// middleware/verifyApiKey.ts
import { NextApiRequest, NextApiResponse } from 'next';

export const verifyApiKey = (handler: Function) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const apiKey = req.headers['x-api-key'];

    if (apiKey !== process.env.IOT_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized - Invalid API Key' });
    }

    return handler(req, res);
  };
};
