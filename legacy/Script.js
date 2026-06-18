// Lista de produtos em Fitcoin (FITC)
const products = [
  // ALIMENTOS PROTEICOS
  {
    id: 1,
    name: "Bebida Proteica Pronta (250ml)",
    category: "alimentos-proteicos",
    priceFitcoin: 8,
    description: "Bebida pronta com 20-30g de proteína por embalagem.",
    image: "https://images.unsplash.com/photo-1693996045300-521e9d08cabc?w=400&auto=format&fit=crop&q=70",
    tag: "Proteína"
  },
  {
    id: 7,
    name: "Isotônico (Pó - 1kg)",
    category: "alimentos-proteicos",
    priceFitcoin: 25,
    description: "Bebida isotônica em pó com eletrólitos e carboidratos.",
    image: "https://images.unsplash.com/photo-1704650311162-153bbf7f17b0?w=400&auto=format&fit=crop&q=70",
    tag: "Hidratação"
  },
  {
    id: 14,
    name: "Gel de Carboidrato (1kg)",
    category: "alimentos-proteicos",
    priceFitcoin: 35,
    description: "Gel energético com carboidratos de rápida absorção.",
    image: "https://images.unsplash.com/photo-1704650311974-8ce378f0e8b0?w=400&auto=format&fit=crop&q=70",
    tag: "Energia"
  },
  {
    id: 20,
    name: "Barra de Proteína (Caixa com 12)",
    category: "alimentos-proteicos",
    priceFitcoin: 50,
    description: "Barras de proteína com 20-25g de proteína cada.",
    image: "https://images.unsplash.com/photo-1704650311298-4d6915d34c64?w=400&auto=format&fit=crop&q=70",
    tag: "Proteína"
  },
  // EQUIPAMENTOS
  {
    id: 2,
    name: "Porta Número (Corrida)",
    category: "equipamentos",
    priceFitcoin: 10,
    description: "Suporte para prender número de corrida na roupa.",
    image: "https://images.unsplash.com/photo-1776795279350-491ab63f113a?w=400&auto=format&fit=crop&q=70",
    tag: "Corrida"
  },
  {
    id: 5,
    name: "Bola de Tênis (Tubo com 3)",
    category: "equipamentos",
    priceFitcoin: 20,
    description: "Conjunto com 3 bolas de tênis de alta qualidade.",
    image: "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=400&auto=format&fit=crop&q=70",
    tag: "Tênis"
  },
  {
    id: 11,
    name: "Kit Mini Band (4 peças)",
    category: "equipamentos",
    priceFitcoin: 30,
    description: "Conjunto de fitas elásticas com diferentes resistências.",
    image: "https://images.unsplash.com/photo-1584827386916-b5351d3ba34b?w=400&auto=format&fit=crop&q=70",
    tag: "Funcional"
  },
  {
    id: 22,
    name: "Bola de Voleibol",
    category: "equipamentos",
    priceFitcoin: 50,
    description: "Bola de voleibol oficial para treinos e jogos.",
    image: "https://images.unsplash.com/photo-1592656094267-764a45160876?w=400&auto=format&fit=crop&q=70",
    tag: "Vôlei"
  },
  {
    id: 30,
    name: "Kit Pickleball (2 raquetes + 4 bolas)",
    category: "equipamentos",
    priceFitcoin: 100,
    description: "Kit completo para jogar pickleball com 2 raquetes e 4 bolas.",
    image: "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=400&auto=format&fit=crop&q=70",
    tag: "Pickleball"
  },
  {
    id: 34,
    name: "Raquete de Beach Tênis",
    category: "equipamentos",
    priceFitcoin: 150,
    description: "Raquete específica para beach tênis com peso leve.",
    image: "https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=400&auto=format&fit=crop&q=70",
    tag: "Beach Tênis"
  },
  {
    id: 40,
    name: "Bike Ergométrica (até 700 reais)",
    category: "equipamentos",
    priceFitcoin: 400,
    description: "Bicicleta estacionária com resistência ajustável.",
    image: "https://images.unsplash.com/photo-1600679472025-f74038492f72?w=400&auto=format&fit=crop&q=70",
    tag: "Cardio"
  },
  // PROTEÇÃO SOLAR
  {
    id: 3,
    name: "Protetor Labial com Proteção Solar",
    category: "protecao-solar",
    priceFitcoin: 15,
    description: "Protetor labial com FPS 30+ e hidratação.",
    image: "https://images.unsplash.com/photo-1630275506439-a4ddf976eebf?w=400&auto=format&fit=crop&q=70",
    tag: "FPS 30+"
  },
  {
    id: 12,
    name: "Protetor Solar Corpo (200ml)",
    category: "protecao-solar",
    priceFitcoin: 30,
    description: "Protetor solar corporal com FPS 50+ e fórmula resistente à água.",
    image: "https://images.unsplash.com/photo-1685122089837-9eda7396bf86?w=400&auto=format&fit=crop&q=70",
    tag: "FPS 50+"
  },
  {
    id: 18,
    name: "Protetor Solar Rosto (FPS 50+)",
    category: "protecao-solar",
    priceFitcoin: 40,
    description: "Protetor solar facial com FPS 50+ e resistência à água.",
    image: "https://images.unsplash.com/photo-1695918428487-7934244c19ac?w=400&auto=format&fit=crop&q=70",
    tag: "FPS 50+"
  },
  {
    id: 27,
    name: "Camisa com Fator de Proteção Solar (UPF 50+)",
    category: "protecao-solar",
    priceFitcoin: 80,
    description: "Camisa esportiva com proteção UV.",
    image: "https://images.unsplash.com/photo-1600679472183-07cc4f68b140?w=400&auto=format&fit=crop&q=70",
    tag: "UPF 50+"
  },
  {
    id: 28,
    name: "Óculos de Sol Esportivo",
    category: "protecao-solar",
    priceFitcoin: 80,
    description: "Óculos com proteção UV 100% e lentes polarizadas.",
    image: "https://images.unsplash.com/photo-1614660762109-bb0157fcbd7d?w=400&auto=format&fit=crop&q=70",
    tag: "UV 100%"
  },
  // VITAMINAS & MINERAIS
  {
    id: 4,
    name: "Vitamina B Complex",
    category: "vitaminas-minerais",
    priceFitcoin: 20,
    description: "Complexo B completo com B1, B2, B3, B5, B6, B7, B9 e B12.",
    image: "https://images.unsplash.com/photo-1704650311298-4d6915d34c64?w=400&auto=format&fit=crop&q=70",
    tag: "Vitaminas"
  },
  {
    id: 6,
    name: "Vitamina D (1000-2000 IU)",
    category: "vitaminas-minerais",
    priceFitcoin: 25,
    description: "Vitamina D3 essencial para absorção de cálcio, saúde óssea e sistema imunológico.",
    image: "https://images.unsplash.com/photo-1704650311162-153bbf7f17b0?w=400&auto=format&fit=crop&q=70",
    tag: "Vitaminas"
  },
  {
    id: 9,
    name: "Magnésio (400-500mg)",
    category: "vitaminas-minerais",
    priceFitcoin: 30,
    description: "Mineral essencial para relaxamento muscular, redução de cãibras e melhora do sono.",
    image: "https://images.unsplash.com/photo-1704650311974-8ce378f0e8b0?w=400&auto=format&fit=crop&q=70",
    tag: "Minerais"
  },
  {
    id: 13,
    name: "Ômega 3 (1000-1200mg)",
    category: "vitaminas-minerais",
    priceFitcoin: 35,
    description: "Óleo de peixe rico em ácidos graxos ômega-3 (EPA e DHA).",
    image: "https://images.unsplash.com/photo-1704650311298-4d6915d34c64?w=400&auto=format&fit=crop&q=70",
    tag: "Ômega 3"
  },
  {
    id: 15,
    name: "Colágeno Hidrolisado (10g)",
    category: "vitaminas-minerais",
    priceFitcoin: 40,
    description: "Proteína de colágeno hidrolisado para saúde de pele, cabelo, unhas e articulações.",
    image: "https://images.unsplash.com/photo-1704650311162-153bbf7f17b0?w=400&auto=format&fit=crop&q=70",
    tag: "Colágeno"
  },
  // ACESSÓRIOS MUSCULAÇÃO
  {
    id: 8,
    name: "Punch Strap Musculação",
    category: "acessorios-musculacao",
    priceFitcoin: 25,
    description: "Fita de suporte para pulso durante levantamento de pesos.",
    image: "https://images.unsplash.com/photo-1557127972-1c446ea89ea5?w=400&auto=format&fit=crop&q=70",
    tag: "Suporte"
  },
  {
    id: 16,
    name: "Luva de Musculação (Par)",
    category: "acessorios-musculacao",
    priceFitcoin: 40,
    description: "Luva com proteção de palma e suporte de pulso.",
    image: "https://images.unsplash.com/photo-1570442387127-66eb80e00938?w=400&auto=format&fit=crop&q=70",
    tag: "Academia"
  },
  {
    id: 23,
    name: "Cinto de Musculação",
    category: "acessorios-musculacao",
    priceFitcoin: 60,
    description: "Cinto de couro ou neoprene para suporte abdominal durante levantamento pesado.",
    image: "https://images.unsplash.com/photo-1603698819488-03c6e857d280?w=400&auto=format&fit=crop&q=70",
    tag: "Musculação"
  },
  {
    id: 26,
    name: "Gym Bag (Mochila)",
    category: "acessorios-musculacao",
    priceFitcoin: 80,
    description: "Mochila resistente para academia com compartimentos para sapatos, garrafa e eletrônicos.",
    image: "https://images.unsplash.com/photo-1535879335191-618713ec3e3f?w=400&auto=format&fit=crop&q=70",
    tag: "Mochila"
  },
  // MEDIÇÃO
  {
    id: 10,
    name: "Balança Culinária Digital",
    category: "medicao",
    priceFitcoin: 30,
    description: "Balança digital para pesar alimentos e suplementos.",
    image: "https://images.unsplash.com/photo-1665860455418-017fa50d29bc?w=400&auto=format&fit=crop&q=70",
    tag: "Nutrição"
  },
  {
    id: 33,
    name: "Balança de Bioimpedância",
    category: "medicao",
    priceFitcoin: 150,
    description: "Balança que mede peso, percentual de gordura, massa muscular e hidratação.",
    image: "https://images.unsplash.com/photo-1696688713460-de12ac76ebc6?w=400&auto=format&fit=crop&q=70",
    tag: "Composição"
  },
  // VESTUÁRIO
  {
    id: 17,
    name: "Meias de Compressão",
    category: "vestuario",
    priceFitcoin: 40,
    description: "Meias com compressão graduada para melhorar circulação.",
    image: "https://images.unsplash.com/photo-1776860850757-a12ec6e457e2?w=400&auto=format&fit=crop&q=70",
    tag: "Corrida"
  },
  {
    id: 21,
    name: "Camisa de Corrida (Respirável)",
    category: "vestuario",
    priceFitcoin: 50,
    description: "Camiseta de corrida em tecido respirável que afasta suor.",
    image: "https://images.unsplash.com/photo-1685122089837-9eda7396bf86?w=400&auto=format&fit=crop&q=70",
    tag: "Running"
  },
  {
    id: 24,
    name: "Camisa Térmica (Compressão)",
    category: "vestuario",
    priceFitcoin: 60,
    description: "Camisa de compressão térmica para manter temperatura corporal.",
    image: "https://images.unsplash.com/photo-1600679472025-f74038492f72?w=400&auto=format&fit=crop&q=70",
    tag: "Compressão"
  },
  {
    id: 25,
    name: "Bermuda de Ciclismo e Corrida",
    category: "vestuario",
    priceFitcoin: 70,
    description: "Bermuda com tecido respirável e almofadado.",
    image: "https://images.unsplash.com/photo-1614660762109-bb0157fcbd7d?w=400&auto=format&fit=crop&q=70",
    tag: "Ciclismo"
  },
  {
    id: 38,
    name: "Tênis Esportivo (Corrida/Musculação)",
    category: "vestuario",
    priceFitcoin: 200,
    description: "Tênis com amortecimento e suporte adequado.",
    image: "https://images.unsplash.com/photo-1554139897-afbea21ce34a?w=400&auto=format&fit=crop&q=70",
    tag: "Calçado"
  },
  // CREATINA & ENERGIA
  {
    id: 19,
    name: "Creatina Monohidratada 100% Pura",
    category: "creatina-energia",
    priceFitcoin: 45,
    description: "Creatina monohidratada em pó, 100% pura e sem aditivos.",
    image: "https://images.unsplash.com/photo-1704650311298-4d6915d34c64?w=400&auto=format&fit=crop&q=70",
    tag: "Performance"
  },
  {
    id: 31,
    name: "Pré-Treino (Fórmula Completa)",
    category: "creatina-energia",
    priceFitcoin: 120,
    description: "Suplemento com cafeína, beta-alanina, citrulina e outros estimulantes.",
    image: "https://images.unsplash.com/photo-1704650311162-153bbf7f17b0?w=400&auto=format&fit=crop&q=70",
    tag: "Pré-Treino"
  },
  {
    id: 36,
    name: "Supercoffe (Café Termogênico)",
    category: "creatina-energia",
    priceFitcoin: 180,
    description: "Bebida em pó à base de café com colágeno, cafeína e termogênicos.",
    image: "https://images.unsplash.com/photo-1704650311974-8ce378f0e8b0?w=400&auto=format&fit=crop&q=70",
    tag: "Termogênico"
  },
  // PROTEÍNAS
  {
    id: 32,
    name: "Whey Protein Isolado Concentrado Hidrolisado",
    category: "proteinas",
    priceFitcoin: 150,
    description: "Proteína de soro do leite em três formas (isolada, concentrada e hidrolisada) para absorção rápida e máxima síntese proteica.",
    image: "https://images.unsplash.com/photo-1693996045300-521e9d08cabc?w=400&auto=format&fit=crop&q=70",
    tag: "Whey"
  },
  {
    id: 35,
    name: "Whey Protein Vegano Zero Lactose",
    category: "proteinas",
    priceFitcoin: 180,
    description: "Proteína vegetal à base de ervilha e arroz, livre de lactose e glúten.",
    image: "https://images.unsplash.com/photo-1704650311298-4d6915d34c64?w=400&auto=format&fit=crop&q=70",
    tag: "Vegano"
  },
  // ELETRÔNICOS
  {
    id: 29,
    name: "Fone de Ouvido Esportivo",
    category: "eletronicos",
    priceFitcoin: 100,
    description: "Fone sem fio com resistência à água e suor.",
    image: "https://images.unsplash.com/photo-1619037961428-e6410a7afd38?w=400&auto=format&fit=crop&q=70",
    tag: "Bluetooth"
  },
  {
    id: 37,
    name: "Smartwatch Fitness",
    category: "eletronicos",
    priceFitcoin: 200,
    description: "Relógio inteligente com monitor de frequência cardíaca, contador de passos, rastreamento de calorias.",
    image: "https://images.unsplash.com/photo-1532435109783-fdb8a2be0baa?w=400&auto=format&fit=crop&q=70",
    tag: "Wearable"
  },
  {
    id: 39,
    name: "Smart Ring Fitness",
    category: "eletronicos",
    priceFitcoin: 300,
    description: "Anel inteligente que monitora frequência cardíaca, sono e atividade.",
    image: "https://images.unsplash.com/photo-1696688713460-de12ac76ebc6?w=400&auto=format&fit=crop&q=70",
    tag: "Wearable"
  }
];

const productsGrid = document.getElementById("productsGrid");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");

let activeCategory = "all";
let searchTerm = "";

function renderProducts() {
  productsGrid.innerHTML = "";

  const filtered = products.filter((product) => {
    const matchesCategory =
      activeCategory === "all" || product.category === activeCategory;

    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    productsGrid.innerHTML =
      '<p style="color:#9ca3af;font-size:0.9rem;">Nenhum produto encontrado com os filtros atuais.</p>';
    return;
  }

  filtered.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.style.cursor = "pointer";

    card.innerHTML = `
      <span class="product-badge">${product.tag}</span>

      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy"
          style="width:100%;height:100%;object-fit:cover;border-radius:inherit;"
          onerror="this.style.display='none'">
      </div>

      <h3 class="product-title">${product.name}</h3>

      <p class="product-description">
        ${product.description}
      </p>

      <div class="product-footer">
        <div>
          <span class="product-price">${product.priceFitcoin.toFixed(0)}</span>
          <span class="price-unit">FITC</span>
        </div>
        <div class="product-meta">
          Categoria: ${formatCategory(product.category)}
        </div>
      </div>
    `;

    // Ao clicar no card, vai para a página de detalhes
    card.addEventListener("click", () => {
      window.location.href = `produto.html?id=${product.id}`;
    });

    productsGrid.appendChild(card);
  });
}

function formatCategory(cat) {
  const map = {
    "alimentos-proteicos": "Alimentos Proteicos",
    "equipamentos": "Equipamentos",
    "protecao-solar": "Proteção Solar",
    "vitaminas-minerais": "Vitaminas & Minerais",
    "acessorios-musculacao": "Acessórios Musculação",
    "medicao": "Medição",
    "vestuario": "Vestuário",
    "creatina-energia": "Creatina & Energia",
    "proteinas": "Proteínas",
    "eletronicos": "Eletrônicos"
  };
  return map[cat] || cat;
}

// Eventos – filtro por categoria
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeCategory = btn.dataset.category;
    renderProducts();
  });
});

// Eventos – busca por nome
searchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value;
  renderProducts();
});

// Render inicial
renderProducts();