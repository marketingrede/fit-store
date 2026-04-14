<?php
// Endpoint simples para enviar e-mail com os dados do formulário.
// Requer que sua hospedagem suporte PHP e envio de e-mail (mail()).

header('Content-Type: application/json; charset=utf-8');

function json_error($message, $httpCode = 400) {
  http_response_code($httpCode);
  echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_error('Método inválido.', 405);
}

$name = isset($_POST['name']) ? trim((string)$_POST['name']) : '';
$email = isset($_POST['email']) ? trim((string)$_POST['email']) : '';
$productId = isset($_POST['productId']) ? trim((string)$_POST['productId']) : '';
$productName = isset($_POST['productName']) ? trim((string)$_POST['productName']) : '';
$productPriceFitc = isset($_POST['productPriceFitc']) ? trim((string)$_POST['productPriceFitc']) : '';

if ($name === '' || $email === '') {
  json_error('Preencha nome e e-mail.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  json_error('E-mail inválido.');
}

if ($productName === '') {
  json_error('Produto inválido.');
}

// Evita header injection
$nameSafe = preg_replace("/[\r\n]+/", " ", $name);
$emailSafe = preg_replace("/[\r\n]+/", " ", $email);
$productNameSafe = preg_replace("/[\r\n]+/", " ", $productName);
$productIdSafe = preg_replace("/[\r\n]+/", " ", $productId);
$productPriceSafe = preg_replace("/[\r\n]+/", " ", $productPriceFitc);

$to = 'epilian.silva@redemontagens.com.br';
$subject = 'Troca de Fitcoin - ' . $productNameSafe;

$body = "Solicitação de troca de Fitcoin\n\n"
  . "Nome: " . $nameSafe . "\n"
  . "E-mail: " . $emailSafe . "\n\n"
  . "Produto clicado:\n"
  . "- ID: " . $productIdSafe . "\n"
  . "- Nome: " . $productNameSafe . "\n"
  . "- Preço: " . $productPriceSafe . " FITC\n\n"
  . "Enviado em: " . date('Y-m-d H:i:s') . "\n";

// IMPORTANTE:
// Muitos provedores exigem que o "From" seja do seu domínio.
// Ajuste para um e-mail do seu domínio caso necessário.
$from = 'no-reply@movimenta.local';

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: ' . $from;
$headers[] = 'Reply-To: ' . $nameSafe . ' <' . $emailSafe . '>';

$ok = @mail($to, $subject, $body, implode("\r\n", $headers));

if (!$ok) {
  json_error('Falha ao enviar e-mail (verifique a configuração do servidor).', 500);
}

echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
?>

