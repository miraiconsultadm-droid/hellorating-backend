import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Adicionar cabeçalhos CORS explícitos para garantir que o Vercel não bloqueie
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
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

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'HelloRating API',
    supabaseConnected: !!supabase 
  });
});

// Get all campaigns
app.get('/api/campaigns', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('campanhas')
        .select('*');
      
      if (error) {
        console.error('Supabase error fetching campaigns:', error);
        throw error;
      }
      res.json(data);
    } else {
      res.status(500).json({ error: 'Supabase client not initialized' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaign by ID
app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Supabase error fetching campaign ${id}:`, error);
        throw error;
      }
      res.json(data);
    } else {
      res.status(500).json({ error: 'Supabase client not initialized' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new campaign
app.post('/api/campaigns', async (req, res) => {
  console.log('POST /api/campaigns - Received request to create campaign');
  try {
    if (!supabase) {
      console.error('Supabase client not initialized. Cannot create campaign.');
      return res.status(500).json({ error: 'Supabase client not initialized' });
    }

    const { name, main_metric, redirect_enabled, redirect_rule, feedback_enabled, feedback_text, questions } = req.body;
    
    const campaignToInsert = {
      nome: name,
      metrica: main_metric,
      redirecionar_google: redirect_enabled,
      regra_redirecionamento: redirect_rule,
      habilitar_feedback: feedback_enabled,
      texto_feedback: feedback_text,
      perguntas: questions || []
    };

    console.log('Attempting to insert campaign with data:', campaignToInsert);

    const { data, error } = await supabase
      .from('campanhas')
      .insert([campaignToInsert])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error inserting campaign:', error);
      return res.status(500).json({ error: 'Supabase error inserting campaign', details: error.message });
    }
    
    console.log('Campaign successfully inserted into Supabase:', data);
    res.status(201).json(data);

  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update campaign
app.put('/api/campaigns/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`PUT /api/campaigns/${id} - Received request to update campaign`);
  try {
    if (!supabase) {
      console.error('Supabase client not initialized. Cannot update campaign.');
      return res.status(500).json({ error: 'Supabase client not initialized' });
    }

    const { name, main_metric, redirect_enabled, redirect_rule, feedback_enabled, feedback_text, questions } = req.body;

    const campaignToUpdate = {
      nome: name,
      metrica: main_metric,
      redirecionar_google: redirect_enabled,
      regra_redirecionamento: redirect_rule,
      habilitar_feedback: feedback_enabled,
      texto_feedback: feedback_text,
      perguntas: questions || []
    };

    console.log(`Attempting to update campaign ${id} with data:`, campaignToUpdate);

    const { data, error } = await supabase
      .from('campanhas')
      .update(campaignToUpdate)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Supabase error updating campaign ${id}:`, error);
      return res.status(500).json({ error: `Supabase error updating campaign ${id}`, details: error.message });
    }

    console.log(`Campaign ${id} successfully updated in Supabase:`, data);
    res.json(data);

  } catch (error) {
    console.error(`Error updating campaign ${id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Submit survey response
app.post('/api/surveys/:id/responses', async (req, res) => {
  const { id } = req.params;
  console.log(`POST /api/surveys/${id}/responses - Submitting survey response`);
  try {
    if (!supabase) {
      console.error('Supabase client not initialized. Cannot submit response.');
      return res.status(500).json({ error: 'Supabase client not initialized' });
    }

    const { email, answers } = req.body;
    
    const response = {
      campanha_id: id,
      cliente_email: email,
      respostas: answers,
    };

    console.log('Attempting to insert response with data:', response);

    const { data, error } = await supabase
      .from('respostas')
      .insert([response])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error inserting response:', error);
      return res.status(500).json({ error: 'Supabase error inserting response', details: error.message });
    }

    console.log('Response successfully inserted into Supabase:', data);
    res.json(data);

  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get survey data (public endpoint)
app.get('/api/surveys/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`GET /api/surveys/${id} - Fetching survey data`);
  try {
    if (!supabase) {
      console.error('Supabase client not initialized. Cannot fetch survey data.');
      return res.status(500).json({ error: 'Supabase client not initialized' });
    }

    const { data, error } = await supabase
      .from('campanhas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Supabase error fetching survey campaign ${id}:`, error);
      throw error;
    }
    
    res.json({ campaign: data, questions: data.perguntas || [] });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard data
app.get('/api/campaigns/:id/dashboard', async (req, res) => {
  const { id } = req.params;
  console.log(`GET /api/campaigns/${id}/dashboard - Fetching dashboard data`);
  try {
    if (!supabase) {
      console.error('Supabase client not initialized. Cannot fetch dashboard data.');
      return res.status(500).json({ error: 'Supabase client not initialized' });
    }

    const { data: responses, error } = await supabase
      .from('respostas')
      .select('*')
      .eq('campanha_id', id);

    if (error) {
      console.error('Supabase error fetching dashboard responses:', error);
      throw error;
    }

    let promoters = 0;
    let passives = 0;
    let detractors = 0;

    responses.forEach(r => {
      if (r.nota_nps >= 9) {
        promoters++;
      } else if (r.nota_nps >= 7) {
        passives++;
      } else {
        detractors++;
      }
    });

    const totalResponses = responses.length;
    const nps = totalResponses > 0 ? ((promoters - detractors) / totalResponses) * 100 : 0;

    const dashboardData = {
      nps: parseFloat(nps.toFixed(2)),
      responseRate: 0,
      responses: totalResponses,
      sends: 0,
      last10Days: [],
      npsPercentage: [
        { category: 'Detratores', value: totalResponses > 0 ? parseFloat(((detractors / totalResponses) * 100).toFixed(2)) : 0, color: '#ef4444' },
        { category: 'Passivos', value: totalResponses > 0 ? parseFloat(((passives / totalResponses) * 100).toFixed(2)) : 0, color: '#f59e0b' },
        { category: 'Promotores', value: totalResponses > 0 ? parseFloat(((promoters / totalResponses) * 100).toFixed(2)) : 0, color: '#10b981' },
      ],
      npsScores: [],
      latestResponses: responses.map(r => ({ 
        id: r.id, 
        name: r.cliente_nome, 
        email: r.cliente_email, 
        score: r.nota_nps, 
        category: r.nota_nps >= 9 ? 'Promotor' : (r.nota_nps >= 7 ? 'Passivo' : 'Detrator') 
      })),
    };
    res.json(dashboardData);

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server (for local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 HelloRating API running on http://localhost:${PORT}`);
    console.log(`Supabase connected: ${!!supabase}`);
  });
}

// Export for Vercel
export default app;

