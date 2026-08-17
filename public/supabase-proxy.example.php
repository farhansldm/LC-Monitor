<?php
// Copy this file to supabase-proxy.php and set YOUR project URL.

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$queryString = $_SERVER['QUERY_STRING'] ?? '';
$path = '';
if (preg_match('/path=([^&]+)/', $queryString, $matches)) {
    $path = urldecode($matches[1]);
    $extraQuery = preg_replace('/path=[^&]+&?/', '', $queryString);
    if (!empty($extraQuery)) {
        if (strpos($path, '?') !== false) {
            $path .= '&' . $extraQuery;
        } else {
            $path .= '?' . $extraQuery;
        }
    }
}

if (empty($path)) {
    http_response_code(400);
    echo json_encode(["error" => "Path is required"]);
    exit;
}

// Settings → API → Project URL, then add /functions/v1/
$SUPABASE_FUNCTIONS_BASE = "https://your_project_ref.supabase.co/functions/v1/";
$supabaseUrl = $SUPABASE_FUNCTIONS_BASE . $path;

$headers = [];
foreach (getallheaders() as $name => $value) {
    if (in_array(strtolower($name), ['authorization', 'content-type', 'apikey', 'x-client-info'])) {
        $headers[] = "$name: $value";
    }
}

$ch = curl_init($supabaseUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

curl_close($ch);

http_response_code($httpCode);
if ($contentType) {
    header("Content-Type: $contentType");
}
echo $response;
