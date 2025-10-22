// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://hellorating-backend-agk94mq2c-mirais-projects-4170fb35.vercel.app';

// Mock data (mantido apenas como referência, não será usado em produção)
const mockData = {
  campaigns: [
    {
      id: 'NM8T29dcbcpc4b2',
      name: 'Campanha teste',
      mainMetric: 'NPS',
      redirectEnabled: true,
      redirectRule: 'promotores',
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      feedbackEnabled: false,
      feedbackText: '',
      questions: [
        {
          id: 1,
          type: 'like_dislike',
          text: 'Com que frequência você utiliza os serviços da empresa?',
          order: 1,
        },
        {
          id: 2,
          type: 'emotion_scale',
          text: 'O site é fácil de usar e navegar?',
          order: 2,
        },
        {
          id: 3,
          type: 'emotion',
          text: 'O atendimento ao cliente é satisfatório?',
          order: 3,
        },
        {
          id: 4,
          type: 'stars',
          text: 'Você considera a variedade de produtos adequada às suas necessidades?',
          order: 4,
        },
        {
          id: 5,
          type: 'nps',
          text: 'Quanto você recomendaria a empresa para um amigo ou colega?',
          order: 5,
          isMain: true,
        },
      ],
    }
  ],
  questions: [
    {
      id: 1,
      type: 'like_dislike',
      text: 'Com que frequência você utiliza os serviços da empresa?',
      order: 1,
    },
    {
      id: 2,
      type: 'emotion_scale',
      text: 'O site é fácil de usar e navegar?',
      order: 2,
    },
    {
      id: 3,
      type: 'emotion',
      text: 'O atendimento ao cliente é satisfatório?',
      order: 3,
    },
    {
      id: 4,
      type: 'stars',
      text: 'Você considera a variedade de produtos adequada às suas necessidades?',
      order: 4,
    },
    {
      id: 5,
      type: 'nps',
      text: 'Quanto você recomendaria a Gi...',
      order: 5,
      isMain: true,
    },
  ],
  dashboard: {
    nps: -4,
    responseRate: 44.64,
    npsPercentage: [
      { category: 'Promotores', value: '29.00', color: '#10b981' },
      { category: 'Passivos', value: '42.00', color: '#f59e0b' },
      { category: 'Detratores', value: '33.00', color: '#ef4444' },
    ],
    npsScores: [
      { score: '0', count: 1 },
      { score: '1', count: 0 },
      { score: '2', count: 2 },
      { score: '3', count: 2 },
      { score: '4', count: 0 },
      { score: '5', count: 3 },
      { score: '6', count: 0 },
      { score: '7', count: 5 },
      { score: '8', count: 5 },
      { score: '9', count: 4 },
      { score: '10', count: 1 },
    ],
    latestResponses: [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@doe.com',
        score: 7,
        category: 'Passivo',
        date: '2024-04-15',
      },
      {
        id: 2,
        name: 'John Doe',
        email: 'john1@doe.com',
        score: 3,
        category: 'Detrator',
        date: '2024-04-15',
      },
      {
        id: 3,
        name: 'John Doe',
        email: 'john2@doe.com',
        score: 8,
        category: 'Passivo',
        date: '2024-04-15',
      },
      {
        id: 4,
        name: 'John Doe',
        email: 'john24@doe.com',
        score: 6,
        category: 'Detrator',
        date: '2024-04-15',
      },
      {
        id: 5,
        name: 'John Doe',
        email: 'john25@doe.com',
        score: 8,
        category: 'Passivo',
        date: '2024-04-15',
      },
    ],
  }
};

// Helper function for API calls with improved error handling
async function apiCall(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API] Making ${options.method || 'GET'} request to: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Tentar parsear a resposta como JSON para obter detalhes do erro
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = { message: response.statusText };
    }

    if (!response.ok) {
      const errorMessage = responseData?.error || responseData?.message || `HTTP error! status: ${response.status}`;
      const errorDetails = responseData?.details || null;
      
      console.error(`[API] Error response:`, {
        status: response.status,
        error: errorMessage,
        details: errorDetails
      });
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.details = errorDetails;
      throw error;
    }

    console.log(`[API] Success response from ${endpoint}`);
    return responseData;
    
  } catch (error) {
    console.error(`[API] Call failed for ${endpoint}:`, {
      message: error.message,
      status: error.status,
      details: error.details
    });
    throw error;
  }
}

// API methods
export const api = {
  // Campaigns
  getCampaigns: () => apiCall('/api/campaigns'),
  
  getCampaign: (id) => apiCall(`/api/campaigns/${id}`),
  
  // CORRIGIDO: Removida duplicação, mantido apenas um método updateCampaign
  updateCampaign: (id, data) => apiCall(`/api/campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  createCampaign: (data) => apiCall(`/api/campaigns`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getCampaignQuestions: (id) => apiCall(`/api/campaigns/${id}/questions`),
  
  updateCampaignQuestions: (id, questions) => apiCall(`/api/campaigns/${id}/questions`, {
    method: 'PUT',
    body: JSON.stringify({ questions }),
  }),
  
  getDashboardData: (id) => apiCall(`/api/campaigns/${id}/dashboard`),
  
  // Surveys (Public)
  getSurvey: (id) => apiCall(`/api/surveys/${id}`),
  
  submitSurveyResponse: (id, data) => apiCall(`/api/surveys/${id}/responses`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Responses
  submitResponse: (data) => {
    // Salvar no localStorage
    const responses = JSON.parse(localStorage.getItem('responses') || '[]');
    responses.push(data);
    localStorage.setItem('responses', JSON.stringify(responses));
    
    // Tentar enviar para o backend
    return apiCall('/api/responses', {
      method: 'POST',
      body: JSON.stringify(data),
    }).catch((error) => {
      // Se falhar, apenas retornar sucesso (já salvou no localStorage)
      console.warn('[API] Failed to submit response to backend, but saved locally:', error.message);
      return { success: true };
    });
  },
  
  getResponses: (campaignId = null) => {
    const responses = JSON.parse(localStorage.getItem('responses') || '[]');
    console.log('API - Respostas lidas do localStorage:', responses);
    if (campaignId) {
      return responses.filter(r => r.campaignId === campaignId);
    }
    return responses;
  },
};

