<?php

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Inertia\Inertia;



return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'stripe/webhook',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {

        $exceptions->reportable(function (Throwable $e) {
            if (request()->is('.well-known/appspecific/*')) {
                return false;
            }
        });

        // ── TEMP DEBUG: custom render() disabled entirely so Laravel's
        // default error handling takes over — Whoops/Ignition in debug
        // mode, or Laravel's own default error page otherwise. This lets
        // the real /admindashboard crash surface. Restore the block below
        // once the root cause is found and fixed.

        /*
        $exceptions->render(function (Throwable $exception, $request) {
            if (
                $exception instanceof \Illuminate\Validation\ValidationException
                || $exception instanceof \Illuminate\Auth\AuthenticationException
            ) {
                return null;
            }

            // TEMP DEBUG — remove after we find the bug
            Log::error('Unhandled exception: ' . $exception->getMessage(), [
                'exception' => get_class($exception),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString(),
            ]);

            $status = 500;
            if ($exception instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                $status = $exception->getStatusCode();
            }
            $messages = [
                404 => 'Page not found.',
                403 => 'Access denied.',
                500 => 'Internal server error.',
            ];
            $message = $messages[$status] ?? 'An unexpected error occurred.';
            if ($request->wantsJson() || $request->isJson()) {
                return response()->json(['message' => $message], $status);
            }
            return Inertia::render('Error', [
                'statusCode' => $status,
                'message' => $message,
            ])->toResponse($request)->setStatusCode($status);
        });
        */
    })
    ->create();
