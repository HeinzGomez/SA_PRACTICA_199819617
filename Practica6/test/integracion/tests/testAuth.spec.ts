import { test, expect } from '@playwright/test';

test.describe.serial('Autenticación', () => {
  test('Login exitoso', async ({ page }) => {
    await page.goto('http://localhost/');
    await page.getByRole('textbox', { name: 'Correo Institucional' }).click();
    await page.getByRole('textbox', { name: 'Correo Institucional' }).fill('estudiante@ingenieria.usac.edu.gt');
    await page.getByRole('textbox', { name: 'Contraseña' }).click();
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('123456789');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('button', { name: 'Mis Cursos' })).toBeVisible();
  });

  test('Registro con correo duplicado', async ({ page }) => {
    await page.goto('http://localhost/');
    await page.getByRole('button', { name: 'Regístrate' }).click();
    await page.getByRole('textbox', { name: 'Nombre' }).click();
    await page.getByRole('textbox', { name: 'Nombre' }).fill('estudiante');
    await page.getByRole('textbox', { name: 'Apellido' }).click();
    await page.getByRole('textbox', { name: 'Apellido' }).fill('estudiante');
    await page.getByRole('textbox', { name: 'Correo Institucional' }).click();
    await page.getByRole('textbox', { name: 'Correo Institucional' }).fill('estudiante@ingenieria.usac.edu.gt');
    await page.getByRole('textbox', { name: 'Contraseña' }).click();
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('123456789');
    await page.getByRole('textbox', { name: 'DPI' }).click();
    await page.getByRole('textbox', { name: 'DPI' }).fill('3030303030301');
    await page.getByRole('textbox', { name: 'Fecha de Nacimiento' }).fill('2026-09-09');
    await page.getByRole('textbox', { name: 'Carnet / Registro Académico' }).click();
    await page.getByRole('textbox', { name: 'Carnet / Registro Académico' }).fill('201800265');
    await page.getByRole('textbox', { name: 'Teléfono' }).click();
    await page.getByRole('textbox', { name: 'Teléfono' }).fill('55555555');
    await page.getByLabel('Carrera').selectOption('3');
    await page.getByRole('textbox', { name: 'Dirección' }).click();
    await page.getByRole('textbox', { name: 'Dirección' }).fill('Ciudad de Guate');
    await page.getByRole('button', { name: 'Registrarse' }).click();
    await expect(page.getByText('3 INVALID_ARGUMENT: El correo')).toBeVisible();
  });
});
