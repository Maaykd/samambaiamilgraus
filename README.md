# Samambaia Mil Graus

Landing page oficial do projeto **Samambaia Mil Graus**, focada em humor, notícias da cidade e publicidade criativa para marcas locais.  
O site é totalmente estático, desenvolvido em **HTML, CSS e JavaScript**, e otimizado para rodar em **GitHub Pages** com domínio próprio.

## ✨ Funcionalidades

- Hero com apresentação do Bidô (Samambaia Mil Graus) e foto em destaque.
- Seção de métricas: seguidores, visualizações e quantidade de posts.
- Faixa animada de patrocinadores, com logos e Instagram de cada marca.
- Seção de conteúdo autoral com cards de:
  - Humor e entretenimento.
  - Notícias da cidade.
  - Publicidade diferenciada.
  - Denúncias e voz da comunidade.
- Estatísticas de público (Reels, Stories, homens/mulheres).
- Seção de contato com:
  - WhatsApp.
  - Instagram.
  - E‑mail.
- Painel admin simples (estático, usando `localStorage`) para:
  - Gerenciar conteúdo do hero.
  - Cadastrar patrocinadores (nome, @ e logo).
  - Configurar dados de contato.

## 🧱 Tecnologias

- **HTML5** para a estrutura das páginas.
- **CSS3** (arquivos em `assets/css`) para layout, responsividade e efeitos visuais.
- **JavaScript Vanilla** (arquivos em `assets/js`) para:
  - Montar as seções dinamicamente (`heroSection`, `sponsorsCarousel`, `contentSection`, etc.).
  - Gerenciar estado no navegador (`localStorage`).
  - Animações de scroll e carrossel.

## 📁 Estrutura do projeto

.
├── assets
│ ├── css
│ │ ├── base.css # estilos globais e fonte GTA
│ │ ├── navbar.css # navegação
│ │ ├── home.css # home, hero, sponsors, conteúdo e contato
│ │ ├── footer.css # rodapé
│ │ └── shop.css # (seção de loja, se usada)
│ ├── fonts
│ │ └── Pricedown Bl.otf # fonte estilo GTA
│ ├── img
│ │ └── hero
│ │ ├── bido.png # imagem principal do hero
│ │ └── estacio.jpg # exemplo de logo de patrocinador
│ └── js
│ ├── components
│ │ ├── heroSection.js
│ │ ├── sponsorsCarousel.js
│ │ ├── contentSection.js
│ │ ├── contactSection.js
│ │ ├── navbar.js
│ │ └── footer.js
│ ├── pages
│ │ ├── home.js
│ │ └── admin.js
│ └── state
│ ├── siteContentState.js
│ └── sponsorsState.js
├── index.html # página principal
├── admin.html # painel administrativo
└── shop.html # página de loja (opcional)