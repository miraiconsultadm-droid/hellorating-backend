import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

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
  },
  {
    id: 'test-email',
    name: 'Teste E-mail',
    main_metric: 'NPS',
    redirect_enabled: false,
    redirect_rule: '',
    feedback_enabled: false,
    feedback_text: '',
  },
];

const mockQuestions = [
  {
    id: 1,
    campaign_id: 'NM8T29dcbcpc4b2',
    type: 'like_dislike',
    text: 'Com que frequência você utiliza os serviços da Netkings?',
    options: null,
    order: 1,
  },
  {
    id: 2,
    campaign_id: 'NM8T29dcbcpc4b2',
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
  {
    id: 3,
    campaign_id: 'NM8T29dcbcpc4b2',
    type: 'emotion',
    text: 'O atendimento ao cliente da Netkings é satisfatório?',
    options: [
      { value: 1, emoji: '😞' },
      { value: 2, emoji: '😊' },
    ],
    order: 3,
  },
  {
    id: 4,
    campaign_id: 'NM8T29dcbcpc4b2',
    type: 'stars',
    text: 'Você considera a variedade de produtos da Netkings adequada às suas necessidades?',
    options: null,
    order: 4,
  },
  {
    id: 5,
    campaign_id: 'NM8T29dcbcpc4b2',
    type: 'nps',
    text: 'Você recomendaria a Netkings para um amigo ou colega?',
    options: null,
    order: 5,
    is_main: true,
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
        .from('campaigns')
        .select('*');
      
      if (error) throw error;
      res.json(data);
    } else {
      res.json(mockCampaigns);
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
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      res.json(data);
    } else {
      const campaign = mockCampaigns.find(c => c.id === id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      res.json(campaign);
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
        .from('questions')
        .select('*')
        .eq('campaign_id', id)
        .order('order', { ascending: true });
      
      if (error) throw error;
      res.json(data);
    } else {
      const questions = mockQuestions.filter(q => q.campaign_id === id);
      res.json(questions);
    }
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update campaign
app.put('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      res.json(data);
    } else {
      const campaignIndex = mockCampaigns.findIndex(c => c.id === id);
      if (campaignIndex === -1) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      mockCampaigns[campaignIndex] = { ...mockCampaigns[campaignIndex], ...updates };
      res.json(mockCampaigns[campaignIndex]);
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
      // Delete existing questions
      await supabase
        .from('questions')
        .delete()
        .eq('campaign_id', id);
      
      // Insert new questions
      const { data, error } = await supabase
        .from('questions')
        .insert(questions.map(q => ({ ...q, campaign_id: id })))
        .select();
      
      if (error) throw error;
      res.json(data);
    } else {
      // Remove old questions
      const filteredQuestions = mockQuestions.filter(q => q.campaign_id !== id);
      // Add new questions
      questions.forEach((q, index) => {
        filteredQuestions.push({
          ...q,
          id: Date.now() + index,
          campaign_id: id,
        });
      });
      res.json(questions);
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
      campaign_id: id,
      user_email: email,
      answers: answers,
      created_at: new Date().toISOString(),
    };
    
    if (supabase) {
      const { data, error } = await supabase
        .from('responses')
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
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();
      
      if (campaignError) throw campaignError;
      
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('campaign_id', id)
        .order('order', { ascending: true });
      
      if (questionsError) throw questionsError;
      
      res.json({ campaign, questions });
    } else {
      const campaign = mockCampaigns.find(c => c.id === id);
      if (!campaign) {
        return res.status(404).json({ error: 'Survey not found' });
      }
      const questions = mockQuestions.filter(q => q.campaign_id === id);
      res.json({ campaign, questions });
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
    
    // Mock dashboard data
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

