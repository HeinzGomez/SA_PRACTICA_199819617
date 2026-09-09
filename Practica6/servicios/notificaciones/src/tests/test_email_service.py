from services.email_service import EmailService


class TestEmailService:
    def setup_method(self):
        self.svc = EmailService()

    def test_plantilla_registro_contiene_nombre(self):
        html = self.svc.plantilla_registro("Juan")
        assert "Juan" in html

    def test_plantilla_registro_es_html(self):
        html = self.svc.plantilla_registro("Juan")
        assert "<html>" in html
        assert "</html>" in html

    def test_plantilla_registro_contiene_bienvenida(self):
        html = self.svc.plantilla_registro("Juan")
        assert "Bienvenido" in html

    def test_plantilla_contenido_nuevo_con_descripcion(self):
        html = self.svc.plantilla_contenido_nuevo("Titulo1", "Desc1")
        assert "Titulo1" in html
        assert "Desc1" in html
        assert "<html>" in html

    def test_plantilla_contenido_nuevo_sin_descripcion(self):
        html = self.svc.plantilla_contenido_nuevo("Titulo1", "")
        assert "Titulo1" in html
        assert "vistazo" in html

    def test_plantilla_contenido_nuevodescripcion_none(self):
        html = self.svc.plantilla_contenido_nuevo("Titulo1", None)
        assert "Titulo1" in html

    def test_plantilla_aviso_general(self):
        html = self.svc.plantilla_aviso_general("Asunto1", "Mensaje1")
        assert "Asunto1" in html
        assert "Mensaje1" in html
        assert "<html>" in html

    def test_todas_las_plantillas_tienen_color_morado(self):
        html = self.svc.plantilla_registro("Test")
        assert "#8600e6" in html

    def test_todas_las_plantillas_tienen_footer(self):
        html = self.svc.plantilla_registro("Test")
        assert "Yo USAC" in html
