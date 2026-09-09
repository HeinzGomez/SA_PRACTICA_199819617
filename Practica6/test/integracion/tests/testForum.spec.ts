import { test, expect } from '@playwright/test';

async function login(page: any, email: string, password: string) {
  await page.goto('http://localhost/');
  await page.getByRole('textbox', { name: 'Correo Institucional' }).fill(email);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

async function openCourseForum(page: any) {
  await page.getByRole('button', { name: 'Catálogo' }).click();
  await page.getByRole('button', { name: /75 min Filosofía Filosofía -/ }).click();
}

test.describe.serial('Foro de dudas', () => {
  test('Crear duda como estudiante', async ({ page }) => {
    await login(page, 'estudiante@ingenieria.usac.edu.gt', '123456789');
    await openCourseForum(page);

    await page.getByRole('button', { name: 'Preguntar en foro' }).click();
    await page.getByRole('textbox', { name: 'Escribe tu duda sobre esta' }).fill('Duda 1');
    await page.getByRole('button', { name: 'Publicar pregunta' }).click();

    await expect(page.getByText('Duda 1').first()).toBeVisible();
  });

  test('Responder duda como docente', async ({ page }) => {
    await login(page, 'docente@ingenieria.usac.edu.gt', '123456789');
    await page.getByRole('button', { name: 'Panel de Estudiante' }).click();
    await openCourseForum(page);
    await page.getByRole('button', { name: 'Responder' }).first().click();
    await page.getByRole('textbox', { name: 'Escribe tu respuesta...' }).click();
    await page.getByRole('textbox', { name: 'Escribe tu respuesta...' }).fill('manana');
    await page.getByRole('button', { name: 'Enviar respuesta' }).click();
    await expect(page.getByText('manana').first()).toBeVisible();

  });

  test('Marcar respuesta como correcta', async ({ page }) => {
    await login(page, 'docente@ingenieria.usac.edu.gt', '123456789');
    await page.getByRole('button', { name: 'Panel de Estudiante' }).click();
    

    await page.getByRole('button', { name: 'Catálogo' }).click();
    await page.getByRole('button', { name: '90 min Sistemas Operativos 1' }).click();
    await page.getByRole('button', { name: 'Preguntar en foro' }).click();
    await page.getByRole('textbox', { name: 'Escribe tu duda sobre esta' }).click();
    await page.getByRole('textbox', { name: 'Escribe tu duda sobre esta' }).fill('duda');
    await page.getByRole('button', { name: 'Publicar pregunta' }).click();
    await page.getByRole('button', { name: 'Responder' }).first().click();
    await page.getByRole('textbox', { name: 'Escribe tu respuesta...' }).click();
    await page.getByRole('textbox', { name: 'Escribe tu respuesta...' }).fill('respuesta');
    await page.getByRole('button', { name: 'Enviar respuesta' }).click();
    await page.getByRole('button', { name: 'Marcar como respuesta correcta' }).click();
    await expect(page.getByText('respuesta').first()).toBeVisible();
  });
});
