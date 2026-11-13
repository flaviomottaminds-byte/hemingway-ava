# Hemingway School - AVA para a Comunidade Imigrante nos EUA 🇺🇸 🇧🇷 🇪🇸

Um **Ambiente Virtual de Aprendizagem (AVA / LMS)** moderno, inclusivo e responsivo, desenvolvido com **React, TypeScript, Vite, Tailwind CSS e i18next**, voltado especificamente para apoiar imigrantes nos Estados Unidos em sua jornada educacional, legal, financeira e de adaptação linguística.

---

## 🌟 Principais Recursos

- **Suporte Nativo a Três Idiomas**: Português (`pt`), Inglês (`en`) e Espanhol (`es`).
- **Troca Instantânea sem Recarregar a Página**:
  - Seletor de idiomas responsivo e interativo localizado na barra superior (`Topbar`) e na tela de autenticação (`LoginView`).
  - Utiliza `react-i18next` com renderização reativa em tempo real.
- **Persistência no LocalStorage**:
  - A preferência do usuário é salva sob a chave `ava_preferred_language`.
  - Ao recarregar ou reabrir o navegador, o sistema restabelece automaticamente o idioma escolhido.
- **Arquitetura Limpa e Modular (Clean Architecture)**:
  - Separação rigorosa de domínios, serviços de armazenamento, componentes de apresentação reutilizáveis e módulos de negócio (*features*).
- **Conteúdo Contextualizado para Imigrantes**:
  - *Inglês Prático para o Mercado de Trabalho*
  - *Direitos Trabalhistas (FLSA, OSHA, W-2 vs 1099)*
  - *Sistema Financeiro & Credit Score nos EUA*
  - *Preparatório para o Teste Cívico de Cidadania Americana (USCIS)*

---

## 📁 Estrutura de Pastas (Arquitetura Limpa)

```text
ava-imigrantes/
├── public/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── LanguageSelector.tsx   # Seletor interativo com flags e persistência
│   │   └── layout/
│   │       ├── Sidebar.tsx            # Navegação lateral responsiva multilíngue
│   │       └── Topbar.tsx             # Barra superior com logo, busca e i18n
│   ├── features/
│   │   ├── auth/
│   │   │   └── LoginView.tsx          # Autenticação com i18n e modo demo
│   │   ├── classroom/
│   │   │   └── LessonView.tsx         # Sala de aula, transcrição e materiais
│   │   └── dashboard/
│   │       └── StudentDashboardView.tsx # Dashboard com metas, trilhas e sessões
│   ├── locales/
│   │   ├── en.json                    # Arquivo base de tradução em Inglês
│   │   ├── es.json                    # Arquivo base de tradução em Espanhol
│   │   ├── pt.json                    # Arquivo base de tradução em Português
│   │   └── i18n.ts                    # Configuração centralizada do i18next
│   ├── services/
│   │   ├── mockData.ts                # Dados de domínio adaptados à comunidade
│   │   └── storage.ts                 # Camada de persistência segura (localStorage)
│   ├── types/
│   │   └── index.ts                   # Modelos e contratos TypeScript
│   ├── App.tsx                        # Orquestrador da aplicação
│   ├── index.css                      # Tailwind CSS v4 e estilos base
│   └── main.tsx                       # Ponto de entrada React 19
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Como Executar o Projeto

1. Abra o terminal na pasta do projeto:
   ```bash
   cd "C:\Users\flavi\.gemini\antigravity\scratch\ava-imigrantes"
   ```

2. Instale as dependências (já executado):
   ```bash
   npm install --legacy-peer-deps
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse no navegador:
   ```text
   http://localhost:5173
   ```
