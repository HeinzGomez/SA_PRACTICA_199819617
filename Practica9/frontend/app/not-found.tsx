// HeinzGomez - Práctica 7: página 404
import Link from 'next/link';

export default function NoEncontrado() {
  return (
    <div className="card vacio">
      <h1>Página no encontrada</h1>
      <p>La ruta solicitada no existe.</p>
      <Link href="/" className="btn">Ir al catálogo</Link>
    </div>
  );
}
