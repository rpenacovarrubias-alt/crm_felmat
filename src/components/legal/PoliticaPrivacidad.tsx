// ============================================
// POLÍTICA DE PRIVACIDAD — página pública, sin autenticación
// Requerida para el proceso de revisión de la app de Meta (Facebook/Instagram).
// ============================================

export function PoliticaPrivacidad() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
        <img src="/logo-felmat-gold.png" alt="Grupo Felmat" className="h-14 mb-8" />

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Política de Privacidad — CRM Grupo Felmat
        </h1>
        <p className="text-sm text-gray-500 mb-10">Última actualización: 15 de septiembre de 2026</p>

        <p className="text-gray-700 leading-relaxed mb-8">
          Grupo Felmat ("nosotros", "nuestro") opera un sistema CRM interno para la gestión de
          propiedades inmobiliarias, clientes y actividades comerciales, disponible en{' '}
          <a href="https://crm-felmat.vercel.app" className="text-[#C9932E] hover:underline">
            crm-felmat.vercel.app
          </a>
          . Esta política describe cómo recopilamos, usamos y protegemos la información, incluyendo
          la que obtenemos a través de la integración con las plataformas de Meta (Facebook e
          Instagram).
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Información que recopilamos</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
            <li>
              <strong>Datos de clientes y prospectos:</strong> nombre, correo electrónico, teléfono,
              preferencias de propiedades, historial de interacciones.
            </li>
            <li>
              <strong>Datos de propiedades:</strong> información de inventario, fotos, ubicaciones,
              precios.
            </li>
            <li>
              <strong>Datos obtenidos vía Meta (Facebook/Instagram):</strong> información de páginas
              administradas, publicaciones, métricas de anuncios, comentarios y mensajes recibidos a
              través de dichas plataformas, en la medida permitida por los permisos otorgados a
              nuestra aplicación.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Cómo usamos la información</h2>
          <p className="text-gray-700 leading-relaxed mb-3">Utilizamos la información recopilada para:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed mb-4">
            <li>Administrar y automatizar la publicación de contenido y anuncios en Facebook e Instagram.</li>
            <li>Dar seguimiento a clientes y prospectos interesados en propiedades.</li>
            <li>Generar reportes internos de desempeño comercial y de campañas publicitarias.</li>
            <li>Mejorar nuestros procesos de atención al cliente.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            No vendemos ni compartimos esta información con terceros ajenos a la operación del
            negocio, salvo que la ley lo requiera o sea necesario para el funcionamiento de los
            servicios contratados (por ejemplo, proveedores de hosting).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Integración con Meta (Facebook e Instagram)</h2>
          <p className="text-gray-700 leading-relaxed mb-3">Nuestra aplicación se conecta a la API de Meta para:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed mb-4">
            <li>Publicar contenido y administrar anuncios en nombre de la página de Grupo Felmat.</li>
            <li>Leer y responder comentarios/mensajes recibidos en dichas plataformas.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            El acceso a estos datos está limitado a los permisos explícitamente otorgados por el
            administrador de la página, y solo se utiliza para los fines descritos en esta política.
            Puedes revocar el acceso de nuestra aplicación en cualquier momento desde la
            configuración de tu cuenta de Meta Business Suite.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Almacenamiento y seguridad</h2>
          <p className="text-gray-700 leading-relaxed">
            La información se almacena en servidores con medidas de seguridad razonables para
            prevenir accesos no autorizados, pérdida o alteración de los datos. El acceso al CRM está
            restringido a personal autorizado de Grupo Felmat.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Retención de datos</h2>
          <p className="text-gray-700 leading-relaxed">
            Conservamos la información mientras sea necesaria para los fines descritos, o mientras
            exista una relación comercial activa con el cliente, salvo que la normativa aplicable
            exija un periodo distinto.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            6. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
          </h2>
          <p className="text-gray-700 leading-relaxed">
            De conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los
            Particulares (México), cualquier persona puede solicitar acceso, rectificación,
            cancelación u oposición al tratamiento de sus datos personales, enviando su solicitud a{' '}
            <a href="mailto:admin@felmat.com.mx" className="text-[#C9932E] hover:underline">
              admin@felmat.com.mx
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cambios a esta política</h2>
          <p className="text-gray-700 leading-relaxed">
            Nos reservamos el derecho de actualizar esta política. Cualquier cambio será publicado en
            esta misma página con la fecha de actualización correspondiente.
          </p>
        </section>

        <section className="mb-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contacto</h2>
          <p className="text-gray-700 leading-relaxed">
            Para dudas sobre esta política, contáctanos en:
            <br />
            <strong>Grupo Felmat</strong>
            <br />
            Correo:{' '}
            <a href="mailto:admin@felmat.com.mx" className="text-[#C9932E] hover:underline">
              admin@felmat.com.mx
            </a>
            <br />
            Sitio web:{' '}
            <a href="https://felmat.com.mx" className="text-[#C9932E] hover:underline">
              felmat.com.mx
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

export default PoliticaPrivacidad;
