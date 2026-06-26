# frozen_string_literal: true

admin_password = ENV.fetch("ADMIN_PASSWORD", "altere-esta-senha")

[
  "epilian.silva@redemontagens.com.br",
  "raillen.santos@redemontagens.com.br"
].each do |email|
  User.find_or_create_by!(email: email) do |user|
    user.password = admin_password
    user.role = :admin
  end
end

[
  [ "alimentos-proteicos", "Alimentos Proteicos", 1 ],
  [ "equipamentos", "Equipamentos", 2 ],
  [ "protecao-solar", "Proteção Solar", 3 ],
  [ "vitaminas-minerais", "Vitaminas & Minerais", 4 ],
  [ "acessorios-musculacao", "Acessórios Musculação", 5 ],
  [ "medicao", "Medição", 6 ],
  [ "vestuario", "Vestuário", 7 ],
  [ "creatina-energia", "Creatina & Energia", 8 ],
  [ "proteinas", "Proteínas", 9 ],
  [ "eletronicos", "Eletrônicos", 10 ]
].each do |slug, label, sort_order|
  CatalogCategory.find_or_create_by!(slug: slug) do |category|
    category.label = label
    category.sort_order = sort_order
  end
end

[
  [ "Proteína", "#0f766e", 1 ],
  [ "Nutrição", "#0369a1", 2 ],
  [ "Composição", "#7c3aed", 3 ],
  [ "Energia", "#ea580c", 4 ],
  [ "Geral", "#6b7280", 5 ]
].each do |name, color, sort_order|
  CatalogTag.find_or_create_by!(name: name) do |tag|
    tag.color = color
    tag.sort_order = sort_order
  end
end

[
  [ "Tamanho", "", true, false, '["P","M","G","GG"]', 1 ],
  [ "Volume", "ml", true, false, '["250","500","1000"]', 2 ],
  [ "Peso", "g", true, false, '["300","900","1800"]', 3 ],
  [ "Cor", "", false, true, '["Preto","Branco","Azul"]', 4 ]
].each do |name, unit, required, allow_option_image, options_json, sort_order|
  VariationPreset.find_or_create_by!(name: name) do |preset|
    preset.unit = unit
    preset.required = required
    preset.allow_option_image = allow_option_image
    preset.options_json = options_json
    preset.sort_order = sort_order
  end
end

[
  {
    slot: 1,
    variant: "teal",
    title: "Troque seus Fitcoin",
    body: "Resgate equipamentos e suplementos com seu saldo Movimenta+.",
    link_label: "Ver catálogo",
    active: true
  },
  {
    slot: 2,
    variant: "blue",
    title: "Como funciona",
    body: "Escolha o produto, confirme o resgate e receba o retorno por e-mail.",
    link_label: "Saiba mais",
    active: true
  }
].each do |attrs|
  CatalogCtaCard.find_or_create_by!(slot: attrs[:slot]) do |card|
    card.assign_attributes(attrs)
  end
end

if Product.none?
  [
    {
      name: "Bebida Proteica Pronta (250ml)",
      category: "alimentos-proteicos",
      price_fitc: 8,
      description: "Bebida pronta com 20-30g de proteína por embalagem.",
      image_url: "https://images.unsplash.com/photo-1693996045300-521e9d08cabc?w=400&auto=format&fit=crop&q=70",
      tag: "Proteína"
    },
    {
      name: "Porta Número (Corrida)",
      category: "equipamentos",
      price_fitc: 10,
      description: "Suporte para prender número de corrida na roupa.",
      image_url: "https://images.unsplash.com/photo-1776795279350-491ab63f113a?w=400&auto=format&fit=crop&q=70",
      tag: "Corrida"
    },
    {
      name: "Protetor Labial com Proteção Solar",
      category: "protecao-solar",
      price_fitc: 15,
      description: "Protetor labial com FPS 30+ e hidratação.",
      image_url: "https://images.unsplash.com/photo-1630275506439-a4ddf976eebf?w=400&auto=format&fit=crop&q=70",
      tag: "FPS 30+"
    },
    {
      name: "Vitamina B Complex",
      category: "vitaminas-minerais",
      price_fitc: 20,
      description: "Complexo B completo com B1, B2, B3, B5, B6, B7, B9 e B12.",
      image_url: "https://images.unsplash.com/photo-1704650311298-4d6915d34c64?w=400&auto=format&fit=crop&q=70",
      tag: "Vitaminas"
    },
    {
      name: "Bola de Tênis (Tubo com 3)",
      category: "equipamentos",
      price_fitc: 20,
      description: "Conjunto com 3 bolas de tênis de alta qualidade.",
      image_url: "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=400&auto=format&fit=crop&q=70",
      tag: "Tênis"
    },
    {
      name: "Creatina Monohidratada 100% Pura",
      category: "creatina-energia",
      price_fitc: 45,
      description: "Creatina monohidratada em pó, 100% pura e sem aditivos.",
      image_url: "https://images.unsplash.com/photo-1704650311298-4d6915d34c64?w=400&auto=format&fit=crop&q=70",
      tag: "Performance"
    },
    {
      name: "Whey Protein Isolado Concentrado Hidrolisado",
      category: "proteinas",
      price_fitc: 150,
      description: "Proteína de soro do leite em três formas para absorção rápida e máxima síntese proteica.",
      image_url: "https://images.unsplash.com/photo-1693996045300-521e9d08cabc?w=400&auto=format&fit=crop&q=70",
      tag: "Whey"
    }
  ].each do |attrs|
    Product.create!(attrs.merge(active: true))
  end
end

puts "Seeds concluídos: #{User.count} admins, #{Product.count} produtos, #{CatalogCategory.count} categorias."
