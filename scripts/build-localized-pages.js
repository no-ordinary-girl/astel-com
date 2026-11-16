#!/usr/bin/env node
'use strict';
/*
 * Generate static English HTML pages in /en/ from the Ukrainian source pages.
 * Keeps assets, shared JavaScript and product data at project root via <base>.
 * Run from any cwd: node scripts/build-localized-pages.js
 * To publish absolute canonical/hreflang URLs set ASTEL_SITE_ORIGIN=https://your-domain.
 */
const fs = require('node:fs');
const path = require('node:path');
const { escape } = require('node:querystring');
const i18n = require('../js/i18n.js');
const ROOT = path.join(__dirname, '..');
const EN = path.join(ROOT, 'en');
const origin = (process.env.ASTEL_SITE_ORIGIN || '').replace(/\/$/, '');
const PAGES = {
  'index.html': {
    uk: ['АСТЕЛ-КОМ — телекомунікаційне обладнання', 'Промислові GSM/LTE та NBIoT модеми, антени, аксесуари й обладнання для бізнесу в Україні.'],
    en: ['ASTEL-COM — Telecommunications Equipment', 'Industrial GSM/LTE and NBIoT modems, antennas, accessories and telecommunications equipment from Ukraine.'],
  },
  'about_us.html': {
    uk: ['Про компанію — АСТЕЛ-КОМ', 'Дізнайтеся про компанію АСТЕЛ-КОМ: історія, інженерні рішення та розвиток телекомунікаційних технологій.'],
    en: ['About ASTEL-COM', 'Learn about ASTEL-COM: our history, engineering solutions and development of telecommunications technologies.'],
  },
  'products.html': {
    uk: ['Товари — АСТЕЛ-КОМ', 'Каталог промислових GSM/LTE і NBIoT модемів, антен, кабелів та аксесуарів АСТЕЛ-КОМ.'],
    en: ['Products — ASTEL-COM', 'Browse industrial GSM/LTE and NBIoT modems, antennas, power cables and accessories from ASTEL-COM.'],
  },
  'product.html': {
    uk: ['Характеристики товару — АСТЕЛ-КОМ', 'Ціна, характеристики, технічна документація та умови замовлення обладнання АСТЕЛ-КОМ.'],
    en: ['Product Details — ASTEL-COM', 'Prices, specifications, technical documentation and ordering information for ASTEL-COM equipment.'],
  },
  'docs.html': {
    uk: ['Документація — АСТЕЛ-КОМ', 'Завантажте технічні паспорти, посібники з монтажу та експлуатації модемів АСТЕЛ-КОМ.'],
    en: ['Technical Documentation — ASTEL-COM', 'Download technical datasheets and installation and operation manuals for ASTEL-COM modems. Some files are in Ukrainian.'],
  },
  'downloads.html': {
    uk: ['Драйвери — АСТЕЛ-КОМ', 'Драйвери USB та програмне забезпечення для налаштування промислових модемів АСТЕЛ-КОМ.'],
    en: ['Drivers & Downloads — ASTEL-COM', 'USB drivers and software downloads for configuring ASTEL-COM industrial modems.'],
  },
  'cart.html': {
    uk: ['Кошик та оформлення замовлення — АСТЕЛ-КОМ', 'Перевірте кошик, оберіть доставку та спосіб оплати й оформіть замовлення обладнання АСТЕЛ-КОМ.'],
    en: ['Cart & Checkout — ASTEL-COM', 'Review your cart, choose delivery and payment, and place an order for ASTEL-COM equipment.'],
  },
  'login.html': {
    uk: ['Вхід — АСТЕЛ-КОМ', 'Вхід до особистого кабінету покупця АСТЕЛ-КОМ.'],
    en: ['Sign In — ASTEL-COM', 'Sign in to your ASTEL-COM customer account.'],
  },
  'account.html': {
    uk: ['Особистий кабінет — АСТЕЛ-КОМ', 'Перегляд замовлень і даних покупця в особистому кабінеті АСТЕЛ-КОМ.'],
    en: ['My Account — ASTEL-COM', 'View your order history and customer details in your ASTEL-COM account.'],
  },
  'order-status.html': {
    uk: ['Статус замовлення — АСТЕЛ-КОМ', 'Перевірте статус замовлення АСТЕЛ-КОМ.'],
    en: ['Order Status — ASTEL-COM', 'Check the status of your ASTEL-COM order.'],
  },
};
function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function href(file, language) {
  const loc = language === 'en' ? `en/${file}` : file;
  return origin ? `${origin}/${loc}` : (language === 'en' ? `../${loc}` : loc);
}
function headMeta(file, language) {
  const [title, description] = PAGES[file][language];
  return [
    // Chrome/Google Translate must not layer machine translation on the site's own locales.
    `<meta name="google" content="notranslate" />`,
    `<meta name="color-scheme" content="light dark" />`,
    `<meta name="description" content="${escapeAttr(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<link rel="canonical" href="${escapeAttr(href(file, language))}" />`,
    `<link rel="alternate" hreflang="uk" href="${escapeAttr(href(file, 'uk'))}" />`,
    `<link rel="alternate" hreflang="en" href="${escapeAttr(href(file, 'en'))}" />`,
    `<link rel="alternate" hreflang="x-default" href="${escapeAttr(href(file, 'uk'))}" />`,
  ].join('\n    ');
}
function addHead(source, file, language) {
  // Removes old metadata so the command is safely repeatable.
  let html = source.replace(/<meta name="google" content="notranslate"[^>]*\/>\s*/g, '')
    .replace(/<meta name="color-scheme"[^>]*\/>\s*/g, '')
    .replace(/<meta name="description"[^>]*\/>\s*/g, '')
    .replace(/<meta property="og:(?:type|title|description)"[^>]*\/>\s*/g, '')
    .replace(/<link rel="(?:canonical|alternate)"[^>]*\/>\s*/g, '');
  html = html.replace(/<title([^>]*)>[\s\S]*?<\/title>/i, (_all, attributes) => `<title${attributes}>${escapeAttr(PAGES[file][language][0])}</title>`);
  // base belongs early in the EN <head>; scripts, styles and images remain shared.
  html = html.replace(/(<meta charset="UTF-8"\s*\/>)/i,
    `$1\n    ${language === 'en' ? '<base href="../" />\n    ' : ''}${headMeta(file, language)}`);
  return html;
}
const PAGE_RX = /^(?:en\/)?([a-z_-]+\.html)([?#].*)?$/i;
// Text split by explicit <br> tags cannot be translated as a single text node.
// Pre-render these structural UI labels for search crawlers and no-JS users.
const MULTILINE_LABELS = new Map([
  ['ОБЛАДНАННЯ ТА РІШЕННЯ<br />АСТЕЛ-КОМ', 'EQUIPMENT & SOLUTIONS<br />BY ASTEL-COM'],
  ['ОБЛАДНАННЯ ТА РІШЕННЯ<br />ASTEL-COM', 'EQUIPMENT & SOLUTIONS<br />BY ASTEL-COM'],
  ['ПРО<br />КОМПАНІЮ', 'ABOUT<br />THE COMPANY'],
  ['АКСЕСУАРИ ДЛЯ<br />БАНКІВСЬКИХ ТЕРМІНАЛІВ', 'ACCESSORIES FOR<br />BANK TERMINALS'],
  ['КАБЕЛІ НИЗКОВОЛЬТНОГО<br />ЖИВЛЕННЯ', 'LOW-VOLTAGE<br />POWER CABLES'],
  ['КАБЕЛІ<br />НИЗКОВОЛЬТНОГО ЖИВЛЕННЯ', 'LOW-VOLTAGE<br />POWER CABLES'],
  ['Промислова<br />автоматизація', 'Industrial<br />Automation'],
]);
function translateStaticHtml(source) {
  // Protect inline JavaScript/styles and comments from modifications. No npm HTML parser.
  const parts = source.split(/(<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->|<[^>]+>)/gi);
  let html = parts.map(part => {
    if (!part) return part;
    if (/^<(?:script|style|!--)/i.test(part)) {
      // Inline page redirects are relative to <base href="../">, so direct to /en/.
      if (/^<script\b/i.test(part)) return part.replace(/(window\.location\.href\s*=\s*["'])([a-z_-]+\.html)/gi, '$1en/$2');
      return part;
    }
    if (/^<[^>]+>$/.test(part)) {
      // Asset paths stay unchanged: they resolve from the document's <base>.
      if (/^<a\b/i.test(part)) part = part.replace(/\bhref=(['"])([^'"<>]*)\1/i, (all, quote, value) => {
        const match = value.match(PAGE_RX);
        if (!match || match[1] === 'admin.html') return all;
        return `href=${quote}en/${match[1]}${match[2] || ''}${quote}`;
      });
      return part.replace(/\b(placeholder|aria-label|title|alt)=(['"])([^'"<>]*)\2/gi,
        (all, attr, quote, value) => `${attr}=${quote}${escapeAttr(i18n.attrForBuild(value))}${quote}`);
    }
    // Preserve existing whitespace. Text in dynamic JS templates is localized at runtime.
    return i18n.translateForBuild(part);
  }).join('');
  for (const [uk, en] of MULTILINE_LABELS) html = html.replaceAll(uk, en);
  return html;
}
function generate() {
  fs.mkdirSync(EN, { recursive: true });
  for (const file of Object.keys(PAGES)) {
    let source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    // Ukrainian source has canonical and translated Ukrainian metadata.
    const uk = addHead(source, file, 'uk');
    if (source !== uk) fs.writeFileSync(path.join(ROOT, file), uk);
    let english = addHead(source, file, 'en').replace(/<html lang="uk"/, '<html lang="en"');
    english = translateStaticHtml(english);
    // Avoid flashing the source language in the EN page header before JS initializes.
    english = english.replace(/(<div class="header__lang-trigger">\s*)UA(?=\s*<svg)/, '$1EN');
    fs.writeFileSync(path.join(EN, file), english);
    console.log('localized', file);
  }
}
if (require.main === module) generate();
module.exports = { PAGES, generate };
