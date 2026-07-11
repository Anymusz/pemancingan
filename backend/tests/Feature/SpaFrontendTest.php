<?php

namespace Tests\Feature;

use Tests\TestCase;

class SpaFrontendTest extends TestCase
{
    public function test_root_serves_bundled_spa_shell(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('<div id="root"></div>', false)
            ->assertSee('src="/assets/', false)
            ->assertSee('href="/vite.svg"', false)
            ->assertDontSee('_debugbar', false)
            ->assertDontSee('phpdebugbar', false);
    }

    public function test_nested_frontend_route_serves_bundled_spa_shell(): void
    {
        $this->get('/owner/dashboard')
            ->assertOk()
            ->assertSee('<div id="root"></div>', false);
    }

    public function test_bundled_asset_is_served_from_html_directory(): void
    {
        $assets = glob(base_path('html/assets/*.js')) ?: [];

        $this->assertNotEmpty($assets, 'Expected at least one JavaScript bundle in backend/html/assets.');

        $response = $this->get('/assets/'.basename($assets[0]));

        $response->assertOk();
        $this->assertStringStartsWith(
            'application/javascript',
            $response->headers->get('Content-Type')
        );
    }

    public function test_bundled_stylesheet_uses_css_mime_type(): void
    {
        $assets = glob(base_path('html/assets/*.css')) ?: [];

        $this->assertNotEmpty($assets, 'Expected at least one CSS bundle in backend/html/assets.');

        $response = $this->get('/assets/'.basename($assets[0]));

        $response->assertOk();
        $this->assertStringStartsWith(
            'text/css',
            $response->headers->get('Content-Type')
        );
    }

    public function test_api_paths_are_not_captured_by_spa_fallback(): void
    {
        $this->get('/api/__spa_fallback_probe')
            ->assertNotFound()
            ->assertDontSee('<div id="root"></div>', false);
    }

    public function test_bundle_is_safe_for_same_origin_deploy(): void
    {
        $assets = glob(base_path('html/assets/*.js')) ?: [];

        $this->assertNotEmpty($assets, 'Expected at least one JavaScript bundle in backend/html/assets.');

        $index = file_get_contents(base_path('html/index.html'));
        $bundle = file_get_contents($assets[0]);

        $this->assertStringContainsString('src="/assets/', $index);
        $this->assertStringContainsString('href="/vite.svg"', $index);
        $this->assertStringNotContainsString('./assets', $index);
        $this->assertStringContainsString('baseURL:"/api"', $bundle);
        $this->assertStringNotContainsString('http://127.0.0.1:8000/api', $bundle);
    }

    public function test_debugbar_is_disabled_by_default_even_when_app_debug_is_enabled(): void
    {
        config(['app.debug' => true]);

        $this->assertFalse((bool) config('debugbar.enabled'));
    }
}
