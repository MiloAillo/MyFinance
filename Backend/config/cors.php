<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter(array_map(function($origin) {
        return rtrim(trim($origin), '/');
    }, explode(',', config('app.debug') ? '*' : env('CORS_ALLOWED_ORIGINS', config('app.frontend_url'))))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 3600,
    'supports_credentials' => false,
];
