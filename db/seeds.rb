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

load Rails.root.join("db/seeds/legacy_products.rb")
if Product.count < LEGACY_PRODUCTS.size
  counts = Legacy::CatalogImporter.call(replace_products: Product.any?)
  puts "Catálogo legado: #{counts[:products]} produtos importados."
end

puts "Seeds concluídos: #{User.count} admins, #{Product.count} produtos, #{CatalogCategory.count} categorias."
