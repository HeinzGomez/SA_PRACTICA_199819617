// HeinzGomez - Práctica 7: layout raíz del frontend (Next.js App Router)
import type { Metadata } from 'next';
import './globals.css';
import { SesionProvider } from '@/components/Sesion';
import { Encabezado } from '@/components/Ui';

export const metadata: Metadata = {
  title: 'Academix Pass & CertiHub · YOUSAC',
  description: 'Inscripción en ráfaga a talleres, conferencias y laboratorios de FIUSAC, y verificación pública de diplomas digitales.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SesionProvider>
          <Encabezado />
          <main className="contenedor">{children}</main>
          <footer className="footer">
            <div className="contenedor fila entre">
              <span>Universidad de San Carlos de Guatemala · Facultad de Ingeniería · Software Avanzado</span>
              <span>Arquitectura SOA · gRPC · RabbitMQ · Redis</span>
            </div>
          </footer>
        </SesionProvider>
      </body>
    </html>
  );
}
