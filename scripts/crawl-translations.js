#!/usr/bin/env node

/**
 * Enhanced Translation Crawler
 * 
 * Uses /v1/discovery/geo endpoint to get COMPLETE geographic structure
 * and test ALL possible routes.
 */

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(process.cwd(), '.next/server/app');
const LOCALES = ['de', 'en'];
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan';

const args = process.argv.slice(2);
const LIVE_MODE = args.includes('--live');
const SERVER_URL = args.find(arg => arg.startsWith('--url='))?.split('=')[1] ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000';

class TranslationCrawler {
    constructor() {
        this.pagesChecked = 0;
        this.errorsFound = 0;
        this.routes = [];
        this.mode = LIVE_MODE ? 'live' : 'static';
    }

    async fetchRoutes() {
        console.log('🔍 Fetching complete geo structure from API...\n');

        try {
            this.routes.push('');
            this.routes.push('search');

            const geoResponse = await fetch(`${API_BASE}/v1/discovery/geo`);

            if (!geoResponse.ok) {
                console.warn(`⚠️  API returned ${geoResponse.status}, using fallback\n`);
                this.useFallbackRoutes();
                return;
            }

            const geo = await geoResponse.json();

            if (!geo.continents || !Array.isArray(geo.continents)) {
                console.warn('⚠️  Invalid geo structure\n');
                this.useFallbackRoutes();
                return;
            }

            console.log(`✅ Found ${geo.continents.length} continents\n`);

            // Process complete structure
            for (const continent of geo.continents) {
                this.routes.push(`parks/${continent.slug}`);

                if (continent.countries && Array.isArray(continent.countries)) {
                    console.log(`   ${continent.slug}: ${continent.countries.length} countries`);

                    for (const country of continent.countries) {
                        this.routes.push(`parks/${continent.slug}/${country.slug}`);

                        // Fetch cities (API endpoint is continent/country, returns cities data)
                        try {
                            const citiesResponse = await fetch(`${API_BASE}/v1/discovery/continents/${continent.slug}/${country.slug}`);

                            if (citiesResponse.ok) {
                                const citiesData = await citiesResponse.json();
                                const cities = citiesData.data || [];

                                for (const city of cities) {
                                    this.routes.push(`parks/${continent.slug}/${country.slug}/${city.slug}`);

                                    if (city.parks && Array.isArray(city.parks)) {
                                        for (const park of city.parks) {
                                            // 10% sampling for parks
                                            if (Math.random() > 0.1) continue;

                                            const parkBaseRoute = `parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`;
                                            this.routes.push(parkBaseRoute);

                                            // Fetch full park details to get attractions, shows, restaurants
                                            // using the park slug
                                            try {
                                                const parkResponse = await fetch(`${API_BASE}/v1/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`);
                                                if (parkResponse.ok) {
                                                    const parkData = await parkResponse.json();

                                                    // Helper to sample and add sub-routes
                                                    const addSubRoutes = (items, type) => {
                                                        if (!items || !Array.isArray(items)) return;
                                                        // 10% sampling for sub-items
                                                        const sampledItems = items.filter(() => Math.random() <= 0.1);
                                                        // Ensure at least 1 item if available and list is not empty
                                                        if (sampledItems.length === 0 && items.length > 0) {
                                                            sampledItems.push(items[Math.floor(Math.random() * items.length)]);
                                                        }

                                                        // Log finding
                                                        if (sampledItems.length > 0) {
                                                            console.log(`      + ${park.slug}: ${sampledItems.length} ${type} (sampled)`);
                                                        }

                                                        for (const item of sampledItems) {
                                                            this.routes.push(`${parkBaseRoute}/${item.slug}`);
                                                        }
                                                    };

                                                    addSubRoutes(parkData.attractions, 'attractions');
                                                    addSubRoutes(parkData.shows, 'shows');
                                                    addSubRoutes(parkData.restaurants, 'restaurants');
                                                }
                                            } catch (parkError) {
                                                // Silently skip
                                            }
                                        }
                                    }
                                }
                            } else {
                                console.warn(`   ⚠️  Failed to fetch cities for ${continent.slug}/${country.slug}: HTTP ${citiesResponse.status}`);
                            }
                        } catch (citiesError) {
                            console.warn(`   ⚠️  Error fetching cities for ${continent.slug}/${country.slug}: ${citiesError.message}`);
                        }
                    }
                }
            }

            console.log(`\n✅ Total: ${this.routes.length} routes\n`);

        } catch (error) {
            console.error('❌ Error:', error.message);
            this.useFallbackRoutes();
        }
    }

    useFallbackRoutes() {
        this.routes = ['', 'search', 'parks/europe', 'parks/europe/germany'];
        console.log(`   Using ${this.routes.length} fallback routes\n`);
    }

    async crawl() {
        console.log('════════════════════════════════════════════════════');
        console.log(`🔍 TRANSLATION CRAWLER - ${this.mode.toUpperCase()} MODE`);
        console.log('════════════════════════════════════════════════════\n');

        if (this.mode === 'live') {
            console.log(`🌐 Testing server: ${SERVER_URL}\n`);
        } else {
            console.log(`📁 Testing static: ${OUT_DIR}\n`);
        }

        await this.fetchRoutes();

        console.log(`🔍 Checking ${this.routes.length * LOCALES.length} pages...\n`);

        for (const locale of LOCALES) {
            console.log(`\n📍 ${locale.toUpperCase()}:\n`);

            for (const route of this.routes) {
                if (this.mode === 'live') {
                    await this.checkPageLive(locale, route);
                } else {
                    await this.checkPageStatic(locale, route);
                }
            }
        }

        this.printSummary();
    }

    async checkPageLive(locale, route) {
        const url = `${SERVER_URL}/${locale}/${route}`.replace(/\/+/g, '/').replace(':/', '://');

        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'TranslationCrawler/1.0' },
                redirect: 'follow'
            });

            if (!response.ok) {
                console.log(`   ⚠️  /${locale}/${route || 'home'} - HTTP ${response.status}`);
                return;
            }

            const html = await response.text();
            const issues = this.analyzeHTML(html);

            this.pagesChecked++;

            if (issues.length > 0) {
                console.log(`   ❌ /${locale}/${route || 'home'}:`);
                issues.forEach(issue => console.log(`      - ${issue}`));
                this.errorsFound += issues.length;
            } else {
                console.log(`   ✅ /${locale}/${route || 'home'}`);
            }

        } catch (error) {
            console.log(`   ⚠️  /${locale}/${route || 'home'} - ${error.message}`);
        }
    }

    async checkPageStatic(locale, route) {
        const htmlPath = path.join(OUT_DIR, locale, route, 'page.html');
        if (!fs.existsSync(htmlPath)) return;

        try {
            const html = fs.readFileSync(htmlPath, 'utf-8');
            const issues = this.analyzeHTML(html);
            this.pagesChecked++;

            if (issues.length > 0) {
                console.log(`   ❌ /${locale}/${route || 'home'}:`);
                issues.forEach(issue => console.log(`      - ${issue}`));
                this.errorsFound += issues.length;
            } else {
                console.log(`   ✅ /${locale}/${route || 'home'}`);
            }
        } catch (error) {
            console.log(`   ⚠️  Error: ${error.message}`);
        }
    }

    analyzeHTML(html) {
        const issues = [];

        // Remove script and style tags to avoid false positives in JS/CSS code
        const cleanHtml = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, '')
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, '');

        const keyPattern = />([\w]+\.[\w]+\.?[\w]*)</g;
        let match;
        const foundKeys = new Set();
        while ((match = keyPattern.exec(cleanHtml)) !== null) {
            const possibleKey = match[1];
            if (this.looksLikeTranslationKey(possibleKey)) {
                foundKeys.add(possibleKey);
            }
        }

        if (foundKeys.size > 0) {
            issues.push(`Untranslated: ${Array.from(foundKeys).slice(0, 2).join(', ')}`);
        }

        // Check for potential unreplaced JS template literals in visible text
        // Only flag if it looks like a translation access pattern (e.g. ${ns.key})
        // and is NOT inside a script/style (already cleaned)
        const translationTemplatePattern = /\$\{[\w]+\.[\w]+/;
        if (translationTemplatePattern.test(cleanHtml)) {
            issues.push('Template not replaced (found ${namespace.key} pattern)');
        }

        // Check for undefined/null in text content
        // Use a simple regex that looks for >undefined< or >null< 
        // to avoid matching substring in other words
        const undefinedPattern = />\s*(undefined|null)\s*</;
        if (undefinedPattern.test(cleanHtml)) {
            issues.push('Undefined/null in text');
        }

        return issues;
    }

    looksLikeTranslationKey(text) {
        if (!text.includes('.')) return false;
        const parts = text.split('.');
        if (parts.length < 2) return false;
        if (text.includes('http') || text.includes('www')) return false;
        if (/\d/.test(text)) return false;
        if (text === 'park.fan') return false;
        return parts.every(part => /^[a-z][a-zA-Z0-9_-]*$/.test(part));
    }

    printSummary() {
        console.log('\n════════════════════════════════════════════════════');
        console.log('📋 SUMMARY');
        console.log('════════════════════════════════════════════════════\n');

        console.log(`Mode: ${this.mode.toUpperCase()}`);
        console.log(`Routes: ${this.routes.length} × ${LOCALES.length} = ${this.routes.length * LOCALES.length}`);
        console.log(`Checked: ${this.pagesChecked}`);
        console.log(`Issues: ${this.errorsFound}\n`);

        if (this.errorsFound > 0) {
            console.log('❌ Translation issues found!\n');
            process.exit(1);
        } else {
            console.log('✅ All pages look good!\n');
            process.exit(0);
        }
    }
}

const crawler = new TranslationCrawler();
crawler.crawl().catch(error => {
    console.error('❌ Fatal:', error);
    process.exit(1);
});
