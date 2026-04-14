// Lista de produtos em Fitcoin (FITC)
const products = [
  {
    id: 1,
    name: "Meia Esportiva Compressão Pro",
    category: "meias",
    priceFitcoin: 45,
    description: "Meia de alta compressão, ideal para corrida e treinos intensos.",
    icon: "🧦",
    tag: "Corrida"
  },
  {
    id: 2,
    name: "Meia Cano Baixo Training",
    category: "meias",
    priceFitcoin: 28,
    description: "Confortável, respirável e perfeita para o dia a dia esportivo.",
    icon: "🧦",
    tag: "Treino"
  },
  {
    id: 3,
    name: "Whey Protein Isolado 900g",
    category: "suplementos",
    priceFitcoin: 210,
    description: "Alto teor de proteína, baixo carboidrato, ideal para ganho de massa.",
    icon: "🧃",
    tag: "Pós-treino"
  },
  {
    id: 4,
    name: "Creatina Monohidratada 300g",
    category: "suplementos",
    priceFitcoin: 135,
    description: "Aumenta força, potência e volume muscular.",
    icon: "⚗️",
    tag: "Performance"
  },
  {
    id: 5,
    name: "Camisa Dry-Fit Running",
    category: "camisas",
    priceFitcoin: 95,
    description: "Tecido leve e respirável para corridas longas.",
    icon: "👕",
    tag: "Running"
  },
  {
    id: 6,
    name: "Camisa Regata Treino Intenso",
    category: "camisas",
    priceFitcoin: 88,
    description: "Liberdade total de movimento e secagem rápida.",
    icon: "👚",
    tag: "Academia"
  },
  {
    id: 7,
    name: "Cinto de Musculação Pro",
    category: "acessorios",
    priceFitcoin: 120,
    description: "Estabilidade extra para levantamento de peso e agachamentos.",
    icon: "🏋️",
    tag: "Musculação"
  },
  {
    id: 8,
    name: "Shaker Antivazamento 700ml",
    category: "acessorios",
    priceFitcoin: 36,
    description: "Ideal para misturar suplementos com praticidade.",
    icon: "🥤",
    tag: "Suplementos"
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
        <span>${product.icon}</span>
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
  switch (cat) {
    case "meias":
      return "Meias";
    case "suplementos":
      return "Suplementos";
    case "camisas":
      return "Camisas";
    case "acessorios":
      return "Acessórios";
    default:
      return cat;
  }
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