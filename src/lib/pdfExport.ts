// ============================================
// EXPORTACIÓN DE FICHAS TÉCNICAS A PDF (TIPO WIGGOT)
// ============================================

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import type { Property } from '@/types';
import { resolveAgentDisplay, type AgentSource, type AgentOverride } from '@/lib/agentDisplay';

interface PDFExportOptions {
  property: Property;
  agent: AgentSource | null;
  showAgentData: boolean;
  agentOverride?: AgentOverride;
}

export async function exportPropertyToPDF({ property, agent, showAgentData, agentOverride }: PDFExportOptions): Promise<void> {
  const contact = resolveAgentDisplay(showAgentData ? agent : null, agentOverride);
  const agentName = contact.name;
  const agentRole = contact.role;
  const agentEmail = contact.email || '';
  const agentPhone = contact.phone || '';
  const agentAvatarHtml = contact.avatar
    ? `<img src="${contact.avatar}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid #2563eb;" />`
    : `<div style="width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #1e40af, #3b82f6); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 14px; font-weight: bold; border: 2px solid #2563eb;">${agentName.split(' ').map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase()}</div>`;

  const images = property.images && property.images.length > 0 ? property.images : [
    { id: '1', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80', isMain: true, order: 0 },
    { id: '2', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80', isMain: false, order: 1 },
    { id: '3', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80', isMain: false, order: 2 },
    { id: '4', url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&auto=format&fit=crop&q=80', isMain: false, order: 3 },
    { id: '5', url: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&auto=format&fit=crop&q=80', isMain: false, order: 4 },
  ];

  const mainImage = images.find(img => img.isMain)?.url || images[0]?.url || '';
  const secondaryImages = images.filter(img => img.url !== mainImage);
  const heroThumbnails = secondaryImages.slice(0, 4);
  const remainingImages = secondaryImages.slice(4);

  // Mapa: en vez de una foto de stock (no era un mapa real de nada), generamos
  // un QR a la busqueda real en Google Maps de la direccion de la propiedad.
  // Evita depender de una API de mapas estaticos (requeriria API key propia)
  // y evita el riesgo de "tainted canvas" de cargar una imagen de mapa externa
  // sin CORS dentro de html2canvas.
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${property.location.address}, ${property.location.neighborhood || ''}, ${property.location.city}, ${property.location.state}`
  )}`;
  const locationQrDataUrl = await QRCode.toDataURL(mapsSearchUrl, {
    width: 260,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
  });

  // Calcular número total de páginas (mínimo 2, hasta 4)
  let totalPages = 2;
  if (remainingImages.length > 0) totalPages = 3;
  if (remainingImages.length > 8) totalPages = 4;

  const renderHeader = (pageNum: number) => `
    <div style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f1f5f9; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; color: #334155; margin-bottom: 8px;">
        <div>🏠 Ficha de propiedad: <strong>${property.title}</strong></div>
        <div style="color: #2563eb;">Página ${pageNum}-${totalPages}</div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; background-color: #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${agentAvatarHtml}
          <div>
            <div style="font-weight: bold; font-size: 13px; color: #0f172a;">${agentName}</div>
            <div style="font-size: 10px; color: #64748b;">${agentRole}</div>
          </div>
        </div>
        <div style="font-size: 11px; color: #334155; text-align: right; display: flex; gap: 14px; align-items: center;">
          ${agentEmail ? `<div>📧 ${agentEmail}</div>` : ''}
          ${agentPhone ? `<div>📞 <strong>${agentPhone}</strong></div>` : ''}
        </div>
      </div>
    </div>
  `;

  const renderFooter = () => `
    <div style="margin-top: auto; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 8px; color: #94a3b8; line-height: 1.3;">
      <p style="margin: 0;">Precio sujeto a cambios sin previo aviso | *Producto sujeto a disponibilidad</p>
      <p style="margin: 0;">*El envío de esta ficha no compromete a las partes a la suscripción de ningún documento legal</p>
    </div>
  `;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';

  // --- PÁGINA 1 ---
  const page1 = document.createElement('div');
  page1.style.width = '794px';
  page1.style.height = '1123px';
  page1.style.padding = '32px';
  page1.style.boxSizing = 'border-box';
  page1.style.backgroundColor = '#ffffff';
  page1.style.display = 'flex';
  page1.style.flexDirection = 'column';
  page1.style.fontFamily = 'Helvetica, Arial, sans-serif';

  page1.innerHTML = `
    ${renderHeader(1)}
    
    <div style="margin-bottom: 12px;">
      <h1 style="font-size: 20px; font-weight: bold; color: #0f172a; margin: 0 0 4px 0; line-height: 1.2;">${property.title}</h1>
      <p style="font-size: 11px; color: #64748b; margin: 0;">📍 ${property.location.address}, ${property.location.neighborhood || ''}, ${property.location.city}, ${property.location.state}, C.P. ${property.location.zipCode || ''}</p>
    </div>

    <!-- Hero Grid de Fotos (Estilo Wiggot) -->
    <div style="display: flex; gap: 8px; margin-bottom: 16px; height: 260px;">
      <div style="flex: 1.2; height: 100%; border-radius: 8px; overflow: hidden;">
        <img src="${mainImage}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
      <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; height: 100%;">
        ${heroThumbnails.map(img => `
          <div style="border-radius: 6px; overflow: hidden; height: 127px;">
            <img src="${img.url}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Descripción + Cuadro de Precio/ID -->
    <div style="display: flex; gap: 20px; margin-bottom: 16px;">
      <div style="flex: 1;">
        <h3 style="font-size: 14px; font-weight: bold; color: #0f172a; margin: 0 0 6px 0;">Descripción</h3>
        <p style="font-size: 11px; color: #334155; line-height: 1.5; margin: 0; text-align: justify; white-space: pre-wrap;">${property.description || 'Sin descripción disponible.'}</p>
      </div>
      <div style="width: 220px; text-align: right; background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; height: fit-content;">
        <div style="font-size: 11px; color: #64748b; font-weight: bold; margin-bottom: 4px;">ID: ${property.slug || property.id.slice(0, 8)}</div>
        <span style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 10px; font-weight: bold; padding: 3px 10px; border-radius: 12px; margin-bottom: 8px; text-transform: uppercase;">${property.transactionType === 'venta' ? 'VENTA' : property.transactionType === 'renta' ? 'RENTA' : 'VENTA / RENTA'}</span>
        <div style="font-size: 18px; font-weight: bold; color: #0f172a;">$${property.price.toLocaleString('es-MX')} ${property.priceCurrency}</div>
      </div>
    </div>

    <!-- Detalles del inmueble -->
    <div style="margin-top: 10px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
      <h3 style="font-size: 14px; font-weight: bold; color: #0f172a; margin: 0 0 12px 0;">Detalles del inmueble</h3>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
        <div style="background-color: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div style="font-size: 10px; color: #64748b;">Tipo de inmueble</div>
          <div style="font-size: 13px; font-weight: bold; color: #0f172a; text-transform: capitalize;">${property.propertyType}</div>
        </div>
        <div style="background-color: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div style="font-size: 10px; color: #64748b;">Superficie</div>
          <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${property.features.terrainArea || 160} m²</div>
        </div>
        <div style="background-color: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div style="font-size: 10px; color: #64748b;">Construcción</div>
          <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${property.features.constructionArea} m²</div>
        </div>
        <div style="background-color: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div style="font-size: 10px; color: #64748b;">Recámaras</div>
          <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${property.features.bedrooms}</div>
        </div>
        <div style="background-color: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div style="font-size: 10px; color: #64748b;">Baños</div>
          <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${property.features.bathrooms}</div>
        </div>
        <div style="background-color: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div style="font-size: 10px; color: #64748b;">Estacionamientos</div>
          <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${property.features.parkingSpaces}</div>
        </div>
        <div style="background-color: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div style="font-size: 10px; color: #64748b;">Pisos</div>
          <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${property.features.floors || 2}</div>
        </div>
        <div style="background-color: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div style="font-size: 10px; color: #64748b;">Antigüedad</div>
          <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${property.features.yearBuilt ? (new Date().getFullYear() - property.features.yearBuilt) + ' años' : '12 años'}</div>
        </div>
      </div>
    </div>

    ${renderFooter()}
  `;

  container.appendChild(page1);

  // --- PÁGINA 2 ---
  const page2 = document.createElement('div');
  page2.style.width = '794px';
  page2.style.height = '1123px';
  page2.style.padding = '32px';
  page2.style.boxSizing = 'border-box';
  page2.style.backgroundColor = '#ffffff';
  page2.style.display = 'flex';
  page2.style.flexDirection = 'column';
  page2.style.fontFamily = 'Helvetica, Arial, sans-serif';

  const amenities = property.features.amenities.length > 0 ? property.features.amenities : ['Patio de lavado', 'Estacionamiento', 'Cocina equipada', 'Seguridad 24h'];

  page2.innerHTML = `
    ${renderHeader(2)}

    <!-- Amenidades -->
    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 15px; font-weight: bold; color: #0f172a; margin: 0 0 10px 0;">Amenidades</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${amenities.map(a => `
          <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 20px; font-size: 11px; color: #334155; font-weight: 500;">
            🧺 ${a}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Estado de la propiedad -->
    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 15px; font-weight: bold; color: #0f172a; margin: 0 0 10px 0;">Estado de la propiedad</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div style="background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 10px; color: #64748b; margin-bottom: 2px;">Situación legal:</div>
          <div style="font-size: 12px; font-weight: bold; color: #0f172a;">Documentación en regla / Libre de hipoteca</div>
        </div>
        <div style="background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 10px; color: #64748b; margin-bottom: 2px;">Libre de gravamen:</div>
          <div style="font-size: 12px; font-weight: bold; color: #0f172a;">Sí</div>
        </div>
      </div>
    </div>

    <!-- Detalle comercial -->
    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 15px; font-weight: bold; color: #0f172a; margin: 0 0 10px 0;">Detalle comercial</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div style="background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 10px; color: #64748b; margin-bottom: 2px;">Detalles de pago:</div>
          <div style="font-size: 12px; font-weight: bold; color: #0f172a;">Se aceptan recursos propios y créditos hipotecarios</div>
        </div>
        <div style="background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 10px; color: #64748b; margin-bottom: 2px;">Aceptan crédito:</div>
          <div style="font-size: 12px; font-weight: bold; color: #0f172a;">Sí (Bancario, Infonavit, Fovissste)</div>
        </div>
      </div>
    </div>

    <!-- Ubicación y Mapa -->
    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 15px; font-weight: bold; color: #0f172a; margin: 0 0 10px 0;">Ubicación</h3>
      <div style="display: flex; gap: 16px; background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; align-items: flex-start;">
        <div style="flex: 1; font-size: 11px; color: #334155; line-height: 1.6;">
          <div><strong style="color: #64748b;">Calle:</strong> ${property.location.address}</div>
          <div><strong style="color: #64748b;">Colonia:</strong> ${property.location.neighborhood || 'Fraccionamiento Las Trojes'}</div>
          <div><strong style="color: #64748b;">Delegación/Municipio:</strong> ${property.location.city}</div>
          <div><strong style="color: #64748b;">Código postal:</strong> ${property.location.zipCode || '76900'}</div>
          ${property.location.references ? `<div style="margin-top: 6px;"><strong style="color: #64748b;">Referencias:</strong> ${property.location.references}</div>` : ''}
        </div>
        <div style="width: 320px; display: flex; flex-direction: column; gap: 10px;">
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #2563eb; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">📍</div>
            <div style="font-size: 10px; color: #1e3a8a; line-height: 1.4;">
              <div style="font-weight: bold;">${property.location.neighborhood || property.location.city}</div>
              <div>${property.location.city}, ${property.location.state}</div>
            </div>
          </div>
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; display: flex; gap: 10px; align-items: center;">
            <img src="${locationQrDataUrl}" style="width: 90px; height: 90px; flex-shrink: 0; border-radius: 4px;" />
            <div style="font-size: 9px; color: #334155; line-height: 1.4;">
              <div style="font-weight: bold; color: #0f172a; margin-bottom: 2px;">Escanea o copia el link para ver el mapa</div>
              <div style="word-break: break-all; color: #2563eb;">${mapsSearchUrl}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    ${renderFooter()}
  `;

  container.appendChild(page2);

  // --- PÁGINAS 3 Y 4 (ÁLBUM FOTOGRÁFICO RESTANTE) ---
  if (remainingImages.length > 0) {
    const pagesPhotos = [
      remainingImages.slice(0, 8),
      remainingImages.slice(8, 16),
    ].filter(arr => arr.length > 0);

    pagesPhotos.forEach((photoGroup, idx) => {
      const pageNum = idx + 3;
      const pagePhoto = document.createElement('div');
      pagePhoto.style.width = '794px';
      pagePhoto.style.height = '1123px';
      pagePhoto.style.padding = '32px';
      pagePhoto.style.boxSizing = 'border-box';
      pagePhoto.style.backgroundColor = '#ffffff';
      pagePhoto.style.display = 'flex';
      pagePhoto.style.flexDirection = 'column';
      pagePhoto.style.fontFamily = 'Helvetica, Arial, sans-serif';

      pagePhoto.innerHTML = `
        ${renderHeader(pageNum)}
        
        <h3 style="font-size: 14px; font-weight: bold; color: #0f172a; margin: 0 0 12px 0;">Galería de imágenes</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex: 1; align-content: start;">
          ${photoGroup.map(img => `
            <div style="height: 180px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
              <img src="${img.url}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
          `).join('')}
        </div>

        ${renderFooter()}
      `;

      container.appendChild(pagePhoto);
    });
  }

  document.body.appendChild(container);

  try {
    // Esperar precarga de imágenes
    await new Promise(resolve => setTimeout(resolve, 600));

    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageElements = Array.from(container.children) as HTMLElement[];

    for (let i = 0; i < pageElements.length; i++) {
      const pageEl = pageElements[i];
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, 595.28, 841.89);
    }

    const cleanTitle = property.title.replace(/[^a-zA-Z0-9]/g, '_');
    pdf.save(`Ficha_${cleanTitle}_${Date.now()}.pdf`);

  } catch (error) {
    console.error('Error al generar el PDF de la propiedad:', error);
    throw new Error('No se pudo generar la ficha en PDF.');
  } finally {
    document.body.removeChild(container);
  }
}

export default exportPropertyToPDF;
