import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Simulated AI Analyzer
function analyzeContract(language: string, code: string) {
  // In a real app, this would send the code to an LLM or static analyzer.
  // We'll mock a realistic response based on the code length or keywords.
  
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

  // Create a 32-byte hash of the findings to store on chain (just for demo purposes)
  const hash = crypto.createHash('sha256').update(findingsMessage).digest('hex');

  return {
    severity: Number(severity), // Convert BigInt to number for JSON response
    findings: findingsMessage,
    hash: hash
  };
}

app.post('/api/audit', (req, res) => {
  const { language, code } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: 'Language and code are required.' });
  }

  console.log(`[API] Received audit request for ${language} contract (${code.length} bytes)`);

  try {
    const result = analyzeContract(language, code);
    
    console.log(`[API] Audit complete. Severity: ${result.severity}`);
    
    // Simulate some "AI processing" delay
    setTimeout(() => {
      res.json(result);
    }, 1500);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error during analysis.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Auditing AI Engine (Backend) listening at http://localhost:${port}`);
});
