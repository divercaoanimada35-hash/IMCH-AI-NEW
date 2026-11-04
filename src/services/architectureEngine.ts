
import { ArchitecturePlanResult } from '../types';

type ProjectCategory =
  | 'ecommerce'
  | 'restaurant'
  | 'dashboard'
  | 'blog'
  | 'portfolio'
  | 'booking'
  | 'saas'
  | 'web-application';

export class ProjectArchitectureEngine {

  static planArchitecture(
    prompt: string,
    projectType: string = 'web-application'
  ): ArchitecturePlanResult {

    const cleanPrompt = prompt.trim();
    const category = this.detectCategory(cleanPrompt, projectType);
    const projectName = this.inferProjectName(cleanPrompt);

    const commonStructure = [
      {
        path: 'index.html',
        purpose: 'Documento principal, SEO, metadados e configuração responsiva'
      },
      {
        path: 'src/App.tsx',
        purpose: 'Componente principal e organização das páginas'
      },
      {
        path: 'src/main.tsx',
        purpose: 'Ponto de entrada da aplicação'
      },
      {
        path: 'src/components/Header.tsx',
        purpose: 'Cabeçalho e navegação principal'
      },
      {
        path: 'src/components/Footer.tsx',
        purpose: 'Rodapé e informações institucionais'
      },
      {
        path: 'src/styles/global.css',
        purpose: 'Estilos globais, variáveis e responsividade'
      },
      {
        path: 'src/types/index.ts',
        purpose: 'Definições e contratos de dados TypeScript'
      }
    ];

    const categoryStructure = this.getCategoryStructure(category);

    const structure = [
      ...commonStructure,
      ...categoryStructure
    ];

    const recommendedStack = [
      'React',
      'TypeScript',
      'Vite',
      'Tailwind CSS',
      'Lucide Icons',
      'Componentização modular',
      'Design responsivo',
      'Arquitetura escalável'
    ];

    const keyFeatures = [
      'Interface profissional e responsiva',
      'Navegação funcional entre páginas',
      'Componentes reutilizáveis',
      'Organização modular de ficheiros',
      'Estados de carregamento e tratamento de erros',
      'Acessibilidade e boas práticas de SEO',
      'Código preparado para futuras integrações'
    ];

    return {
      projectName,
      recommendedStack,
      structure,
      keyFeatures,
      designTokens: {
        primaryColor: '#0066FF',
        typography: 'Inter, system-ui, -apple-system, sans-serif'
      }
    };
  }

  private static detectCategory(
    prompt: string,
    projectType: string
  ): ProjectCategory {

    const text = `${prompt} ${projectType}`.toLowerCase();

    const rules: Array<{
      category: ProjectCategory;
      keywords: string[];
    }> = [
      {
        category: 'ecommerce',
        keywords: [
          'ecommerce', 'e-commerce', 'loja online',
          'loja virtual', 'comprar', 'produtos',
          'carrinho', 'checkout', 'shopify'
        ]
      },
      {
        category: 'restaurant',
        keywords: [
          'restaurante', 'hamburgueria', 'pizzaria',
          'cafeteria', 'padaria', 'menu', 'ementa',
          'delivery', 'comida'
        ]
      },
      {
        category: 'dashboard',
        keywords: [
          'dashboard', 'painel administrativo',
          'administração', 'gestão', 'estatísticas',
          'relatórios', 'backoffice'
        ]
      },
      {
        category: 'blog',
        keywords: [
          'blog', 'notícias', 'artigos',
          'publicações', 'revista digital'
        ]
      },
      {
        category: 'portfolio',
        keywords: [
          'portfólio', 'portfolio', 'currículo',
          'freelancer', 'apresentação profissional'
        ]
      },
      {
        category: 'booking',
        keywords: [
          'reservas', 'agendamento', 'marcação',
          'consultas', 'hotel', 'alojamento',
          'booking'
        ]
      },
      {
        category: 'saas',
        keywords: [
          'saas', 'plataforma', 'assinaturas',
          'subscrições', 'utilizadores',
          'software online'
        ]
      }
    ];

    for (const rule of rules) {
      if (rule.keywords.some(keyword => text.includes(keyword))) {
        return rule.category;
      }
    }

    return 'web-application';
  }

  private static getCategoryStructure(
    category: ProjectCategory
  ) {

    const structures: Record<ProjectCategory, Array<{
      path: string;
      purpose: string;
    }>> = {

      ecommerce: [
        { path: 'src/pages/Home.tsx', purpose: 'Página inicial da loja' },
        { path: 'src/pages/Products.tsx', purpose: 'Catálogo de produtos' },
        { path: 'src/pages/ProductDetails.tsx', purpose: 'Detalhes de cada produto' },
        { path: 'src/pages/Cart.tsx', purpose: 'Carrinho de compras' },
        { path: 'src/pages/Checkout.tsx', purpose: 'Processo de finalização da compra' },
        { path: 'src/admin/Dashboard.tsx', purpose: 'Painel administrativo' },
        { path: 'src/admin/Products.tsx', purpose: 'Gestão de produtos' },
        { path: 'src/components/ProductCard.tsx', purpose: 'Cartão reutilizável de produto' },
        { path: 'src/services/cartService.ts', purpose: 'Gestão do carrinho' },
        { path: 'src/services/productService.ts', purpose: 'Gestão dos produtos' }
      ],

      restaurant: [
        { path: 'src/pages/Home.tsx', purpose: 'Apresentação do restaurante' },
        { path: 'src/pages/Menu.tsx', purpose: 'Menu e categorias de pratos' },
        { path: 'src/pages/About.tsx', purpose: 'História e apresentação' },
        { path: 'src/pages/Reservations.tsx', purpose: 'Reservas de mesas' },
        { path: 'src/pages/Contact.tsx', purpose: 'Contactos e localização' },
        { path: 'src/components/MenuCard.tsx', purpose: 'Apresentação dos pratos' },
        { path: 'src/components/ReservationForm.tsx', purpose: 'Formulário de reservas' },
        { path: 'src/services/menuService.ts', purpose: 'Gestão do menu' }
      ],

      dashboard: [
        { path: 'src/pages/Dashboard.tsx', purpose: 'Visão geral e indicadores' },
        { path: 'src/pages/Users.tsx', purpose: 'Gestão de utilizadores' },
        { path: 'src/pages/Reports.tsx', purpose: 'Relatórios e estatísticas' },
        { path: 'src/pages/Settings.tsx', purpose: 'Configurações do sistema' },
        { path: 'src/components/Sidebar.tsx', purpose: 'Navegação administrativa' },
        { path: 'src/components/StatisticsCard.tsx', purpose: 'Indicadores e métricas' },
        { path: 'src/services/dashboardService.ts', purpose: 'Dados do painel' }
      ],

      blog: [
        { path: 'src/pages/Home.tsx', purpose: 'Página inicial e artigos recentes' },
        { path: 'src/pages/Articles.tsx', purpose: 'Lista de artigos' },
        { path: 'src/pages/ArticleDetails.tsx', purpose: 'Leitura de artigos' },
        { path: 'src/pages/Categories.tsx', purpose: 'Categorias editoriais' },
        { path: 'src/admin/Editor.tsx', purpose: 'Criação e edição de artigos' },
        { path: 'src/components/ArticleCard.tsx', purpose: 'Cartão de artigo' },
        { path: 'src/services/articleService.ts', purpose: 'Gestão de conteúdos' }
      ],

      portfolio: [
        { path: 'src/pages/Home.tsx', purpose: 'Apresentação profissional' },
        { path: 'src/pages/About.tsx', purpose: 'Biografia e competências' },
        { path: 'src/pages/Projects.tsx', purpose: 'Projectos e trabalhos' },
        { path: 'src/pages/Contact.tsx', purpose: 'Contactos profissionais' },
        { path: 'src/components/ProjectCard.tsx', purpose: 'Apresentação dos projectos' }
      ],

      booking: [
        { path: 'src/pages/Home.tsx', purpose: 'Página inicial' },
        { path: 'src/pages/Services.tsx', purpose: 'Serviços disponíveis' },
        { path: 'src/pages/Booking.tsx', purpose: 'Sistema de agendamento' },
        { path: 'src/pages/MyBookings.tsx', purpose: 'Consulta de reservas' },
        { path: 'src/components/Calendar.tsx', purpose: 'Calendário de disponibilidade' },
        { path: 'src/services/bookingService.ts', purpose: 'Gestão de reservas' }
      ],

      saas: [
        { path: 'src/pages/Home.tsx', purpose: 'Página de apresentação' },
        { path: 'src/pages/Pricing.tsx', purpose: 'Planos e preços' },
        { path: 'src/pages/Login.tsx', purpose: 'Autenticação' },
        { path: 'src/pages/Register.tsx', purpose: 'Registo de utilizadores' },
        { path: 'src/pages/Dashboard.tsx', purpose: 'Área de trabalho' },
        { path: 'src/services/authService.ts', purpose: 'Serviço de autenticação' },
        { path: 'src/services/subscriptionService.ts', purpose: 'Gestão de subscrições' }
      ],

      'web-application': [
        { path: 'src/pages/Home.tsx', purpose: 'Página principal' },
        { path: 'src/pages/About.tsx', purpose: 'Apresentação' },
        { path: 'src/pages/Contact.tsx', purpose: 'Contactos' },
        { path: 'src/components/MainContent.tsx', purpose: 'Conteúdo principal' },
        { path: 'src/services/appService.ts', purpose: 'Lógica da aplicação' }
      ]
    };

    return structures[category];
  }

  private static inferProjectName(prompt: string): string {

    const cleaned = prompt
      .replace(/^(cria|criar|desenvolve|desenvolver|constrói|construir)\s+/i, '')
      .replace(/[.!?]+$/g, '')
      .trim();

    if (!cleaned) {
      return 'Projeto IMCH';
    }

    const words = cleaned.split(/\s+/).slice(0, 5);

    return words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
