import re
from playwright.sync_api import Page, expect

def test_pagina_ejemplo(page: Page):
    # 1. Navegar a una página web
    page.goto("https://playwright.dev/")

    # 2. Verificar que el título de la página contenga la palabra Playwright
    expect(page).to_have_title(re.compile("Playwright"))
