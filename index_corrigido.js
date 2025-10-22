
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
const allowedOrigins = [
  'https://hellorating-frontend.vercel.app', // Domínio do frontend no Vercel
  'http://localhost:5174', // Para desenvolvimento local
  'https://hellorating-backend.vercel.app' // Para o próprio backend, se necessário
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Validation helper
const validateCampaignData = (data) => {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Campo "name" é obrigatório e deve ser uma string não vazia');
  }
  
  if (!data.mainMetric || typeof data.mainMetric !== 'string') {
    errors.push('Campo "mainMetric" é obrigatório e deve ser uma string');
  }
  
  if (typeof data.redirectEnabled !== 'boolean') {
    errors.push('Campo "redirectEnabled" deve ser um booleano');
  }
  
  if (typeof data.feedbackEnabled !== 'boolean') {
    errors.push('Campo "feedbackEnabled" deve ser um booleano');
  }
  
  if (data.questions && !Array.isArray(data.questions)) {
    errors.push('Campo "questions" deve ser um array');
  }
  
  return errors;
};

// Routes
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'HelloRating API',
    supabaseConnected: !!supabase 
  });
});

// Mapeamento de e para o Supabase
const toFrontend = (campaign) => ({
  id: campaign.id,
  name: campaign.nome,
  mainMetric: campaign.metrica,
  redirectEnabled: campaign.redirecionar_google,
  redirectRule: campaign.regra_redirecionamento,
  feedbackEnabled: campaign.habilitar_feedback,
  feedbackText: campaign.texto_feedback,
  questions: campaign.perguntas || [],
  formaEnvio: campaign.forma_envio,
  status: campaign.status,
  userId: campaign.user_id,
  token: campaign.token
});

const toSupabase = (body) => {
  // Garantir que undefined seja convertido para null
  return {
    nome: body.name !== undefined ? body.name : null,
    metrica: body.mainMetric !== undefined ? body.mainMetric : null,
    redirecionar_google: body.redirectEnabled !== undefined ? body.redirectEnabled : false,
    regra_redirecionamento: body.redirectRule !== undefined ? body.redirectRule : null,
    habilitar_feedback: body.feedbackEnabled !== undefined ? body.feedbackEnabled : false,
    texto_feedback: body.feedbackText !== undefined ? body.feedbackText : null,
    perguntas: body.questions || [],
    forma_envio: body.formaEnvio || null,
    status: body.status || 'active',
    user_id: body.userId || null,
    token: body.token || null
  };
};

// Get all campaigns
app.get('/api/campaigns', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });

    const { data, error } = await supabase.from('campanhas').select('*');
    
    if (error) {
      console.error('Supabase error fetching campaigns:', { 
        details: error.details, 
        hint: error.hint, 
        code: error.code,
        message: error.message 
      });
      return res.status(500).json({ 
        error: 'Erro ao buscar campanhas', 
        details: error.message 
      });
    }

    res.json(data.map(toFrontend));

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get campaign by ID
app.get('/api/campaigns/:id', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });

    const { id } = req.params;
    const { data, error } = await supabase.from('campanhas').select('*').eq('id', id).single();
    
    if (error) {
      console.error(`Supabase error fetching campaign ${id}:`, { 
        details: error.details, 
        hint: error.hint, 
        code: error.code,
        message: error.message 
      });
      return res.status(500).json({ 
        error: `Erro ao buscar campanha ${id}`, 
        details: error.message 
      });
    }

    res.json(toFrontend(data));

  } catch (error) {
    console.error(`Error fetching campaign:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Create new campaign
app.post('/api/campaigns', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });

    // Validar dados
    const validationErrors = validateCampaignData(req.body);
    if (validationErrors.length > 0) {
      console.warn('Validation errors for campaign creation:', validationErrors);
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationErrors 
      });
    }

    const campaignToInsert = toSupabase(req.body);
    console.log('Attempting to insert campaign with data:', JSON.stringify(campaignToInsert, null, 2));

    const { data, error } = await supabase.from('campanhas').insert([campaignToInsert]).select().single();
    
    if (error) {
      console.error('Supabase error inserting campaign:', { 
        details: error.details, 
        hint: error.hint, 
        code: error.code,
        message: error.message 
      });
      return res.status(500).json({ 
        error: 'Erro ao criar campanha', 
        details: error.message 
      });
    }
    
    console.log('Campaign successfully inserted:', JSON.stringify(data, null, 2));
    res.status(201).json(toFrontend(data));

  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update campaign
app.put('/api/campaigns/:id', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });

    const { id } = req.params;
    
    // Validar dados
    const validationErrors = validateCampaignData(req.body);
    if (validationErrors.length > 0) {
      console.warn(`Validation errors for campaign update (${id}):`, validationErrors);
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationErrors 
      });
    }

    const campaignToUpdate = toSupabase(req.body);
    console.log(`Attempting to update campaign ${id} with data:`, JSON.stringify(campaignToUpdate, null, 2));

    const { data, error } = await supabase.from('campanhas').update(campaignToUpdate).eq('id', id).select().single();
    
    if (error) {
      console.error(`Supabase error updating campaign ${id}:`, { 
        details: error.details, 
        hint: error.hint, 
        code: error.code,
        message: error.message 
      });
      return res.status(500).json({ 
        error: `Erro ao atualizar campanha ${id}`, 
        details: error.message 
      });
    }

    console.log(`Campaign ${id} successfully updated:`, JSON.stringify(data, null, 2));
    res.json(toFrontend(data));

  } catch (error) {
    console.error(`Error updating campaign:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Submit survey response
app.post('/api/surveys/:id/responses', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });

    const { id } = req.params;
    const { email, answers } = req.body;
    
    if (!email || !answers) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: ['email e answers são obrigatórios'] 
      });
    }
    
    const response = { campanha_id: id, cliente_email: email, respostas: answers };
    console.log('Attempting to insert response with data:', JSON.stringify(response, null, 2));

    const { data, error } = await supabase.from('respostas').insert([response]).select().single();
    
    if (error) {
      console.error('Supabase error inserting response:', { 
        details: error.details, 
        hint: error.hint, 
        code: error.code,
        message: error.message 
      });
      return res.status(500).json({ 
        error: 'Erro ao salvar resposta', 
        details: error.message 
      });
    }

    console.log('Response successfully inserted:', JSON.stringify(data, null, 2));
    res.status(201).json(data);

  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;

