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

// Mock data para desenvolvimento
const mockCampaigns = [
  {
    id: 'NM8T29dcbcpc4b2',
    name: 'Survey Test',
    main_metric: 'NPS',
    redirect_enabled: true,
    redirect_rule: 'promotores',
    feedback_enabled: false,
    feedback_text: '',
    perguntas: [
      {
        id: 1,
        type: 'like_dislike',
        text: 'Com que frequência você utiliza os serviços da Netkings?',
        options: null,
        order: 1,
      },
      {
        id: 2,
        type: 'emotion_scale',
        text: 'O site da Netkings é fácil de usar e navegar?',
        options: [
          { value: 1, emoji: '😡', label: 'Muito ruim' },
          { value: 2, emoji: '😕', label: 'Ruim' },
          { value: 3, emoji: '😐', label: 'Neutro' },
          { value: 4, emoji: '🙂', label: 'Bom' },
          { value: 5, emoji: '😄', label: 'Muito bom' },
        ],
        order: 2,
      },
    ],
  },
  {
    id: 'test-email',
    name: 'Teste E-mail',
    main_metric: 'NPS',
    redirect_enabled: false,
    redirect_rule: '',
    feedback_enabled: false,
    feedback_text: '',
    perguntas: [],
  },
];

const mockResponses = [];

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
        .select('*, perguntas'); // Selecionar a coluna 'perguntas'
      
      if (error) throw error;
      res.json(data);
    } else {
      res.json(mockCampaigns.map(c => ({ ...c, questions: c.perguntas })));
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get campaign by ID
app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (supabase) {
      const { data: campaignData, error } = await supabase
        .from('campanhas')
        .select('*, perguntas') // Selecionar a coluna 'perguntas'
        .eq('id', id)
        .single();
      
      if (error) throw error;
      const campaign = { ...campaignData, questions: campaignData.perguntas || [] };
      delete campaign.perguntas; // Remover a coluna original se não for mais necessária no objeto retornado
      res.json(campaign);
    } else {
      const campaign = mockCampaigns.find(c => c.id === id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      res.json({ ...campaign, questions: campaign.perguntas });
    }
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get questions for a campaign
app.get('/api/campaigns/:id/questions', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('campanhas')
        .select('perguntas')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      res.json(data ? data.perguntas : []);
    } else {
      const campaign = mockCampaigns.find(c => c.id === id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      res.json(campaign.perguntas);
    }
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new campaign
app.post('/api/campaigns', async (req, res) => {
  try {
    const { questions, ...campaignData } = req.body;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('campanhas')
        .insert([{ ...campaignData, perguntas: questions || [] }])
        .select()
        .single();
      
      if (error) throw error;
      res.status(201).json({ ...data, questions: data.perguntas });
    } else {
      const newCampaign = { ...campaignData, id: `mock-${Date.now()}`, perguntas: questions || [] };
      mockCampaigns.push(newCampaign);
      res.status(201).json({ ...newCampaign, questions: newCampaign.perguntas });
    }
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update campaign
app.put('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { questions, ...campaignData } = req.body;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('campanhas')
        .update({ ...campaignData, perguntas: questions || [] })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      res.json({ ...data, questions: data.perguntas });
    } else {
      const campaignIndex = mockCampaigns.findIndex(c => c.id === id);
      if (campaignIndex === -1) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      mockCampaigns[campaignIndex] = { ...mockCampaigns[campaignIndex], ...campaignData, perguntas: questions || [] };
      res.json({ ...mockCampaigns[campaignIndex], questions: mockCampaigns[campaignIndex].perguntas });
    }
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update questions for a campaign
app.put('/api/campaigns/:id/questions', async (req, res) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('campanhas')
        .update({ perguntas: questions })
        .eq('id', id)
        .select('perguntas')
        .single();
      
      if (error) throw error;
      res.json(data ? data.perguntas : []);
    } else {
      res.status(500).json({ error: 'Mock questions update not implemented for Supabase-focused changes.' });
    }
  } catch (error) {
    console.error('Error updating questions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit survey response
app.post('/api/surveys/:id/responses', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, answers } = req.body;
    
    const response = {
      campanha_id: id,
      cliente_email: email,
      respostas: answers,
      created_at: new Date().toISOString(),
    };
    
    if (supabase) {
      const { data, error } = await supabase
        .from('respostas')
        .insert([response])
        .select()
        .single();
      
      if (error) throw error;
      res.json(data);
    } else {
      response.id = Date.now();
      mockResponses.push(response);
      res.json(response);
    }
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get survey data (public endpoint)
app.get('/api/surveys/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (supabase) {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campanhas')
        .select('*, perguntas')
        .eq('id', id)
        .single();
      
      if (campaignError) throw campaignError;

      const campaign = { ...campaignData, questions: campaignData.perguntas || [] };
      delete campaign.perguntas;
      
      res.json({ campaign, questions: campaign.questions });
    } else {
      const campaign = mockCampaigns.find(c => c.id === id);
      if (!campaign) {
        return res.status(404).json({ error: 'Survey not found' });
      }
      res.json({ campaign, questions: campaign.perguntas });
    }
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard data
app.get('/api/campaigns/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params;

    if (supabase) {
      const { data: responses, error } = await supabase
        .from('respostas')
        .select('*, nota_nps, cliente_nome, cliente_email')
        .eq('campanha_id', id);

      if (error) throw error;

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
    } else {
      const dashboardData = {
        nps: -4.00,
        responseRate: 44.64,
        responses: 25,
        sends: 56,
        last10Days: [
          { date: '07/04', count: 0 },
          { date: '08/04', count: 0 },
          { date: '09/04', count: 0 },
          { date: '10/04', count: 0 },
          { date: '11/04', count: 0 },
          { date: '12/04', count: 0 },
          { date: '13/04', count: 0 },
          { date: '14/04', count: 0.25 },
          { date: '15/04', count: 0.75 },
          { date: '16/04', count: 1 },
        ],
        npsPercentage: [
          { category: 'Detratores', value: 33, color: '#ef4444' },
          { category: 'Passivos', value: 42, color: '#f59e0b' },
          { category: 'Promotores', value: 29, color: '#10b981' },
        ],
        npsScores: [
          { score: '0', count: 1 },
          { score: '1', count: 0 },
          { score: '2', count: 0 },
          { score: '3', count: 2 },
          { score: '4', count: 2 },
          { score: '5', count: 0 },
          { score: '6', count: 3 },
          { score: '7', count: 5 },
          { score: '8', count: 5 },
          { score: '9', count: 4 },
          { score: '10', count: 1 },
        ],
        latestResponses: [
          { id: 1, name: 'John Doe', email: 'john@doe.com', score: 7, category: 'Passivo' },
          { id: 2, name: 'John Doe', email: 'john1@doe.com', score: 3, category: 'Detrator' },
          { id: 3, name: 'John Doe', email: 'john2@doe.com', score: 8, category: 'Passivo' },
          { id: 4, name: 'John Doe', email: 'john24@doe.com', score: 6, category: 'Detrator' },
          { id: 5, name: 'John Doe', email: 'john25@doe.com', score: 8, category: 'Passivo' },
        ],
      };
      res.json(dashboardData);
    }
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

