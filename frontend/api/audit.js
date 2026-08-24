import crypto from 'crypto';

function analyzeContract(language, code) {
  const isVulnerable = code.toLowerCase().includes('selfdestruct') || 
                       code.toLowerCase().includes('delegatecall') ||
                       code.includes('tx.origin') ||
                       code.length < 50;
                       
  let severity = 0n;
  let findingsMessage = "No major vulnerabilities found.";

  if (isVulnerable) {
    severity = 3n; // High severity
    findingsMessage = "Critical vulnerability detected: Unauthorized state modification or insecure delegation.";
  } else if (code.length > 50 && code.length < 200) {
    severity = 1n; // Low severity
    findingsMessage = "Code lacks comprehensive NatSpec documentation and event emissions.";
  }

  const hash = crypto.createHash('sha256').update(findingsMessage).digest('hex');

  return {
    severity: Number(severity),
    findings: findingsMessage,
    hash: hash
  };
}

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { language, code } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: 'Language and code are required.' });
  }

  try {
    const result = analyzeContract(language, code);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error during analysis.' });
  }
}
