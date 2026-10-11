<?php

use App\Http\Middleware\IsAdmin;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {

        // Daftarkan alias middleware 'is_admin'
        $middleware->alias([
            'is_admin' => IsAdmin::class,
        ]);

    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();

/*
|--------------------------------------------------------------------------
| Kalau masih Laravel 10 — gunakan Kernel.php, bukan file ini
|--------------------------------------------------------------------------
|
| Tambahkan di app/Http/Kernel.php, array $routeMiddleware:
|
|   'is_admin' => \App\Http\Middleware\IsAdmin::class,
|
*/
