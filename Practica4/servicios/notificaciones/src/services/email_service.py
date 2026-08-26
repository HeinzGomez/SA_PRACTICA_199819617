MORADO = "#8600e6"
GRIS = "#4b5563"
GRIS_CLARO = "#9ca3af"


def _envoltura(contenido_html: str) -> str:
    return (
        "<html>"
        "<body style='margin:0;padding:0;background-color:#f8f8fc;"
        "font-family:Arial,Helvetica,sans-serif;'>"
        "<table role='presentation' width='100%' cellpadding='0' cellspacing='0'>"
        "<tr><td align='center' style='padding:32px 16px;'>"
        "<table role='presentation' width='520' cellpadding='0' cellspacing='0'"
        " style='background-color:#ffffff;border-radius:12px;"
        "overflow:hidden;border:1px solid #eceaf5;'>"
        "<tr><td style='background-color:#8600e6;height:6px;'></td></tr>"
        "<tr><td style='padding:32px;'>"
        + contenido_html
        + "</td></tr>"
        "<tr><td style='padding:20px 32px;background-color:#ffffff;"
        "border-top:1px solid #eceaf5;color:#9ca3af;font-size:12px;"
        "text-align:center;'>"
        "© " + MORADO + " · Yo USAC"
        "</td></tr>"
        "</table></td></tr></table></body></html>"
    )


def _texto_contenido(html: str) -> str:
    return (
        "<p style='margin:0 0 20px;color:#4b5563;font-size:15px;"
        "line-height:1.6;'>" + html + "</p>"
    )


def _titulo(texto: str) -> str:
    return (
        "<h1 style='margin:0 0 16px;color:#8600e6;font-size:24px;'>"
        + texto
        + "</h1>"
    )


class EmailService:
    def plantilla_registro(self, nombre_usuario: str) -> str:
        cuerpo = (
            _titulo(f"¡Bienvenido, {nombre_usuario}!")
            + _texto_contenido(
                f"Hola <strong>{nombre_usuario}</strong>, tu cuenta ha sido creada "
                "exitosamente. Estamos muy contentos de tenerte con nosotros."
            )
            + _texto_contenido(
                "Ya puedes explorar todo lo que Yo USAC tiene para ti."
            )
        )
        return _envoltura(cuerpo)

    def plantilla_contenido_nuevo(
        self, titulo_contenido: str, descripcion: str
    ) -> str:
        cuerpo = (
            _titulo("Nuevo contenido disponible")
            + _texto_contenido(
                f"Se ha publicado <strong>{titulo_contenido}</strong> y ya "
                "está disponible para ti."
            )
            + (
                _texto_contenido(descripcion)
                if descripcion
                else _texto_contenido("¡Échale un vistazo y no te lo pierdas!")
            )
        )
        return _envoltura(cuerpo)

    def plantilla_aviso_general(self, asunto: str, mensaje: str) -> str:
        cuerpo = (
            _titulo(asunto)
            + _texto_contenido(mensaje)
        )
        return _envoltura(cuerpo)
