<?php

return [
    'enabled' => env('DEBUGBAR_ENABLED', false),

    'except' => [
        'api/*',
        '_debugbar/*',
        'storage/*',
        'assets/*',
        'images/*',
        'vite.svg',
        'telescope*',
        'horizon*',
        '_boost/browser-logs',
    ],
];
