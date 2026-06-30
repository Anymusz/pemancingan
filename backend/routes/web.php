<?php

use Illuminate\Support\Facades\Route;

$serveSpaFile = static function (string $relativePath) {
    $basePath = realpath(base_path('html'));
    $filePath = $basePath
        ? realpath($basePath.DIRECTORY_SEPARATOR.str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relativePath))
        : false;

    abort_unless(
        $basePath
            && $filePath
            && is_file($filePath)
            && str_starts_with($filePath, $basePath.DIRECTORY_SEPARATOR),
        404
    );

    $contentTypes = [
        'css' => 'text/css; charset=UTF-8',
        'html' => 'text/html; charset=UTF-8',
        'ico' => 'image/x-icon',
        'jpeg' => 'image/jpeg',
        'jpg' => 'image/jpeg',
        'js' => 'application/javascript; charset=UTF-8',
        'json' => 'application/json; charset=UTF-8',
        'png' => 'image/png',
        'svg' => 'image/svg+xml',
        'wasm' => 'application/wasm',
        'webp' => 'image/webp',
    ];

    $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

    return response(
        file_get_contents($filePath),
        200,
        ['Content-Type' => $contentTypes[$extension] ?? 'application/octet-stream']
    );
};

Route::get('/assets/{path}', fn (string $path) => $serveSpaFile("assets/{$path}"))
    ->where('path', '.*');

Route::get('/images/{path}', fn (string $path) => $serveSpaFile("images/{$path}"))
    ->where('path', '.*');

Route::get('/vite.svg', fn () => $serveSpaFile('vite.svg'));

Route::get('/{path?}', fn () => $serveSpaFile('index.html'))
    ->where('path', '^(?!api(?:/|$)|up(?:/|$)|assets(?:/|$)|images(?:/|$)|storage(?:/|$)|.*\.[^/]+$).*$');
